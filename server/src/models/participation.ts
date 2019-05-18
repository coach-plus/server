import * as mongoose from 'mongoose'
import { IUser } from './user'
import { ITimestampable } from '.';


export interface IParticipation extends ITimestampable {
    user: string | IUser
    event: string
    willAttend: boolean
    didAttend: boolean
}

export interface IParticipationModel extends IParticipation, mongoose.Document { }

let participationSchema = new mongoose.Schema({
    user: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    event: { type: mongoose.SchemaTypes.ObjectId, ref: 'Event' },
    willAttend: Boolean,
    didAttend: Boolean
}, { timestamps: true })

export let Participation = mongoose.model<IParticipationModel>('Participation', participationSchema)