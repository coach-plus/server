import * as mongoose from 'mongoose'
import { ITeam } from './team'


export interface IInvitation {
    team: string | ITeam
    token: string
    validUntil: Date
}

export interface IInvitationModel extends IInvitation, mongoose.Document { }

let invitationSchema = new mongoose.Schema({
    team: mongoose.Types.ObjectId,
    token: String,
    validUntil: Date
})

export let Invitation = mongoose.model<IInvitationModel>('Invitation', invitationSchema)