import * as express from 'express'
import { Logger } from '../logger'
import { inject, injectable } from 'inversify'
import { Invitation } from '../models'
import { Request, Response } from '../interfaces'
import { sendSuccess, sendErrorCode } from '../api'
import { InternalServerError, JoinTokenNotValid } from '../responseCodes';


@injectable()
export class InvitationsApi {

    constructor( @inject(Logger) private logger: Logger) {
    }

    getRouter() {
        let router = express.Router()
        router.get('/:token', this.getInvitationById.bind(this))
        return router
    }
    
    async getInvitationById(req: Request, res: Response) {
        let token = req.params['token']
        if (!token) {
            sendErrorCode(res, JoinTokenNotValid)
            return
        }

        try {
            let invitation = await Invitation.findOne({token: token}).populate('team').exec()
            if (!invitation) {
                sendErrorCode(res, JoinTokenNotValid)
                return
            }
            sendSuccess(res, 200, invitation.toJSON())
        } catch (e) {
            this.logger.error(e)
            sendErrorCode(res, InternalServerError)
        }
    }
}