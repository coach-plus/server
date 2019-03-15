import { IUserModel } from './models/user';
import { Logger } from './logger'
import { inject, injectable } from 'inversify'
import { IVerification, IUser } from './models'
import { IMailRequest } from './interfaces'
import { Config } from './config'

import * as mailgun from 'mailgun-js'


@injectable()
export class Mailer {

    appUrl: string

    constructor( @inject(Logger) private logger: Logger, @inject(Config) private config: Config) {
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

        this.sendMailRequest(mailRequest)

    }

    private async sendMailRequest(mailRequest: IMailRequest) {
        const mailConfig = this.config.get('mail')
        try {
            const result = await mailgun(mailConfig.mailgun).messages().send({
                from: mailConfig.from,
                to: mailRequest.to,
                subject: mailRequest.subject,
                text: mailRequest.text,
                html: mailRequest.html
            })
            this.logger.info(result)
        } catch (e) {
            this.logger.error(e)
        }
        
    }
}