import * as mongoose from 'mongoose';
import { IUser } from './user'
import { ITimestampable } from '.';


export interface IVerification extends ITimestampable {
    user: string | IUser
    token: string
}

export interface IVerificationModel extends IVerification, mongoose.Document { }

let verificationSchema = new mongoose.Schema({
    user: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    token: String
}, { timestamps: true });

export let Verification = mongoose.model<IVerificationModel>('Verification', verificationSchema)