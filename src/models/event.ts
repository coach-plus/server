import * as mongoose from 'mongoose'


export interface IEvent {
    team: string
    name: string
    description: string
    start: Date
    end: Date
}

export interface IEventModel extends IEvent, mongoose.Document { }

let eventSchema = new mongoose.Schema({
    team: mongoose.Types.ObjectId,
    name: String,
    description: String,
    start: Date,
    end: Date
});

export let Event = mongoose.model<IEventModel>('Event', eventSchema)