import { IUserModel } from './models/user';
import { Logger } from './logger'
import { inject, injectable } from 'inversify'
import * as User from './models'
import { IMailRequest, IPushRequest } from './interfaces'
import { Config } from './config'
import Axios from 'axios'

@injectable()
export class PushServer {

    pushConfig: any
    mailUrl: string
    pushUrl: string

    constructor( @inject(Logger) private logger: Logger, @inject(Config) private config: Config) {

        this.pushConfig = this.config.get('push_server')
        this.mailUrl = this.pushConfig.url + 'mail/'
        this.pushUrl = this.pushConfig.url + 'mobile/'

    }

    sendMailRequest(mailRequest: IMailRequest) {
        Axios.post(this.mailUrl, mailRequest).then((response) => {
            if (response.status == 200) {
                this.logger.info('MailRequest sent')
            } else {
                this.logger.error(`Pushserver sent ${response.status}: ${response.statusText}`)
            }
        }).catch((err) => {
            this.logger.error(err)
        })
    }

    sendPushRequest(pushRequest: IPushRequest) {
        Axios.post(this.pushUrl, pushRequest).then((response) => {
            if (response.status == 200) {
                this.logger.info('PushRequest sent')
            } else {
                this.logger.error(`Pushserver sent ${response.status}: ${response.statusText}`)
            }
        }).catch((err) => {
            this.logger.error(err)
        })
    }
}