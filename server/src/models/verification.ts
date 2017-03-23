import * as mongoose from 'mongoose';
import { IUser } from './user'


export interface IVerification {
    user: string | IUser
    token: string
}

export interface IVerificationModel extends IVerification, mongoose.Document { }

let verificationSchema = new mongoose.Schema({
    user: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    token: String
});

export let Verification = mongoose.model<IVerificationModel>('Verification', verificationSchema)