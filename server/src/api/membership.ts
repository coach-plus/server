import * as express from 'express'
import { Logger } from '../logger'
import { inject, injectable } from 'inversify'
import { User, Team, ITeam, ITeamModel, Verification, IUserModel, IUser, Invitation, IInvitation, Membership, IMembership, IInvitationModel } from '../models'
import { validate, registerUserSchema, loginUserSchema, registerTeamSchema } from '../validation'
import { Config } from '../config'
import { Request, Response, IApiResponse } from '../interfaces'
import { authenticationMiddleware, getRoleOfUserForTeam, authenticatedUserIsCoachOfMembershipTeam, authenticatedUserIsUser, authenticatedUserIsMemberOfTeam, authenticatedUserIsMemberOfMembershipTeam } from '../auth'
import { sendError, sendSuccess, sendSuccessCode, sendErrorCode } from '../api'
import { RoleUpdated, MembershipNotFound, InternalServerError, RoleInvalid, UserRemoved } from '../responseCodes';


@injectable()
export class MembershipApi {

    constructor( @inject(Logger) private logger: Logger, @inject(Config) private config: Config) {
    }

    getRouter() {
        let router = express.Router()
        router.use(authenticationMiddleware(this.config.get('jwt_secret')))
        router.get('/my', this.getMyMemberships.bind(this))
        router.get('/:membershipId', authenticatedUserIsMemberOfMembershipTeam, this.getMembershipById.bind(this))
        router.put('/:membershipId/role', authenticatedUserIsCoachOfMembershipTeam, this.setRole.bind(this))
        router.delete('/:membershipId', authenticatedUserIsCoachOfMembershipTeam, this.removeUserFromTeam.bind(this))
        return router
    }

    getMyMemberships(req: Request, res: Response) {
        Membership.find({ user: req.authenticatedUser._id }).populate('team').exec()
            .then(memberships => {
                return Promise.all(memberships.map((membership) => {
                    if (!membership.team) {
                        return membership
                    }
                    return this.getMemberCount(membership).then(count => {
                        membership = membership.toJSON()
                        if (membership.team) {
                            (<ITeam>membership.team).memberCount = count
                        }
                        return membership
                    })
                }))
            })
            .then(memberships => {
                const sortedMemberships = memberships.sort((a, b) => {
                    if ((a.team as ITeam).name > (b.team as ITeam).name) {
                        return 1;
                    } else if ((a.team as ITeam).name < (b.team as ITeam).name) {
                        return -1;
                    }
                    return 0;
                })
                sendSuccess(res, 200, { memberships: sortedMemberships })
            })
            .catch(error => {
                sendError(res, 500, 'internal server error')
                this.logger.error(error)
            })
    }
    
    async getMembershipById(req: Request, res: Response) {
        let membershipId = req.params['membershipId']
        if (!membershipId) {
            sendErrorCode(res, MembershipNotFound)
            return
        }

        try {
            const membership: IMembership = (await Membership.findById(membershipId).populate('team').exec()).toJSON()
            const team = membership.team as ITeam
            team.memberCount = await this.getMemberCount(membership)
            sendSuccess(res, 200, { membership: membership })
        } catch (e) {
            this.logger.error(e)
            sendErrorCode(res, InternalServerError)
        }
    }

    async getMemberCount(membership: IMembership) {
        return await Membership.count({team: (<ITeamModel>membership.team)._id})
    }

    setRole(req: Request, res:Response) {
        let membershipId = req.params['membershipId']
        let role = req.body.role || 'coach'

        if (role != 'coach' && role != 'user') {
            sendErrorCode(res, RoleInvalid)
            return
        }
        Membership.findById(membershipId).then(membership => {
            membership.role = role
            membership.save().then(() => {
                sendSuccessCode(res, {}, RoleUpdated)
            })
        }).catch(error => {
            sendErrorCode(res, InternalServerError)
            this.logger.error(error)
        })
    }

    async removeUserFromTeam(req: Request, res: Response) {
        try {
            let membershipId = req.params['membershipId']
            await Membership.findByIdAndRemove(membershipId)
            sendSuccessCode(res, {}, UserRemoved)
        } catch (error) {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        }
    }
}