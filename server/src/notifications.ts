import { Logger } from './logger'
import { inject, injectable } from 'inversify'
import { IUser, IEventModel, IDevice, Device, Membership, Participation, IParticipation, Team } from './models'
import { IPushRequest } from './interfaces'
import { Config } from './config'
import { Apns } from './notifications/apns'
import { Fcm } from './notifications/fcm'


@injectable()
export class Notifications {

    constructor( @inject(Logger) private logger: Logger, @inject(Config) private config: Config, 
    @inject(Apns) private apns: Apns, @inject(Fcm) private fcm: Fcm) { }

    async sendReminder(event: IEventModel, sendingUserId:string) {

        try {

            let userIdsToBeExcluded = (await Participation.find({
                event: event.id,
                willAttend: { $in: [true, false] },
            })).map((participation) => {
                return participation.user.toString()
            })
            userIdsToBeExcluded.push(sendingUserId)

            let devices = (await Membership.find({team:event.team}).populate({
                path:'user',
                populate: {
                    path: 'devices'
                }
            }).exec()).filter((membership) => {
                return userIdsToBeExcluded.indexOf((membership.user as any).id) === -1
            }).map(membership => {
                return (<IUser>membership.user).devices
            }).reduce((prev, curr) => {
                return prev.concat(curr)
            }, [])

            this.logger.debug(`Reminder recipients: $(devices.length) devices`)
            if (devices.length == 0) {
                return
            }

            const team = await Team.findById(event.team)
            if (!team) {
                this.logger.error('Team not found')
                return
            }

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

        } catch (e) {
            this.logger.error(e)
        }
    }

    private sendNotifications(devices: IDevice[], pushRequest: IPushRequest) {
        const apnsDevices = devices.filter((device) => device.system === 'ios')
        const fcmDevices = devices.filter((device) => device.system === 'android')

        if (apnsDevices.length > 0) {
            this.apns.sendNotification(apnsDevices, pushRequest)
        }
        if (fcmDevices.length > 0) {
            this.fcm.sendNotification(fcmDevices, pushRequest)
        }
    }
}