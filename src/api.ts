import * as express from 'express'
import { Logger } from './logger'
import { inject, injectable } from 'inversify'
import * as User from './models'
import { UserApi } from './api/user'
import { Request, Response } from './interfaces'


@injectable()
export class Api {

    constructor( @inject(Logger) private logger: Logger, @inject(UserApi) private userApi: UserApi) { }

    getRouter() {
        let router = express.Router()
        router.get('/', this.helloWorld.bind(this))
        router.use('/users', this.userApi.getRouter())
        return router
    }

    helloWorld(req: Request, res: Response) {
        res.send('hello world')
    }
}