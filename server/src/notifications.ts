import { IUserModel } from './models/user';
import { Logger } from './logger'
import { inject, injectable } from 'inversify'
import { IVerification, IUser, IEvent, IDevice, Device, Membership } from './models'
import { IPushRequest } from './interfaces'
import { PushServer } from "./pushserver";
import { Config } from './config'


@injectable()
export class Notifications {

    constructor( @inject(Logger) private logger: Logger, @inject(Config) private config: Config, @inject(PushServer) private pushserver: PushServer) { }

    sendReminder(event: IEvent, sendingUserId:string) {
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
                devices: devices,
                payload: {
                    eventId: event,
                    teamId: event.team
                },
                subtitle: event.start.toDateString(), //TODO: readable date format
                title: event.name
            }
            this.pushserver.sendPushRequest(pushRequest)
        })
    }
}