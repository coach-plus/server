import { Config } from './../config'
import { Logger } from './../logger'
import { inject, injectable } from 'inversify'
import { IPushRequest } from "./../interfaces"
import { IDevice } from '../models'
import * as firebaseAdmin from 'firebase-admin'


@injectable()
export class Fcm {
    private firebaseConfig : any
    private firebaseApp : firebaseAdmin.app.App

    constructor( @inject(Logger) private logger: Logger, @inject(Config) private config: Config) {
        const serviceAccount = this.config.get("fcm")
        this.firebaseConfig = {
            credential: firebaseAdmin.credential.cert(serviceAccount),
            DATABASE_URL: serviceAccount.database_url
        }
        this.firebaseApp = firebaseAdmin.initializeApp(this.firebaseConfig)
    }

    public async sendNotification(devices: IDevice[], pushRequest: IPushRequest) {
        const tokens = devices.map(device => device.pushId)
        const additionalPayload = { 
            category: pushRequest.category, 
            title: pushRequest.title, 
            subtitle: pushRequest.subtitle 
        }
        let data = Object.assign(additionalPayload, pushRequest.payload) 
        data.category = pushRequest.category
        const message : firebaseAdmin.messaging.MulticastMessage = {
            data : data,
            tokens: tokens
        }
        await this.firebaseApp.messaging().sendMulticast(message)
    }
}