import * as express from 'express'
import { Logger } from '../logger'
import { inject, injectable } from 'inversify'
import { User, Team, ITeam, ITeamModel, IEventModel, Event, IEvent, Verification, IUserModel, IUser, Invitation, IInvitation, Membership, IMembership, IInvitationModel, reduceUser } from '../models'
import { validate, registerUserSchema, loginUserSchema, registerTeamSchema, eventSchema } from '../validation'
import { Config } from '../config'
import { Request, Response, IApiResponse } from '../interfaces'
import { authenticationMiddleware, getRoleOfUserForTeam, authenticatedUserIsMemberOfTeam, authenticatedUserIsCoach } from '../auth'
import { sendError, sendSuccess } from '../api'
import * as Uuid from 'uuid/v4'
import { ImageManager } from "../imagemanager";





@injectable()
export class TeamApi {

    constructor( @inject(Logger) private logger: Logger, @inject(Config) private config: Config, @inject(ImageManager) private imageManager: ImageManager) {
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
        router.post('/:teamId/invite', this.invite.bind(this))

        // todo leave team
        // todo delete team ?

        let eventRouter = express.Router({ mergeParams: true })
        eventRouter.use(authenticatedUserIsMemberOfTeam)
        eventRouter.get('/', this.getEvents.bind(this))
        eventRouter.post('/', authenticatedUserIsCoach, this.createEvent.bind(this))
        eventRouter.get('/:eventId', this.getEvent.bind(this))
        eventRouter.put('/:eventId', authenticatedUserIsCoach, this.updateEvent.bind(this))
        eventRouter.delete('/:eventId', authenticatedUserIsCoach, this.deleteEvent.bind(this))
        router.use('/:teamId/events', eventRouter)
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
        Membership.findOne({ user: req.authenticatedUser.id, team: teamId })
            .then(userModel => {
                if (userModel == null) {
                    sendError(res, 400, 'user is not a member of the team')
                    return
                }
                return Membership.find({ team: teamId }).populate('user').exec()
                    .then(memberships => memberships.map(membership => (
                        {
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
        Membership.find({ user: req.authenticatedUser.id }).populate('team').exec()
            .then(memberships => memberships.map(membership => membership.team))
            .then(teams => sendSuccess(res, 200, { teams: teams }))
            .catch(error => {
                sendError(res, 500, 'internal server error')
                this.logger.error(error)
            })
    }

    @validate(registerTeamSchema)
    register(req: Request, res: Response) {
        let payload: ITeam = req.body
        let createdTeam: ITeamModel = null

        Team.findOne({ name: payload.name }).then(model => {
            if (model != null) {
                sendError(res, 400, 'team does already exist')
                return
            }

            this.imageManager.storeImageAsFile(payload.image).then((imageName) => {
                Team.create({ name: payload.name, isPublic: payload.isPublic, image: imageName })
                    .then(team => {
                        createdTeam = team
                        let membership: IMembership = { role: 'coach', team: team._id, user: req.authenticatedUser.id }
                        return Membership.create(membership)
                    })
                    .then(() => sendSuccess(res, 201, createdTeam))
            }).catch(error => {
                this.logger.error(error)
                sendError(res, 500, 'internal server error')
            })


        })
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
            return getRoleOfUserForTeam(req.authenticatedUser.id, team._id)
                .then(role => {
                    if (role != 'coach') {
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
            return Membership.findOne({ user: req.authenticatedUser.id, team: invitationModel.team })
                .then(userModel => {
                    if (userModel != null) {
                        sendError(res, 400, 'user is already a member of the team')
                        return
                    }
                    let membership: IMembership = { role: 'user', team: invitationModel.team, user: req.authenticatedUser.id }
                    return Membership.create(membership).then(() => sendSuccess(res, 201, {}))
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
            return Membership.findOne({ user: req.authenticatedUser.id, team: teamId })
                .then(userModel => {
                    if (userModel != null) {
                        sendError(res, 400, 'user is already a member of the team')
                        return
                    }
                    let membership: IMembership = { role: 'user', team: team._id, user: req.authenticatedUser.id }
                    return Membership.create(membership).then(() => sendSuccess(res, 201, {}))
                })
        }).catch(error => {
            sendError(res, 500, 'internal server error')
            this.logger.error(error)
        })
    }


    promoteUser(req: Request, res: Response) {
        let userId = req.params['userId']
        let teamId = req.params['teamId']
        getRoleOfUserForTeam(req.authenticatedUser.id, teamId)
            .then(role => {
                if (role != 'coach') {
                    sendError(res, 400, 'user is not authorized')
                    return
                }
                return Membership.findOne({ user: userId, team: teamId }).then(model => {
                    if (model == null) {
                        sendError(res, 400, 'user is not a member of the team')
                        return
                    }
                    model.role = 'coach'
                    return model.save().then(() => sendSuccess(res, 200, {}))
                })
            }).catch(error => {
                sendError(res, 500, 'internal server error')
                this.logger.error(error)
            })
    }
}