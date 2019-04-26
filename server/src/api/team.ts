import * as express from 'express'
import { Logger } from '../logger'
import { inject, injectable } from 'inversify'
import { User, Team, ITeam, ITeamModel, IEventModel, Event, IEvent, Verification, IUserModel, IUser, Invitation, IInvitation, Membership, IMembership, IInvitationModel, reduceUser, Participation, IParticipationModel, News, INewsModel, INews, reducedUserPopulationFields, MembershipRole } from '../models'
import { validate, registerUserSchema, loginUserSchema, registerTeamSchema, eventSchema, newsSchema } from '../validation'
import { Config } from '../config'
import { Request, Response, IApiResponse } from '../interfaces'
import { authenticationMiddleware, getRoleOfUserForTeam, authenticatedUserIsMemberOfTeam, authenticatedUserIsCoach, isUserCoachOfTeam, authenticatedUserIsUser } from '../auth'
import { sendError, sendSuccess, sendErrorCode } from '../api'
import * as Uuid from 'uuid/v4'
import { ImageManager } from "../imagemanager"
import { Notifications } from "../notifications"
import * as Errors from '../errors'


@injectable()
export class TeamApi {

    constructor(@inject(Logger) private logger: Logger, @inject(Config) private config: Config,
        @inject(ImageManager) private imageManager: ImageManager, @inject(Notifications) private notifications: Notifications) {
    }

    getRouter() {
        let router = express.Router()
        router.use(authenticationMiddleware(this.config.get('jwt_secret')))
        router.get('/my', this.getMyTeams.bind(this))
        router.post('/register', this.register.bind(this))
        router.post('/private/join/:token', this.joinPrivateTeam.bind(this))
        router.post('/public/join/:teamId', this.joinPublicTeam.bind(this))
        router.put('/:teamId/coaches/:userId', this.promoteUser.bind(this))
        router.get('/:teamId/members', this.getTeamMembers.bind(this))
        router.delete('/:teamId/memberships', this.leaveTeam.bind(this))
        router.post('/:teamId/invite', this.invite.bind(this))
        router.put('/:teamId', this.editTeam.bind(this))
        router.delete('/:teamId', authenticatedUserIsCoach, this.deleteTeam.bind(this))

        // todo leave team
        // todo delete team ?

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

    getEvents(req: Request, res: Response) {
        let teamId = req.params['teamId']
        Event.find({ team: teamId }).then(events => {
            sendSuccess(res, 200, { events: events })
        }).catch(error => {
            this.logger.error(error)
            sendError(res, 500, 'internal server error')
        })
    }

    @validate(eventSchema)
    createEvent(req: Request, res: Response) {
        let teamId = req.params['teamId']
        let model = <IEvent>req.body
        model.team = teamId
        Event.create(model).then(createdEvent => {
            this.notifications.sendReminder(createdEvent, req.authenticatedUser._id)
            sendSuccess(res, 201, { event: createdEvent })
        }).catch(error => {
            this.logger.error(error)
            sendError(res, 500, 'internal server error')
        })
    }

    deleteEvent(req: Request, res: Response) {
        let eventId = req.params['eventId']
        let teamId = req.params['teamId']
        Event.findOneAndRemove({ _id: eventId, team: teamId }).then(() => {
            sendSuccess(res, 200, {})
        }).catch(error => {
            this.logger.error(error)
            sendError(res, 500, error)
        })
    }

    async deleteTeam(req: Request, res: Response) {
        let teamId = req.params['teamId']

        try {
            await Membership.deleteMany({ team: teamId })
            await Team.findByIdAndRemove(teamId)
            sendSuccess(res, 200, {})
        } catch (e) {
            sendError(res, 500, e)
        }
    }

    updateEvent(req: Request, res: Response) {
        let eventId = req.params['eventId']
        let teamId = req.params['teamId']
        let model = <IEvent>req.body
        Event.findOneAndUpdate({ _id: eventId, team: teamId }, model, { new: true })
            .then(updatedEvent => {
                if (updatedEvent == null) {
                    sendError(res, 404, 'not found')
                    return
                }
                sendSuccess(res, 200, { event: updatedEvent })
            }).catch(error => {
                this.logger.error(error)
                sendError(res, 500, 'internal server error')
            })
    }

    sendReminder(req: Request, res: Response) {
        let eventId = req.params['eventId']
        Event.findById(eventId).then(event => {
            this.notifications.sendReminder(event, req.authenticatedUser._id)
            sendSuccess(res, 200, {})
        }).catch(err => {
            sendError(res, 500, err)
        })
    }

    getEvent(req: Request, res: Response) {
        let teamId = req.params['teamId']
        let eventId = req.params['eventId']
        Event.findOne({ _id: eventId, team: teamId }).then(event => {
            if (event == null) {
                sendError(res, 404, 'not found')
                return
            }
            sendSuccess(res, 200, { event: event })
        }).catch(error => {
            this.logger.error(error)
            sendError(res, 500, 'internal server error')
        })
    }

    getTeamMembers(req: Request, res: Response) {
        let teamId = req.params['teamId']
        Membership.findOne({ user: req.authenticatedUser._id, team: teamId })
            .then(userModel => {
                if (userModel == null) {
                    sendError(res, 401, 'user is not a member of the team')
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
                sendError(res, 500, 'internal server error')
                this.logger.error(error)
            })
    }

    getMyTeams(req: Request, res: Response) {
        Membership.find({ user: req.authenticatedUser._id }).populate('team').exec()
            .then(memberships => memberships.map(membership => membership.team))
            .then(teams => sendSuccess(res, 200, { teams: teams }))
            .catch(error => {
                sendError(res, 500, 'internal server error')
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
                    sendError(res, 400, 'team does already exist')
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
            sendSuccess(res, 201, populatedMembership)
        }
        catch (error) {
            this.logger.error(error)
            sendError(res, 500, 'internal server error')
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
            sendSuccess(res, 200, team)
        }
        catch (error) {
            sendError(res, 500, 'Errors occurred')
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
                sendError(res, 404, 'team does not exist')
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
                        sendError(res, 400, 'user is not authorized')
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
            sendError(res, 500, 'internal server error')
            this.logger.error(error)
        })
    }


    joinPrivateTeam(req: Request, res: Response) {
        let token = req.params['token']
        Invitation.findOne({ token: token }).then(invitationModel => {
            if (invitationModel == null) {
                sendError(res, 404, 'the token is not valid')
                return
            }
            if (invitationModel.validUntil.getTime() < Date.now()) {
                sendError(res, 400, 'the token is no longer valid')
                return
            }
            return Membership.findOne({ user: req.authenticatedUser._id, team: invitationModel.team }).populate('team')
                .then(userModel => {
                    if (userModel != null) {
                        sendError(res, 400, 'user is already a member of the team')
                        return
                    }
                    let membership: IMembership = { role: MembershipRole.USER, team: userModel.team, user: req.authenticatedUser._id }
                    return Membership.create(membership).then(() => sendSuccess(res, 201, membership))
                })
        }).catch(error => {
            sendError(res, 500, 'internal server error')
            this.logger.error(error)
        })
    }


    joinPublicTeam(req: Request, res: Response) {
        let teamId = req.params['teamId']
        Team.findOne({ _id: teamId }).then(team => {
            if (team == null || !team.isPublic) {
                sendError(res, 404, 'team does not exist or is not public')
                return
            }
            return Membership.findOne({ user: req.authenticatedUser._id, team: teamId })
                .then(userModel => {
                    if (userModel != null) {
                        sendError(res, 400, 'user is already a member of the team')
                        return
                    }
                    let membership: IMembership = { role: MembershipRole.USER, team: team, user: req.authenticatedUser._id }
                    return Membership.create(membership).then(() => sendSuccess(res, 201, membership))
                })
        }).catch(error => {
            sendError(res, 500, 'internal server error')
            this.logger.error(error)
        })
    }


    promoteUser(req: Request, res: Response) {
        let userId = req.params['userId']
        let teamId = req.params['teamId']
        getRoleOfUserForTeam(req.authenticatedUser._id, teamId)
            .then(role => {
                if (role != MembershipRole.COACH) {
                    sendError(res, 400, 'user is not authorized')
                    return
                }
                return Membership.findOne({ user: userId, team: teamId }).then(model => {
                    if (model == null) {
                        sendError(res, 400, 'user is not a member of the team')
                        return
                    }
                    model.role = MembershipRole.COACH
                    return model.save().then(() => sendSuccess(res, 200, {}))
                })
            }).catch(error => {
                sendError(res, 500, 'internal server error')
                this.logger.error(error)
            })
    }

    // TODO validate body
    setUserWillAttend(req: Request, res: Response) {
        let userId = req.params.userId
        let eventId = req.params.eventId
        let willAttend = req.body.willAttend
        Event.findOne({ _id: eventId }).then(event => {
            if (event == null) {
                sendError(res, 404, 'event not found')
                return
            }
            if (event.start.getTime() < new Date().getTime()) {
                sendError(res, 400, 'event has already started')
                return
            }
            return Participation.findOneAndUpdate({ event: eventId, user: userId }, { $set: { willAttend: willAttend } }, { upsert: true, new: true })
                .then(result => {
                    sendSuccess(res, 200, result)
                })
        }).catch(error => {
            sendError(res, 500, 'internal server error')
            this.logger.error(error)
        })
    }

    setUserDidAttend(req: Request, res: Response) {
        let userId = req.params.userId
        let eventId = req.params.eventId
        let didAttend = req.body.didAttend

        Event.findOne({ _id: eventId }).then(event => {
            if (event == null) {
                sendError(res, 404, 'event not found')
                return
            }
            if (event.start.getTime() > new Date().getTime()) {
                sendError(res, 400, 'event hasn\'t started yet')
                return
            }
            return Participation.findOneAndUpdate({ event: eventId, user: userId }, { $set: { didAttend: didAttend } }, { upsert: true, new: true })
                .then(result => {
                    sendSuccess(res, 200, result)
                })
        }).catch(error => {
            sendError(res, 500, 'internal server error')
            this.logger.error(error)
        })
    }

    getParticipations(req: Request, res: Response) {
        let teamId = req.params.teamId
        let userId = req.params.userId
        let eventId = req.params.eventId
        let participationList: { user: IUserModel, participation: IParticipationModel }[] = []

        const participation =

            Promise.all([
                Membership.find({ team: teamId }).populate('user', reducedUserPopulationFields).exec(),
                Participation.find({ event: eventId }).exec()
            ]).then(result => {
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
            })
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
            sendError(res, 500, 'internal server error')
        })
    }

    deleteNews(req: Request, res: Response) {
        let newsId = req.params['newsId']
        News.findOneAndRemove({ _id: newsId }).then(() => {
            sendSuccess(res, 200, {})
        }).catch(error => {
            this.logger.error(error)
            sendError(res, 500, error)
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
            sendSuccess(res, 201, { news: createdNews })
        }).catch(error => {
            this.logger.error(error)
            sendError(res, 500, 'internal server error')
        })
    }

    async leaveTeam(req: Request, res: Response) {
        let teamId = req.params['teamId']
        try {
            const numberOfCoaches = await Membership.count({ team: teamId, role: MembershipRole.COACH })
            if(numberOfCoaches < 2){
                sendErrorCode(res, Errors.LastCoachCantLeaveTeam)
                return
            }
            await Membership.findOneAndRemove({ team: teamId, user: req.authenticatedUser._id })
            sendSuccess(res, 200, {})
        }
        catch (error) {
            this.logger.error(error)
            sendErrorCode(res, Errors.InternalServerError)
        }
    }
}
