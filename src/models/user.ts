import * as mongoose from 'mongoose';


export interface IUser {
    firstname: string
    lastname: string
    email: string
    password: string
    emailVerified: boolean
    registered: Date
}

export interface IUserModel extends IUser, mongoose.Document { }

let userSchema = new mongoose.Schema({
    firstname: string,
    lastname: string,
    email: { unique: true, type: String },
    password: string,
    emailVerified: { type: Boolean, default: false },
    registered: { type: Date, default: Date.now }
})

export let User = mongoose.model<IUserModel>('User', userSchema)