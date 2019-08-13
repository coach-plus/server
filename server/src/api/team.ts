import * as express from 'express'
import { Logger } from '../logger'
import { inject, injectable } from 'inversify'
import {
    Team, ITeam, ITeamModel, Event, IEvent, IUserModel, Invitation,
    IInvitation, Membership, IMembership, IInvitationModel, reduceUser, Participation,
    IParticipationModel, News, INews, reducedUserPopulationFields, MembershipRole
} from '../models'
import { validate, registerTeamSchema, eventSchema, newsSchema } from '../validation'
import { Config } from '../config'
import { Request, Response } from '../interfaces'
import {
    authenticationMiddleware, getRoleOfUserForTeam, authenticatedUserIsMemberOfTeam,
    authenticatedUserIsCoach, authenticatedUserIsUser
} from '../auth'
import { sendError, sendSuccess, sendErrorCode, sendSuccessCode } from '../api'
import * as Uuid from 'uuid/v4'
import { ImageManager } from "../imagemanager"
import { Notifications } from "../notifications"
import * as ResponseCodes from '../responseCodes'
import { InternalServerError, EventNotFound, Unauthorized, TeamAlreadyExists, JoinTokenNotValid, UserAlreadyMember, EventNotStartedYet, MembershipNotFound } from '../responseCodes';


@injectable()
export class TeamApi {

    constructor(@inject(Logger) private logger: Logger, @inject(Config) private config: Config,
        @inject(ImageManager) private imageManager: ImageManager, @inject(Notifications) private notifications: Notifications) {
    }

    getRouter() {
        let router = express.Router()
        router.get('/:teamId', this.getPublicTeamById.bind(this))
        router.use(authenticationMiddleware(this.config.get('jwt_secret')))
        router.get('/my', this.getMyTeams.bind(this))
        router.post('/register', this.register.bind(this))
        router.post('/private/join/:token', this.joinPrivateTeam.bind(this))
        router.post('/public/join/:teamId', this.joinPublicTeam.bind(this))
        router.get('/:teamId/members', this.getTeamMembers.bind(this))
        router.delete('/:teamId/memberships', this.leaveTeam.bind(this))
        router.post('/:teamId/invite', this.invite.bind(this))
        router.put('/:teamId', this.editTeam.bind(this))
        router.delete('/:teamId', authenticatedUserIsCoach, this.deleteTeam.bind(this))

        let eventRouter = express.Router({ mergeParams: true })
        eventRouter.use(authenticatedUserIsMemberOfTeam)
        eventRouter.get('/', this.getEvents.bind(this))
        eventRouter.post('/', authenticatedUserIsCoach, this.createEvent.bind(this))
        eventRouter.get('/:eventId', this.getEvent.bind(this))
        eventRouter.post('/:eventId/reminder', authenticatedUserIsCoach, this.sendReminder.bind(this))
        eventRouter.put('/:eventId', authenticatedUserIsCoach, this.updateEvent.bind(this))
        eventRouter.delete('/:eventId', authenticatedUserIsCoach, this.deleteEvent.bind(this))
        eventRouter.get('/:eventId/participation', this.getParticipations.bind(this))
        eventRouter.put('/:eventId/participation/:userId/didAttend', authenticatedUserIsCoach, this.setUserDidAttend.bind(this))
        eventRouter.put('/:eventId/participation/:userId/willAttend', authenticatedUserIsUser('userId'), this.setUserWillAttend.bind(this))
        router.use('/:teamId/events', eventRouter)

        let newsRouter = express.Router({ mergeParams: true })
        newsRouter.get('/', this.getNews.bind(this))
        newsRouter.delete('/:newsId', authenticatedUserIsCoach, this.deleteNews.bind(this))
        newsRouter.post('/', authenticatedUserIsCoach, this.createNews.bind(this))
        router.use('/:teamId/events/:eventId/news', newsRouter);

        return router
    }

    async getPublicTeamById(req: Request, res: Response) {
        try {
            let teamId = req.params['teamId']
            console.log(teamId)
            const team = await Team.find({ _id: teamId, isPublic: true })
            console.log(team)
            if (!team || !team.length || team.length < 1) {
                sendErrorCode(res, ResponseCodes.TeamNotFound)
                return
            }
            sendSuccess(res, 200, team[0])
        } catch (error) {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        }
    }

    getEvents(req: Request, res: Response) {
        let teamId = req.params['teamId']
        Event.find({ team: teamId }).then(events => {
            sendSuccess(res, 200, { events: events })
        }).catch(error => {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        })
    }

    @validate(eventSchema)
    createEvent(req: Request, res: Response) {
        let teamId = req.params['teamId']
        let model = <IEvent>req.body
        model.team = teamId
        Event.create(model).then(createdEvent => {
            this.notifications.sendReminder(createdEvent, req.authenticatedUser._id)
            sendSuccessCode(res, { event: createdEvent }, ResponseCodes.EventCreated)
        }).catch(error => {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        })
    }

    deleteEvent(req: Request, res: Response) {
        let eventId = req.params['eventId']
        let teamId = req.params['teamId']
        Event.findOneAndRemove({ _id: eventId, team: teamId }).then(() => {
            sendSuccessCode(res, {}, ResponseCodes.EventDeleted)
        }).catch(error => {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        })
    }

    async deleteTeam(req: Request, res: Response) {
        let teamId = req.params['teamId']

        try {
            await Membership.deleteMany({ team: teamId })
            await Team.findByIdAndRemove(teamId)
            sendSuccessCode(res, {}, ResponseCodes.TeamDeleted)
        } catch (e) {
            this.logger.error(e)
            sendErrorCode(res, InternalServerError)
        }
    }

    updateEvent(req: Request, res: Response) {
        let eventId = req.params['eventId']
        let teamId = req.params['teamId']
        let model = <IEvent>req.body
        Event.findOneAndUpdate({ _id: eventId, team: teamId }, model, { new: true })
            .then(updatedEvent => {
                if (updatedEvent == null) {
                    sendErrorCode(res, EventNotFound)
                    return
                }
                sendSuccessCode(res, { event: updatedEvent }, ResponseCodes.EventUpdated)
            }).catch(error => {
                this.logger.error(error)
                sendErrorCode(res, InternalServerError)
            })
    }

    sendReminder(req: Request, res: Response) {
        let eventId = req.params['eventId']
        Event.findById(eventId).then(event => {
            this.notifications.sendReminder(event, req.authenticatedUser._id)
            sendSuccessCode(res, {}, ResponseCodes.ReminderSent)
        }).catch(err => {
            this.logger.error(err)
            sendErrorCode(res, InternalServerError)
        })
    }

    getEvent(req: Request, res: Response) {
        let teamId = req.params['teamId']
        let eventId = req.params['eventId']
        Event.findOne({ _id: eventId, team: teamId }).then(event => {
            if (event == null) {
                sendErrorCode(res, EventNotFound)
                return
            }
            sendSuccess(res, 200, { event: event })
        }).catch(error => {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        })
    }

    getTeamMembers(req: Request, res: Response) {
        let teamId = req.params['teamId']
        Membership.findOne({ user: req.authenticatedUser._id, team: teamId })
            .then(userModel => {
                if (userModel == null) {
                    sendErrorCode(res, Unauthorized)
                    return
                }
                return Membership.find({ team: teamId }).populate('user').exec()
                    .then(memberships => memberships.sort((p1, p2) => {
                        if ((<IUserModel>p1.user).id === req.authenticatedUser._id) {
                            return -1
                        } else if ((<IUserModel>p2.user).id === req.authenticatedUser._id) {
                            return 1
                        } else if ((<IUserModel>p1.user).lastname < (<IUserModel>p2.user).lastname) {
                            return -1
                        } else {
                            return 1
                        }
                    }).map(membership => (
                        {
                            _id: membership._id,
                            role: membership.role,
                            user: reduceUser(<IUserModel>membership.user)
                        })))
                    .then(members => sendSuccess(res, 200, { members: members }))
            }).catch(error => {
                sendErrorCode(res, InternalServerError)
                this.logger.error(error)
            })
    }

    getMyTeams(req: Request, res: Response) {
        Membership.find({ user: req.authenticatedUser._id }).populate('team').exec()
            .then(memberships => memberships.map(membership => membership.team))
            .then(teams => sendSuccess(res, 200, { teams: teams }))
            .catch(error => {
                sendErrorCode(res, InternalServerError)
                this.logger.error(error)
            })
    }

    @validate(registerTeamSchema)
    async register(req: Request, res: Response) {
        try {
            let payload: ITeam = req.body
            let createdTeam: ITeamModel = null

            if (payload.isPublic) {
                const existingTeam = await Team.findOne({ name: payload.name, isPublic: true })
                if (existingTeam != null) {
                    sendErrorCode(res, TeamAlreadyExists)
                    return
                }
            }

            let imageName = null
            if (payload.image) {
                imageName = await this.imageManager.storeImageAsFile(payload.image)
            }
            createdTeam = await Team.create({ name: payload.name, isPublic: payload.isPublic, image: imageName })

            let membership: IMembership = { role: MembershipRole.COACH, team: createdTeam._id, user: req.authenticatedUser._id }
            const createdMembership = await Membership.create(membership)
            let populatedMembership = await Membership.findOne({ _id: createdMembership.id }).populate('team')
            populatedMembership = populatedMembership.toJSON()
            const team = populatedMembership.team as ITeam
            team.memberCount = 1
            sendSuccessCode(res, populatedMembership, ResponseCodes.UserRegistered)
        }
        catch (error) {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        }
    }

    async editTeam(req: Request, res: Response) {
        try {
            let teamId = req.params['teamId']
            let payload = req.body as ITeam
            let updateImage = (payload.image != null && payload.image !== '')

            const updateTeam = {
                $set: {
                    name: payload.name,
                    isPublic: payload.isPublic
                }
            }
            if (updateImage) {
                const imageName = await this.imageManager.storeImageAsFile(payload.image)
                updateTeam.$set["image"] = imageName
            }
            await Team.findByIdAndUpdate(teamId, updateTeam)

            const team = await Team.findById(teamId)
            sendSuccessCode(res, team, ResponseCodes.UpdatedTeam)
        }
        catch (error) {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        }
    }


    invite(req: Request, res: Response) {
        let teamId = req.params['teamId']
        let validationPeriodInDays = req.query['validDays'] || 7
        let team: ITeamModel
        let appUrl = this.config.get('app_url')

        Team.findOne({ _id: teamId }).then(model => {
            team = model
            if (model == null) {
                sendErrorCode(res, ResponseCodes.TeamNotFound)
                return
            }
            if (team.isPublic) {
                let url = `${appUrl}teams/public/join/${model._id}`
                sendSuccess(res, 201, { url: url })
                return
            }
            return getRoleOfUserForTeam(req.authenticatedUser._id, team._id)
                .then(role => {
                    if (role != MembershipRole.COACH) {
                        sendErrorCode(res, Unauthorized)
                        return
                    }
                    let today = new Date()
                    let validUntil = new Date()
                    let token = Uuid()
                    validUntil.setDate(today.getDate() + validationPeriodInDays)
                    let invitation: IInvitation = { team: teamId, token: token, validUntil: validUntil }
                    return Invitation.create(invitation).then((model: IInvitationModel) => {
                        let url = `${appUrl}teams/private/join/${model.token}`
                        sendSuccess(res, 201, { url: url })
                    })
                })
        }).catch(error => {
            sendErrorCode(res, InternalServerError)
            this.logger.error(error)
        })
    }


    async joinPrivateTeam(req: Request, res: Response) {
        const token = req.params['token']
        const result = await Invitation.find({ token: token }).populate('team').exec()
        try {
            if (!result || !result.length || result.length != 1) {
                sendError(res, 404, 'the token is not valid')
                return
            }
            const invitationModel = result[0]
            if (invitationModel == null) {
                sendErrorCode(res, JoinTokenNotValid)
                return
            }
            if (invitationModel.validUntil.getTime() < Date.now()) {
                sendErrorCode(res, JoinTokenNotValid)
                return
            }
            const existingMembership = await Membership.findOne({ user: req.authenticatedUser._id, team: invitationModel.team }).populate('team')
            if (existingMembership != null) {
                sendErrorCode(res, UserAlreadyMember)
                return
            }
            const membership: IMembership = { role: MembershipRole.USER, team: invitationModel.team, user: req.authenticatedUser._id }
            await Membership.create(membership)
            sendSuccessCode(res, membership, ResponseCodes.TeamJoined)
        }
        catch (error) {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        }
    }

    joinPublicTeam(req: Request, res: Response) {
        let teamId = req.params['teamId']
        Team.findOne({ _id: teamId }).then(team => {
            if (team == null || !team.isPublic) {
                sendErrorCode(res, ResponseCodes.TeamNotFound)
                return
            }
            return Membership.findOne({ user: req.authenticatedUser._id, team: teamId })
                .then(userModel => {
                    if (userModel != null) {
                        sendErrorCode(res, UserAlreadyMember)
                        return
                    }
                    let membership: IMembership = { role: MembershipRole.USER, team: team, user: req.authenticatedUser._id }
                    return Membership.create(membership).then(() => sendSuccessCode(res, membership, ResponseCodes.TeamJoined))
                })
        }).catch(error => {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        })
    }

    // TODO validate body
    setUserWillAttend(req: Request, res: Response) {
        let userId = req.params.userId
        let eventId = req.params.eventId
        let willAttend = req.body.willAttend
        Event.findOne({ _id: eventId }).then(event => {
            if (event == null) {
                sendErrorCode(res, ResponseCodes.EventNotFound)
                return
            }
            if (event.start.getTime() < new Date().getTime()) {
                sendErrorCode(res, ResponseCodes.EventAlreadyStarted)
                return
            }
            return Participation.findOneAndUpdate({ event: eventId, user: userId }, { $set: { willAttend: willAttend } }, { upsert: true, new: true })
                .then(result => {
                    sendSuccessCode(res, result, ResponseCodes.ParticipationUpdated)
                })
        }).catch(error => {
            sendErrorCode(res, ResponseCodes.InternalServerError)
            this.logger.error(error)
        })
    }

    setUserDidAttend(req: Request, res: Response) {
        let userId = req.params.userId
        let eventId = req.params.eventId
        let didAttend = req.body.didAttend

        Event.findOne({ _id: eventId }).then(event => {
            if (event == null) {
                sendErrorCode(res, EventNotFound)
                return
            }
            if (event.start.getTime() > new Date().getTime()) {
                sendErrorCode(res, EventNotStartedYet)
                return
            }
            return Participation.findOneAndUpdate({ event: eventId, user: userId }, { $set: { didAttend: didAttend } }, { upsert: true, new: true })
                .then(result => {
                    sendSuccess(res, 200, result)
                })
        }).catch(error => {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        })
    }

    async getParticipations(req: Request, res: Response) {
        try {
            let teamId = req.params.teamId
            let eventId = req.params.eventId
            let participationList: { user: IUserModel, participation: IParticipationModel }[] = []

            const result = await Promise.all([
                Membership.find({ team: teamId }).populate('user', reducedUserPopulationFields).exec(),
                Participation.find({ event: eventId }).exec()
            ])

            let memberships = result[0]
            let participation = result[1]
            let participationMap = new Map<string, IParticipationModel>()
            participation.forEach(participation => {
                participationMap.set('' + <string>participation.user, participation)
            })
            memberships.forEach(membership => {
                let key = '' + (<IUserModel>membership.user)._id
                let participation = participationMap.get(key) || null
                participationList.push({
                    user: <IUserModel>membership.user,
                    participation: participation
                })
            })

            participationList = participationList.sort((p1, p2) => {
                if (p1.user.id === req.authenticatedUser._id) {
                    return -1
                } else if (p2.user.id === req.authenticatedUser._id) {
                    return 1
                } else if (p1.user.lastname < p2.user.lastname) {
                    return -1
                } else {
                    return 1
                }
            })
            sendSuccess(res, 200, { participation: participationList })

        } catch (error) {
            sendErrorCode(res, ResponseCodes.InternalServerError)
        }
    }


    //
    // News
    //

    getNews(req: Request, res: Response) {
        let eventId = req.params['eventId']
        News.find({ event: eventId }).sort('-created').populate('author', reducedUserPopulationFields).exec().then(news => {
            sendSuccess(res, 200, { news: news })
        }).catch(error => {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        })
    }

    deleteNews(req: Request, res: Response) {
        let newsId = req.params['newsId']
        News.findOneAndRemove({ _id: newsId }).then(() => {
            sendSuccessCode(res, {}, ResponseCodes.AnnouncementDeleted)
        }).catch(error => {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        })
    }

    @validate(newsSchema)
    createNews(req: Request, res: Response) {
        let eventId = req.params['eventId']
        let userId = req.authenticatedUser._id
        let model = <INews>req.body
        model.event = eventId
        model.author = userId
        News.create(model).then(createdNews => {
            this.notifications.sendNews(createdNews, req.authenticatedUser._id)
            sendSuccessCode(res, { news: createdNews }, ResponseCodes.AnnouncementCreated)
        }).catch(error => {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        })
    }

    async leaveTeam(req: Request, res: Response) {
        let teamId = req.params['teamId']

        try {
            const ownMembership = await Membership.findOne({ team: teamId, user: req.authenticatedUser._id })
            if (!ownMembership) {
                sendErrorCode(res, MembershipNotFound)
                return
            }
            const numberOfCoaches = await Membership.count({ team: teamId, role: MembershipRole.COACH })
            if (ownMembership.role === MembershipRole.COACH && numberOfCoaches == 1) {
                sendErrorCode(res, ResponseCodes.LastCoachCantLeaveTeam)
                return
            }
            await Membership.findOneAndRemove({ team: teamId, user: req.authenticatedUser._id })
            sendSuccessCode(res, {}, ResponseCodes.LeftTeam)
        }
        catch (error) {
            this.logger.error(error)
            sendErrorCode(res, ResponseCodes.InternalServerError)
        }
    }
}
