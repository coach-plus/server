import * as mongoose from 'mongoose'


export interface ITeam {
    name: string
    isPublic: boolean
}

export interface ITeamModel extends ITeam, mongoose.Document { }

let teamSchema = new mongoose.Schema({
    name: { unique: true, type: String },
    isPublic: Boolean
})

export let Team = mongoose.model<ITeamModel>('Team', teamSchema)