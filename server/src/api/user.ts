import * as express from 'express'
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { Logger } from '../logger'
import { inject, injectable } from 'inversify'
import { User, Verification, IUserModel, IUser, IVerificationModel } from '../models'
import { validate, registerUserSchema, loginUserSchema } from '../validation'
import { Config } from '../config'
import { Request, Response } from '../interfaces'
import { authenticationMiddleware } from '../auth'
import { EmailVerification } from '../emailverification'


@injectable()
export class UserApi {

    constructor( @inject(Logger) private logger: Logger, @inject(Config) private config: Config, @inject(EmailVerification) private emailverification: EmailVerification) {
    }

    getRouter() {
        let router = express.Router()
        router.post('/register', this.register.bind(this))
        router.post('/login', this.login.bind(this))
        router.post('/verification/:token', this.verifyEmail.bind(this))
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
            User.create({ email: email, password: hashedPassword, firstname: firstname, lastname: lastname }).then((createdUser: IUserModel) => {
                let token = this.createJWT(createdUser)
                res.status(201).send({ token: token })
                this.emailverification.create(createdUser)
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
            let token = this.createJWT(user)
            if (!token) {
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

    verifyEmail(req: Request, res: Response) {
        let token = req.params.token
        if (!token) {
            res.status(404).send({})
            return
        }

        Verification.findOne({ token: token }).populate('user').exec().then((verification: IVerificationModel) => {
            if (!verification) {
                res.status(404).send({})
                return
            }

            let user = <IUserModel>verification.user
            user.emailVerified = true

            user.save().then(() => {
                verification.remove().then(() => {
                    res.status(200).send({})
                }).catch((err) => {
                    this.logger.error(err)
                    res.status(500).send({})
                })
            }).catch((err) => {
                this.logger.error(err)
                res.status(500).send({})
            })
        }).catch((err) => {
            this.logger.error(err)
            res.status(500).send({})
        })


    }

    private createJWT(user: IUserModel) {
        let tokenBody = {
            id: user._id,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname
        }
        let token: any = null
        try {
            token = jwt.sign(tokenBody, this.config.get('jwt_secret'), {})
        }
        catch (error) {
            this.logger.error(error)
        }

        return token
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