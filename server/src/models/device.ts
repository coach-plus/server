import * as mongoose from 'mongoose'
import { IUser } from './user'
import { ITimestampable } from '.';

export enum System {
    Android = 'android',
    IOS = 'ios'
}

export interface IDevice extends ITimestampable {
    user: string | IUser
    system: System
    deviceId: string
    pushId: string
}

export interface IDeviceModel extends IDevice, mongoose.Document { }

let deviceSchema = new mongoose.Schema({
    user: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    system: String,
    deviceId: String,
    pushId: String
}, {
    timestamps: true
})

export let Device = mongoose.model<IDeviceModel>('Device', deviceSchema)