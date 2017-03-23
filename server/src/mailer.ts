import { IUserModel } from './models/user';
import { Logger } from './logger'
import { inject, injectable } from 'inversify'
import { IVerification, IUser } from './models'
import { IMailRequest } from './interfaces'
import { PushServer } from "./pushserver";
import { Config } from './config'


@injectable()
export class Mailer {

    appUrl: string

    constructor( @inject(Logger) private logger: Logger, @inject(Config) private config: Config, @inject(PushServer) private pushserver: PushServer) {
        this.appUrl = this.config.get('app_url')
    }

    sendVerificationEmail(verification: IVerification) {

        let user = <IUser>verification.user

        let subject = 'You are registered!'
        let content = `Please click the following link: <a href="${this.appUrl}verification/${verification.token}">Confirm E-Mail Address</a>`
        let to = user.email

        let mailRequest: IMailRequest = {
            html: content,
            subject: subject,
            to: to
        }

        this.pushserver.sendMailRequest(mailRequest)

    }
}