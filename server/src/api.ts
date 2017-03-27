import * as express from 'express'
import { Logger } from './logger'
import { inject, injectable } from 'inversify'
import * as User from './models'
import { UserApi } from './api/user'
import { TeamApi } from './api/team'
import { Request, Response } from './interfaces'


@injectable()
export class Api {

    constructor( @inject(Logger) private logger: Logger, @inject(UserApi) private userApi: UserApi, 
    @inject(TeamApi) private teamApi: TeamApi) { }

    getRouter() {
        let router = express.Router()
        router.get('/', this.helloWorld.bind(this))
        router.use('/users', this.userApi.getRouter())
        router.use('/teams', this.teamApi.getRouter())
        return router
    }

    helloWorld(req: Request, res: Response) {
        res.send('hello world')
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

export let sendError = (res: Response, statusCode: number, message = '') => {
    sendResponse(res, statusCode, false, null, message)
}