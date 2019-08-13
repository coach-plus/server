import * as express from 'express'
import { Logger } from './logger'
import { inject, injectable } from 'inversify'
import { UserApi } from './api/user'
import { TeamApi } from './api/team'
import { MembershipApi } from './api/membership'
import { Request, Response } from './interfaces'
import { IResponseCode } from './responseCodes'
import { InvitationsApi } from './api/invitations';


@injectable()
export class Api {

    constructor( @inject(Logger) private logger: Logger, @inject(UserApi) private userApi: UserApi,
        @inject(TeamApi) private teamApi: TeamApi,
        @inject(MembershipApi) private membershipApi: MembershipApi,
        @inject(InvitationsApi) private invitationsApi: InvitationsApi) { }

    getRouter() {
        let router = express.Router()
        router.use('/users', this.userApi.getRouter())
        router.use('/teams', this.teamApi.getRouter())
        router.use('/memberships', this.membershipApi.getRouter())
        router.use('/invitations', this.invitationsApi.getRouter())
        return router
    }
}

export let sendResponse = (res: Response, statusCode: number, success: boolean, content: any, message: string) => {
    res.status(statusCode).send({
        success: success, content: content, message: message
    })
}

export let sendSuccess = (res: Response, statusCode: number, content: any, message = '') => {
    sendResponse(res, statusCode, true, content, message)
}

export const sendSuccessCode = (res: Response, content: any, status : IResponseCode) => {
    sendSuccess(res, status.statusCode, content, status.message)
}

export let sendError = (res: Response, statusCode: number, errorCode = '') => {
    sendResponse(res, statusCode, false, null, errorCode)
}

export const sendErrorCode = (res: Response, status : IResponseCode) => {
    sendError(res, status.statusCode, status.message)
}