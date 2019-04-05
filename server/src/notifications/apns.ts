import { Config } from './../config'
import { Logger } from './../logger'
import { inject, injectable } from 'inversify'
import { Provider, Notification, ProviderOptions, NotificationAlertOptions } from 'apn'
import { IPushRequest } from "./../interfaces"
import { IDevice } from '../models';


@injectable()
export class Apns {

    apnProvider: Provider
    apnsConfig: any

    constructor( @inject(Logger) private logger: Logger, @inject(Config) private config: Config) {

        this.apnsConfig = config.get('apns')

        let providerOptions: ProviderOptions = {
            token: {
                key: `${__dirname}/../${this.apnsConfig.key}`,
                keyId: this.apnsConfig.keyId,
                teamId: this.apnsConfig.teamId
            },
            production: this.apnsConfig.production
        }

        this.apnProvider = new Provider(providerOptions)

    }

    sendNotification(devices: IDevice[], pushRequest: IPushRequest) {

        let recipients = devices.map(device => device.pushId)

        let notification = new Notification()
        notification.expiry = Math.floor(Date.now() / 1000) + 3600 * 24; // Expires 1 day from now.
        notification.badge = 1;
        notification.sound = "ping.aiff";
        notification.alert = pushRequest.title;
        notification.payload = pushRequest.payload
        notification.aps.category = pushRequest.category
        notification.topic = this.apnsConfig.bundleId;
        let options:NotificationAlertOptions = {
            body: pushRequest.content,
            title: pushRequest.title,
            subtitle: pushRequest.subtitle
        }
        notification.alert = options

        this.apnProvider.send(notification, recipients)
    }
}