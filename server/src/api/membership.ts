import * as express from 'express'
import { Logger } from '../logger'
import { inject, injectable } from 'inversify'
import { User, Team, ITeam, ITeamModel, Verification, IUserModel, IUser, Invitation, IInvitation, Membership, IMembership, IInvitationModel } from '../models'
import { validate, registerUserSchema, loginUserSchema, registerTeamSchema } from '../validation'
import { Config } from '../config'
import { Request, Response, IApiResponse } from '../interfaces'
import { authenticationMiddleware, getRoleOfUserForTeam, authenticatedUserIsCoachOfMembershipTeam, authenticatedUserIsUser } from '../auth'
import { sendError, sendSuccess } from '../api'
import * as Uuid from 'uuid/v4'


@injectable()
export class MembershipApi {

    constructor( @inject(Logger) private logger: Logger, @inject(Config) private config: Config) {
    }

    getRouter() {
        let router = express.Router()
        router.use(authenticationMiddleware(this.config.get('jwt_secret')))
        router.get('/my', this.getMyMemberships.bind(this))
        router.put('/:membershipId/role', authenticatedUserIsCoachOfMembershipTeam, this.setRole.bind(this))
        return router
    }

    getMyMemberships(req: Request, res: Response) {
        Membership.find({ user: req.authenticatedUser._id }).populate('team').exec()
            .then(memberships => {
                return Promise.all(memberships.map((membership) => {
                    if (!membership.team) {
                        return membership
                    }
                    return Membership.count({team: (<ITeamModel>membership.team)._id}).then(count => {
                        membership = membership.toJSON()
                        if (membership.team) {
                            (<ITeam>membership.team).memberCount = count
                        }
                        return membership
                    })
                }))
            })
            .then(memberships => sendSuccess(res, 200, { memberships: memberships }))
            .catch(error => {
                sendError(res, 500, 'internal server error')
                this.logger.error(error)
            })
    }

    setRole(req: Request, res:Response) {
        let membershipId = req.params['membershipId']
        let role = req.body.role || 'coach'

        if (role != 'coach' && role != 'user') {
            sendError(res, 400, 'Invalid role')
            return
        }
        Membership.findById(membershipId).then(membership => {
            membership.role = role
            membership.save().then(() => {
                sendSuccess(res, 200, '')
            })
        }).catch(error => {
            sendError(res, 500, 'internal server error')
            this.logger.error(error)
        })
    }
}