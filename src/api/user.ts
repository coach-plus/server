import * as express from 'express'
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { Logger } from '../logger'
import { inject, injectable } from 'inversify'
import { User, Verification } from '../models'
import { validate, registerUserSchema, loginUserSchema } from '../validation'
import { Config } from '../config'
import { Request, Response } from '../interfaces'
import { authenticationMiddleware } from '../auth'


@injectable()
export class UserApi {

    x = {}

    constructor( @inject(Logger) private logger: Logger, @inject(Config) private config: Config) { 
        this.x = {}
    }

    getRouter() {
        let router = express.Router()
        router.post('/register', this.register.bind(this))
        router.post('/login', this.login.bind(this))
        router.use(authenticationMiddleware(this.config.get('jwt_secret')))
        router.get('/secret', (req, res) => res.send('secret'))
        return router
    }

    @validate(registerUserSchema)
    register(req: Request, res: Response) {
        let payload = req.body;
        let email = payload.email
        let password = payload.password
        let firstname = payload.firstname
        let lastname = payload.lastname
        let salt = bcrypt.genSaltSync()
        let hashedPassword = bcrypt.hashSync(password, salt)
        User.findOne({ email: payload.email }).then(userModel => {
            if (userModel != null) {
                res.status(400).send({ error: 'email address is already registered' })
                return
            }
            User.create({ email: email, password: hashedPassword, firstname: firstname, lastname: lastname }).then(() => {
                res.status(201).send({})
            }).catch(error => {
                this.logger.error(error)
                res.status(500).send({ error: 'internal error' })
            })
        })
    }


    @validate(loginUserSchema)
    login(req: Request, res: Response) {
        let email = req.body.email;
        let password = req.body.password;
        this.checkUserCrendentials(email, password).then(user => {
            let tokenBody = {
                id: user.id,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                role: user.role
            }
            let token: any = null
            try {
                token = jwt.sign(tokenBody, this.config.get('jwt_secret'), {})
            }
            catch (error) {
                this.logger.error(error)
                res.status(500).send({ error: 'internal error' })
                return
            }
            res.status(200).send({
                token: token,
                firstame: user.firstname,
                lastname: user.lastname,
                role: user.role
            })
        }).catch((error) => {
            res.status(400).send({ error: 'credentials are not correct' })
        })
    }

    private checkUserCrendentials(email: string, password: string) {
        return new Promise<any>((resolve, reject) => {
            User.findOne({ email: email }).then(user => {
                if (bcrypt.compareSync(password, user.password)) {
                    resolve(user)
                    return
                }
                reject('wrong password')
            }).catch(error => reject(error))
        });
    }

}