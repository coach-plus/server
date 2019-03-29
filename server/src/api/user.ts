import * as express from 'express'
import * as jwt from 'jsonwebtoken'
import { Logger } from '../logger'
import { inject, injectable } from 'inversify'
import { User, Verification, IUserModel, IUser, IVerificationModel, reduceUser, Device, IDevice, Membership, IMembershipModel, IMembership, ITeam, ITeamModel} from '../models'
import { validate, registerUserSchema, loginUserSchema, deviceSchema } from '../validation'
import { Config } from '../config'
import { Request, Response, IApiResponse } from '../interfaces'
import { authenticationMiddleware, authenticatedUserIsUser } from '../auth'
import { EmailVerification } from '../emailverification'
import { sendSuccess, sendError } from "../api"
import { ImageManager } from "../imagemanager"
import { Crypto } from "../crypto"

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
        router.put('/me/information',this.editUserInformation.bind(this))
        router.put('/me/image',this.editUserImage.bind(this))
        router.put('/me/password',this.changeUserPassword.bind(this))

        router.get('/:userId/memberships',this.getMemberships.bind(this))
        router.post('/:userId/devices', authenticatedUserIsUser('userId'), this.registerDevice.bind(this))
        return router
    }

    async getMyUser(req: Request, res: Response) {
        try {
            const user = await User.findOne({_id: req.authenticatedUser._id})
            sendSuccess(res, 200, { user: reduceUser(user, true) })
        } catch (error) {
            this.logger.error(error)
            sendError(res, 500)
        }
        
    }

    @validate(registerUserSchema)
    async register(req: Request, res: Response) {
        const payload = req.body;
        const email = payload.email
        const password = payload.password
        const firstname = payload.firstname
        const lastname = payload.lastname
        try{
            const hashedPassword = await Crypto.encryptPassword(password)
            const userModel = await User.findOne({ email: payload.email })
            if (userModel != null) {
                const result: IApiResponse = {
                    success: false,
                    message: 'email address is already registered'
                }
                res.status(400).send(result)
                return
            }
            const createdUser: IUserModel = await User.create({ email: email, password: hashedPassword, firstname: firstname, lastname: lastname })
            const token = this.createJWT(createdUser)
            const result: IApiResponse = {
                success: true,
                content: {
                    token: token,
                    user: reduceUser(createdUser, true)
                }
            }
            res.status(201).send(result)
            this.emailverification.create(createdUser)
        }
        catch(error){
            this.logger.error(error)
                    const result: IApiResponse = {
                        success: false,
                        message: 'internal error'
                    }
                    res.status(500).send(result)
            sendError(res, 500, "internal error")
        }
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
                    user: reduceUser(user, true)
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

    async editUserImage(req: Request, res: Response) {
        let payload = req.body
        let updateImage = (payload.image != null)

        try{
            if (updateImage) {
                const imageName = await this.imageManager.storeImageAsFile(payload.image)
                await User.findByIdAndUpdate(req.authenticatedUser._id, { $set: {image: imageName}})
                const user = await User.findById(req.authenticatedUser._id)
                sendSuccess(res, 200, reduceUser(user, true))
            }
            else {
                sendError(res, 400, "image is missing in payload")
            }
        }
        catch(error){
            sendError(res, 500, 'Errors occured')
        }
    }

    async editUserInformation(req: Request, res: Response){
        try {
            const payload = req.body as { firstname: string, lastname: string, email: string }
            const mongoUpdateOperation = { 
                $set: { 
                    firstname: payload.firstname, 
                    lastname: payload.lastname, 
                    email: payload.email
                }
            }
            await User.findByIdAndUpdate(req.authenticatedUser._id, mongoUpdateOperation)
            const user = await User.findById(req.authenticatedUser._id)
            const myReducedUser = reduceUser(user, true)
            sendSuccess(res, 200, { user : myReducedUser })
        }
        catch(error) {
            sendError(res, 500, 'Errors occured')
        }
    }

    async changeUserPassword(req: Request, res: Response){
        try{
            let payload = req.body as { oldPassword: string, newPassword: string, newPasswordRepeat: string }
            if(!payload.oldPassword || !payload.newPassword || !payload.newPasswordRepeat){
                sendError(res, 400, "oldPassword, newPassword & newPasswordRepeat are required")
                return
            }
            if(payload.newPassword !== payload.newPasswordRepeat){
                sendError(res, 400, "new passwords don't match each other")
                return
            }
            const user = await User.findOne({ _id: req.authenticatedUser._id })
            const isOldPasswordCorrect = await Crypto.comparePassword(payload.oldPassword, user.password)
            if(!isOldPasswordCorrect){
                sendError(res, 400, "wrong password")
                return
            }
            const newPassword = await Crypto.encryptPassword(payload.newPassword)
            await User.findByIdAndUpdate(user._id, { $set : { password: newPassword }})
            sendSuccess(res, 200, {})
        }
        catch(error){
            sendError(res, 500, 'Errors occured')
        }
    }

    @validate(deviceSchema)
    registerDevice(req: Request, res: Response) {
        let device = <IDevice>req.body;
        Device.findOneAndUpdate({ deviceId:device.deviceId }, {
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

                return Promise.all(memberships.map((membership: IMembershipModel) => {
                    if (membership.team != null) {
                        return Membership.count({team: (membership.team as any).id}).then(count => {
                            membership = membership.toJSON()
                            if (membership.team) {
                                (<ITeam>membership.team).memberCount = count
                            }
                            return membership
                        })
                    } else {
                        return new Promise((resolve, reject) => {
                            resolve(membership)
                        })
                    }
                }))
            })
            .then(memberships => {
                if (req.authenticatedUser._id === userId) {
                    sendSuccess(res, 200, { memberships: memberships })
                } else {
                    Membership.find({ user: req.authenticatedUser._id }).populate('team').exec().then(ownMemberships => {
                        let extendedMemberships = memberships.filter((membership: IMembershipModel) => {
                                return ownMemberships.find((ownMembership) => {
                                    return ownMembership.team && ((<ITeamModel>ownMembership.team).id === (<ITeamModel>membership.team)._id.toString() || (<ITeamModel> membership.team).isPublic)
                                })
                            }).map((membership: IMembershipModel) => {
                                let joined = (ownMemberships.find((ownMembership) => {
                                    return ownMembership.team && ((ownMembership.team as any).id === (membership.team as any)._id.toString())
                                }) !== undefined)
                                let m = (membership.toJSON ? membership.toJSON() : membership)
                                m.joined = joined
                                return m
                            })
                        sendSuccess(res, 200, { memberships: extendedMemberships })
                    })
                }
            }).catch(error => {
                sendError(res, 500, 'internal server error')
                this.logger.error(error)
            })
    }


    private createJWT(user: IUserModel) {
        let tokenBody = reduceUser(user, true)
        let token: any = null
        try {
            token = jwt.sign(tokenBody, this.config.get('jwt_secret'), {})
        }
        catch (error) {
            this.logger.error(error)
        }

        return token
    }

    private async checkUserCrendentials(email: string, password: string) {
        const user = await User.findOne({ email: email })
        const passwordCorrect = await Crypto.comparePassword(password, user.password)
        if (passwordCorrect) {
            return user
        }
        throw new Error('wrong password')
    }

}
