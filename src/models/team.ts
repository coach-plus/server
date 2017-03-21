import * as mongoose from 'mongoose'


export interface ITeam {
    name: string
}

export interface ITeamModel extends ITeam, mongoose.Document { }

let teamSchema = new mongoose.Schema({
    name: String
})

export let Team = mongoose.model<ITeamModel>('Team', teamSchema)