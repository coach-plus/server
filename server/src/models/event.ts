import * as mongoose from 'mongoose'
import { ITeam } from './team'
import { ITimestampable } from '.';

export interface IEvent extends ITimestampable {
    team: string | ITeam
    name: string
    description: string
    start: Date
    end: Date
    location: {
        name: string
        lat: number
        long: number
    }
}

export interface IEventModel extends IEvent, mongoose.Document { }

let eventSchema = new mongoose.Schema({
    team: { type: mongoose.SchemaTypes.ObjectId, ref: 'Team' },
    name: String,
    description: { type: String, default: '' },
    start: Date,
    end: Date,
    location: {
        name: String,
        lat: Number,
        long: Number
    }
}, { timestamps: true });

export let Event = mongoose.model<IEventModel>('Event', eventSchema)