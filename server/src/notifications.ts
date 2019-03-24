import { Logger } from './logger'
import { inject, injectable } from 'inversify'
import { IUser, IEventModel, IDevice, Device, Membership } from './models'
import { IPushRequest } from './interfaces'
import { Config } from './config'
import { Apns } from './notifications/apns'
import { Fcm } from './notifications/fcm'


@injectable()
export class Notifications {

    constructor( @inject(Logger) private logger: Logger, @inject(Config) private config: Config, 
    @inject(Apns) private apns: Apns, @inject(Fcm) private fcm: Fcm) { }

    sendReminder(event: IEventModel, sendingUserId:string) {
        Membership.find({team:event.team}).populate({
            path:'user',
            populate: {
                path: 'devices'
            }
        }).exec().then(memberships => {
            let devices = memberships.map(membership => {
                return (<IUser>membership.user).devices
            }).reduce((prev, curr) => {
                return prev.concat(curr)
            }).filter(device => {
                return device.user != sendingUserId
            })
            this.logger.debug(`Reminder recipients: $(devices.length) devices`)
            if (devices.length == 0) {
                return
            }
            let pushRequest:IPushRequest = {
                category: 'EVENT_REMINDER',
                content: event.description,
                payload: {
                    eventId: event._id,
                    teamId: event.team
                },
                subtitle: event.start.toDateString(), //TODO: readable date format
                title: event.name
            }

            this.sendNotifications(devices, pushRequest)
        })
    }

    private sendNotifications(devices: IDevice[], pushRequest: IPushRequest) {
        const apnsDevices = devices.filter((device) => device.system === 'ios')
        const fcmDevices = devices.filter((device) => device.system === 'android')

        this.apns.sendNotification(apnsDevices, pushRequest)
        this.fcm.sendNotification(fcmDevices, pushRequest)
    }
}