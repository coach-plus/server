import * as mongoose from 'mongoose'
import { ITimestampable } from '.';


export interface ITeam extends ITimestampable {
    name: string
    isPublic: boolean
    image: string
    memberCount?: number
}

export interface ITeamModel extends ITeam, mongoose.Document { }

let teamSchema = new mongoose.Schema({
    name: { unique: false, type: String },
    isPublic: Boolean,
    image: String
}, {
    timestamps: true
})

export let Team = mongoose.model<ITeamModel>('Team', teamSchema)