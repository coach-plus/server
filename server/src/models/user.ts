import * as mongoose from 'mongoose'
import { IDevice } from './index'


export interface IUser {
    firstname: string
    lastname: string
    email?: string
    password?: string
    emailVerified?: boolean
    registered?: Date
    image: string
    devices: IDevice[]
}

export interface IUserModel extends IUser, mongoose.Document { }

let userSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: { unique: true, type: String },
    password: String,
    emailVerified: { type: Boolean, default: false },
    registered: { type: Date, default: Date.now },
    image: String,
    devices : [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }]
})

export let User = mongoose.model<IUserModel>('User', userSchema)

export let reduceUser = (user: IUserModel, keepEmail?:Boolean): IUser => {
    let u = <IUser>user.toObject()
    if (!keepEmail) {
        delete u.email
    }
    delete u.emailVerified
    delete u.password
    delete u.registered
    delete u.devices
    return u
}

export let reducedUserPopulationFields = '_id firstname lastname image devices'