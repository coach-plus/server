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
    user: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    system: String,
    deviceId: String,
    pushId: String
})

export let Device = mongoose.model<IDeviceModel>('Device', deviceSchema)