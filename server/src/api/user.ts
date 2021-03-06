import * as express from 'express'
import * as jwt from 'jsonwebtoken'
import { Logger } from '../logger'
import { inject, injectable } from 'inversify'
import {
    User, Verification, IUserModel, IVerificationModel, reduceUser, Device,
    IDevice, Membership, IMembershipModel, ITeam, ITeamModel
} from '../models'
import { validate, registerUserSchema, loginUserSchema, deviceSchema } from '../validation'
import { Config } from '../config'
import { Request, Response, IApiResponse } from '../interfaces'
import { authenticationMiddleware, authenticatedUserIsUser } from '../auth'
import { EmailVerification } from '../emailverification'
import { sendSuccess, sendError, sendErrorCode } from "../api"
import { ImageManager } from "../imagemanager"
import { Crypto } from "../crypto"
import * as PasswordGenerator from 'generate-password'
import { Mailer } from '../mailer'
import * as Errors from '../responseCodes'
import { InternalServerError, EmailAlreadyRegistered, CredentialsAreNotCorrect, VerificationTokenNotFound, ImageIsMissing, OldNewAndRepeatPasswordsRequired, WrongPassword, NewPasswordsDoNotMatch, EmailRequired, UserNotFound } from '../responseCodes';

@injectable()
export class UserApi {

    constructor(@inject(Logger) private logger: Logger, @inject(Config) private config: Config,
        @inject(EmailVerification) private emailverification: EmailVerification,
        @inject(ImageManager) private imageManager: ImageManager, @inject(Mailer) private mailer: Mailer) {
    }

    getRouter() {
        let router = express.Router()
        router.post('/register', this.register.bind(this))
        router.post('/login', this.login.bind(this))
        router.post('/verification/:token', this.verifyEmail.bind(this))
        router.put('/password', this.resetPassword.bind(this))
        router.use(authenticationMiddleware(this.config.get('jwt_secret')))
        router.get('/me', this.getMyUser.bind(this))
        router.put('/me/information', this.editUserInformation.bind(this))
        router.put('/me/image', this.editUserImage.bind(this))
        router.put('/me/password', this.changeUserPassword.bind(this))
        router.post('/me/verification', this.resendVerificationEmail.bind(this))

        router.get('/:userId/memberships', this.getMemberships.bind(this))
        router.post('/:userId/devices', authenticatedUserIsUser('userId'), this.registerDevice.bind(this))
        return router
    }

    async getMyUser(req: Request, res: Response) {
        try {
            const user = await User.findOne({ _id: req.authenticatedUser._id })
            sendSuccess(res, 200, { user: reduceUser(user, true) })
        } catch (error) {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        }

    }

    @validate(registerUserSchema)
    async register(req: Request, res: Response) {
        const payload = req.body;
        const email = payload.email
        const password = payload.password
        const firstname = payload.firstname
        const lastname = payload.lastname
        const termsAccepted = payload.termsAccepted
        const dataPrivacyAccepted = payload.dataPrivacyAccepted
        try {
            const hashedPassword = await Crypto.encryptPassword(password)
            const userModel = await User.findOne({ email: payload.email })
            if (userModel != null) {
                sendErrorCode(res, EmailAlreadyRegistered)
                return
            }
            const createdUser: IUserModel = await User.create({ email: email, password: hashedPassword, firstname: firstname, lastname: lastname, emailVerified: false, termsAccepted: termsAccepted, dataPrivacyAccepted: dataPrivacyAccepted })
            const token = this.createJWT(createdUser)
            const result: IApiResponse = {
                success: true,
                content: {
                    token: token,
                    user: reduceUser(createdUser, true)
                }
            }
            res.status(201).send(result)
            this.emailverification.create(createdUser, true)
        }
        catch (error) {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        }
    }


    @validate(loginUserSchema)
    async login(req: Request, res: Response) {
        let email = req.body.email;
        let password = req.body.password;
        try {
            const user = await User.findOne({ email: email })
            if (user == null) {
                sendErrorCode(res, UserNotFound)
                return
            }
            const isPasswordCorrect = await this.checkUserCrendentials(password, user)
            if (!isPasswordCorrect) {
                sendErrorCode(res, CredentialsAreNotCorrect)
                return
            }
            let token = this.createJWT(user)
            if (!token) {
                sendErrorCode(res, InternalServerError)
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
        }
        catch (error) {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        }
    }

    verifyEmail(req: Request, res: Response) {
        let token = req.params.token
        if (!token) {
            sendErrorCode(res, VerificationTokenNotFound)
            return
        }

        Verification.findOne({ token: token }).populate('user').exec()
            .then((verification: IVerificationModel) => {
                if (!verification) {
                    sendErrorCode(res, VerificationTokenNotFound)
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
                sendErrorCode(res, InternalServerError)
            })
    }

    async editUserImage(req: Request, res: Response) {
        let payload = req.body
        let updateImage = (payload.image != null)

        try {
            if (updateImage) {
                const imageName = await this.imageManager.storeImageAsFile(payload.image)
                await User.findByIdAndUpdate(req.authenticatedUser._id, { $set: { image: imageName } })
                const user = await User.findById(req.authenticatedUser._id)
                sendSuccess(res, 200, reduceUser(user, true))
            }
            else {
                sendErrorCode(res, ImageIsMissing)
            }
        }
        catch (error) {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        }
    }

    async editUserInformation(req: Request, res: Response) {
        try {
            const payload = req.body as { firstname: string, lastname: string, email: string }

            let setObject: any = {
                firstname: payload.firstname,
                lastname: payload.lastname,
                email: payload.email
            }

            if (req.authenticatedUser.email !== setObject.email && setObject.email !== '') {
                setObject.emailVerified = false
            }

            const mongoUpdateOperation = {
                $set: setObject
            }
            await User.findByIdAndUpdate(req.authenticatedUser._id, mongoUpdateOperation)
            const user = await User.findById(req.authenticatedUser._id)
            const myReducedUser = reduceUser(user, true)
            sendSuccess(res, 200, { user: myReducedUser })
        }
        catch (error) {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        }
    }

    async changeUserPassword(req: Request, res: Response) {
        try {
            let payload = req.body as { oldPassword: string, newPassword: string, newPasswordRepeat: string }
            if (!payload.oldPassword || !payload.newPassword || !payload.newPasswordRepeat) {
                sendErrorCode(res, OldNewAndRepeatPasswordsRequired)
                return
            }
            if (payload.newPassword !== payload.newPasswordRepeat) {
                sendErrorCode(res, NewPasswordsDoNotMatch)
                return
            }
            const user = await User.findOne({ _id: req.authenticatedUser._id })
            const isOldPasswordCorrect = await Crypto.comparePassword(payload.oldPassword, user.password)
            if (!isOldPasswordCorrect) {
                sendErrorCode(res, WrongPassword)
                return
            }
            const newPassword = await Crypto.encryptPassword(payload.newPassword)
            await User.findByIdAndUpdate(user._id, { $set: { password: newPassword } })
            sendSuccess(res, 200, {})
        }
        catch (error) {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        }
    }

    async resetPassword(req: Request, res: Response) {
        try {
            let payload = req.body as { email: string }
            if (!payload.email) {
                sendErrorCode(res, EmailRequired)
                return
            }
            const user = await User.findOne({ email: payload.email })

            if (!user) {
                sendErrorCode(res, UserNotFound)
                return
            }

            const newPassword = PasswordGenerator.generate({
                excludeSimilarCharacters: true,
                length: 12,
                numbers: true
            })

            const newPasswordEncrypted = await Crypto.encryptPassword(newPassword)
            await User.findByIdAndUpdate(user._id, { $set: { password: newPasswordEncrypted } })
            this.mailer.sendPasswordEmail(user, newPassword)
            sendSuccess(res, 200, {})
        }
        catch (error) {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        }
    }

    async resendVerificationEmail(req: Request, res: Response) {
        try {
            let userId = req.authenticatedUser._id

            const user = await User.findById(userId)
            if (!user) {
                sendErrorCode(res, Errors.UserNotFound)
                return
            }

            if (user.emailVerified === true) {
                sendErrorCode(res, Errors.EmailAlreadyVerified)
                return
            }

            await this.emailverification.create(user, false)
            sendSuccess(res, 200, {})

        } catch (error) {
            this.logger.error(error)
            sendErrorCode(res, Errors.InternalServerError)
        }
    }

    @validate(deviceSchema)
    async registerDevice(req: Request, res: Response) {
        let payload = req.body as IDevice
        try {
            const device = await Device.findOneAndUpdate({ deviceId: payload.deviceId }, {
                deviceId: payload.deviceId,
                pushId: payload.pushId,
                system: payload.system,
                user: req.authenticatedUser._id
            }, { upsert: true, new: true })

            const user = await User.findById(req.authenticatedUser._id)
            if (user.devices.indexOf(device._id) != -1) {
                sendSuccess(res, 201, { device: device })
            } else {
                user.devices.push(device.id);
                await user.save()
                sendSuccess(res, 201, { device: device })
            }
        }
        catch (error) {
            this.logger.error(error)
            sendErrorCode(res, InternalServerError)
        }
    }

    getMemberships(req: Request, res: Response) {
        let userId = req.params['userId']
        Membership.find({ user: userId }).populate('team').exec()
            .then(memberships => {

                return Promise.all(memberships.map((membership: IMembershipModel) => {
                    if (membership.team != null) {
                        return Membership.count({ team: (membership.team as any).id }).then(count => {
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
                                return ownMembership.team && ((<ITeamModel>ownMembership.team).id === (<ITeamModel>membership.team)._id.toString() || (<ITeamModel>membership.team).isPublic)
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
                this.logger.error(error)
                sendErrorCode(res, InternalServerError)
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

    private async checkUserCrendentials(passwordInput: string, user: IUserModel) {
        const passwordCorrect = await Crypto.comparePassword(passwordInput, user.password)
        return passwordCorrect
    }

}
