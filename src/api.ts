import * as express from 'express'
import { Logger } from './logger'
import { inject, injectable } from 'inversify'
import * as User from './models'


@injectable()
export class Api {

    constructor( @inject(Logger) private logger: Logger) { }

    getRouter() {
        let router = express.Router()
        router.get('/', this.helloWorld.bind(this))
        return router
    }

    helloWorld(req: express.Request, res: express.Response) {
        res.send('hello world')
    }
}