import { Logger } from './logger'
import { inject, injectable } from 'inversify'
import { IUser, IEventModel, IDevice, Device, Membership, ITeam, ITeamModel } from './models'
import { IPushRequest } from './interfaces'
import { Config } from './config'
import { Apns } from './notifications/apns'
import { Fcm } from './notifications/fcm'


@injectable()
export class Notifications {

    constructor( @inject(Logger) private logger: Logger, @inject(Config) private config: Config, 
    @inject(Apns) private apns: Apns, @inject(Fcm) private fcm: Fcm) { }

    public async sendReminder(event: IEventModel, sendingUserId:string) {
        try {
            const memberships = await Membership.find({team:event.team})
            .populate('team')
            .populate({
                path:'user',
                populate: {
                    path: 'devices'
                }
            }).exec()
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
            const team = (event.team as ITeamModel)
            let pushRequest:IPushRequest = {
                category: 'EVENT_REMINDER',
                title: event.name,
                subtitle: event.start.toDateString(), //TODO: readable date format
                content: event.description,
                payload: {
                    eventId: event._id.toString(),
                    teamId: team._id.toString(),
                    teamName: team.name,
                    eventLocation: event.location.name
                },
            }

            this.sendNotifications(devices, pushRequest)
        } catch(error){
            
        }
    }

    private sendNotifications(devices: IDevice[], pushRequest: IPushRequest) {
        const apnsDevices = devices.filter((device) => device.system === 'ios')
        const fcmDevices = devices.filter((device) => device.system === 'android')

        this.apns.sendNotification(apnsDevices, pushRequest)
        this.fcm.sendNotification(fcmDevices, pushRequest)
    }
}