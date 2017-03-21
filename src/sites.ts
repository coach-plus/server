import * as express from 'express'
import { Logger } from './logger'
import { inject, injectable } from 'inversify'
import * as User from './models'
import { UserApi } from './api/user'
import { Request, Response } from './interfaces'


@injectable()
export class Sites {

    constructor( @inject(Logger) private logger: Logger) { }

    getRouter() {
        let router = express.Router()
        router.get('/', this.home.bind(this))
        return router
    }

    home(req: Request, res: Response) {
        res.render('home')
    }
}