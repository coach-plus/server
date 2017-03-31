import * as mongoose from 'mongoose';


export interface IUser {
    firstname: string
    lastname: string
    email?: string
    password?: string
    emailVerified?: boolean
    registered?: Date
}

export interface IUserModel extends IUser, mongoose.Document { }

let userSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: { unique: true, type: String },
    password: String,
    emailVerified: { type: Boolean, default: false },
    registered: { type: Date, default: Date.now }
})

export let User = mongoose.model<IUserModel>('User', userSchema)

export let reduceUser = (user: IUserModel): IUser => {
    let u = <IUser>user.toObject()
    delete u.email
    delete u.emailVerified
    delete u.password
    delete u.registered
    return u
}