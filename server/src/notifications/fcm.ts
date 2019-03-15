import { Config } from './../config'
import { Logger } from './../logger'
import { inject, injectable } from 'inversify'
import { Provider, Notification, ProviderOptions, NotificationAlertOptions } from 'apn'
import { IPushRequest } from "./../interfaces"
import { IDevice } from '../models';


@injectable()
export class Fcm {

    constructor( @inject(Logger) private logger: Logger, @inject(Config) private config: Config) {

    }

    sendNotification(devices: IDevice[], pushRequest: IPushRequest) {

    }
}