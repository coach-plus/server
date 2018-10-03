import * as express from 'express'
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { Logger } from '../logger'
import { inject, injectable } from 'inversify'
import { User, Verification, IUserModel, IUser, IVerificationModel, reduceUser, Device, IDevice, Membership, IMembershipModel, IMembership, ITeam, ITeamModel} from '../models'
import { validate, registerUserSchema, loginUserSchema, deviceSchema } from '../validation'
import { Config } from '../config'
import { Request, Response, IApiResponse } from '../interfaces'
import { authenticationMiddleware, authenticatedUserIsUser } from '../auth'
import { EmailVerification } from '../emailverification'
import { sendSuccess, sendError } from "../api";
import { ImageManager } from "../imagemanager";

@injectable()
export class UserApi {

    constructor( @inject(Logger) private logger: Logger, @inject(Config) private config: Config,
        @inject(EmailVerification) private emailverification: EmailVerification,
        @inject(ImageManager) private imageManager: ImageManager) {
    }

    getRouter() {
        let router = express.Router()
        router.post('/register', this.register.bind(this))
        router.post('/login', this.login.bind(this))
        router.post('/verification/:token', this.verifyEmail.bind(this))
        router.use(authenticationMiddleware(this.config.get('jwt_secret')))
        router.get('/me', this.getMyUser.bind(this))
        router.put('/me',this.editUser.bind(this))
        router.get('/:userId/memberships',this.getMemberships.bind(this))
        router.post('/:userId/devices', authenticatedUserIsUser('userId'), this.registerDevice.bind(this))
        return router
    }

    getMyUser(req: Request, res: Response) {
        sendSuccess(res, 200, { user: req.authenticatedUser })
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
                let result: IApiResponse = {
                    success: false,
                    message: 'email address is already registered'
                }
                res.status(400).send(result)
                return
            }
            User.create({ email: email, password: hashedPassword, firstname: firstname, lastname: lastname }).then((createdUser: IUserModel) => {
                let token = this.createJWT(createdUser)
                let result: IApiResponse = {
                    success: true,
                    content: {
                        token: token
                    }
                }
                res.status(201).send(result)
                this.emailverification.create(createdUser)
            }).catch(error => {
                this.logger.error(error)
                let result: IApiResponse = {
                    success: false,
                    message: 'internal error'
                }
                res.status(500).send(result)
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
                let result: IApiResponse = {
                    success: false,
                    message: 'internal error'
                }
                res.status(500).send(result)
                return
            }
            let result: IApiResponse = {
                success: true,
                content: {
                    token: token,
                    firstname: user.firstname,
                    lastname: user.lastname
                }
            }
            res.status(200).send(result)
        }).catch((error) => {
            let result: IApiResponse = {
                success: false,
                message: 'credentials are not correct'
            }
            res.status(400).send(result)
        })
    }

    verifyEmail(req: Request, res: Response) {
        let token = req.params.token
        if (!token) {
            let result: IApiResponse = {
                success: false,
                message: 'Not found'
            }
            res.status(404).send(result)
            return
        }

        Verification.findOne({ token: token }).populate('user').exec()
            .then((verification: IVerificationModel) => {
                if (!verification) {
                    let result: IApiResponse = {
                        success: false,
                        message: 'Not found'
                    }
                    res.status(404).send(result)
                    return
                }

                let user = <IUserModel>verification.user
                user.emailVerified = true

                return user.save()
                    .then(() => verification.remove())
                    .then(() => {
                        let result: IApiResponse = {
                            success: true
                        }
                        res.status(200).send(result)
                    })
            }).catch((err) => {
                this.logger.error(err)
                let result: IApiResponse = {
                    success: false,
                    message: 'Internal error'
                }
                res.status(500).send(result)
            })
    }

    editUser(req: Request, res: Response) {

        let payload = req.body
        let updateImage = (payload.image != null)

        let tasks = []

        if (updateImage) {
            tasks.push(new Promise((resolve, reject) => {
                this.imageManager.storeImageAsFile(payload.image).then((imageName) => {
                    return User.findByIdAndUpdate(req.authenticatedUser._id, { $set: {image: imageName}}).then(() => {
                        resolve();
                    })
                }).catch(err => {
                    reject(err);
                })
            }))
        }

        //TODO: Add other fields

        Promise.all(tasks).then(results => {
            User.findById(req.authenticatedUser._id).then(user => {
                sendSuccess(res, 200, reduceUser(user, true))
            })
        }).catch(errs => {
            sendError(res, 500, 'Errors occured')
        })
    }

    @validate(deviceSchema)
    registerDevice(req: Request, res: Response) {
        let device = <IDevice>req.body;
        Device.findOneAndUpdate({deviceId:device.deviceId}, {
            deviceId: device.deviceId,
            pushId: device.pushId,
            system: device.system,
            user: req.authenticatedUser._id
        }, { upsert: true, new: true }).then(device => {

            User.findById(req.authenticatedUser._id).then(user => {
                if (user.devices.indexOf(device._id) != -1) {
                    sendSuccess(res, 201, {device:device})
                } else {
                    user.devices.push(device._id);
                    user.save().then(() => {
                        sendSuccess(res, 201, {device:device})
                    })
                }
            })
        }).catch(err => {
            sendError(res, 500, err)
        })
    }

    getMemberships(req: Request, res: Response) {
        let userId = req.params['userId']
        Membership.find({ user: userId }).populate('team').exec()
            .then(memberships => {
                if (req.authenticatedUser._id === userId) {
                    sendSuccess(res, 200, { memberships: memberships })
                } else {
                    Membership.find({ user: req.authenticatedUser._id }).populate('team').exec().then(ownMemberships => {
                        let newMemberships = memberships.filter((membership) => {
                            return ownMemberships.find((ownMembership) => {
                                return ownMembership.team && ((<ITeamModel>ownMembership.team).id === (<ITeamModel>membership.team).id || (<ITeamModel> membership.team).isPublic)
                            })
                        }).map((membership: IMembershipModel) => {
                            let joined = (ownMemberships.find((ownMembership) => {
                                return ownMembership.team && ((ownMembership.team as any).id === (membership.team as any).id)
                            }) !== undefined)
                            let m = membership.toJSON()
                            m.joined = joined
                            return m
                        })
                        sendSuccess(res, 200, { memberships: newMemberships })
                    })
                }
            })
            .catch(error => {
                sendError(res, 500, 'internal server error')
                this.logger.error(error)
            })
    }


    private createJWT(user: IUserModel) {
        let tokenBody = {
            _id: user._id,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            image: user.image
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
