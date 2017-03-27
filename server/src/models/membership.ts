import * as mongoose from 'mongoose'
import { IUser } from './user'
import { ITeam } from './team'


export interface IMembership {
    user: string | IUser
    team: string | ITeam
    role: string
}

export interface IMembershipModel extends IMembership, mongoose.Document { }

let membershipSchema = new mongoose.Schema({
    user: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    team: { type: mongoose.SchemaTypes.ObjectId, ref: 'Team' },
    role: { type: String, default: 'user' }
})

export let Membership = mongoose.model<IMembershipModel>('Membership', membershipSchema)