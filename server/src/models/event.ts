import * as mongoose from 'mongoose'
import { ITeam } from './team'

export interface IEvent {
    team: string | ITeam
    name: string
    description: string
    start: Date
    end: Date
}

export interface IEventModel extends IEvent, mongoose.Document { }

let eventSchema = new mongoose.Schema({
    team: { type: mongoose.SchemaTypes.ObjectId, ref: 'Team' },
    name: String,
    description: { type: String, default: '' },
    start: Date,
    end: Date
});

export let Event = mongoose.model<IEventModel>('Event', eventSchema)