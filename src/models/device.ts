import * as mongoose from 'mongoose'
import { IUser } from './user'


export interface IDevice {
    user: string | IUser
    system: string
    deviceId: string
    pushId: string
}

export interface IDeviceModel extends IDevice, mongoose.Document { }

let deviceSchema = new mongoose.Schema({
    user: mongoose.Types.ObjectId,
    system: String,
    deviceId: String,
    pushId: String
})

export let Device = mongoose.model<IDeviceModel>('Device', deviceSchema)