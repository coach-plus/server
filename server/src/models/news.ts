import * as mongoose from 'mongoose'
import { IUser } from './user';
import { IEvent } from './event';
import { ITimestampable } from '.';

export interface INews extends ITimestampable {
    event: string | IEvent
    author: string | IUser
    created: Date
    text: string
    title: string
}

export interface INewsModel extends INews, mongoose.Document { }

let newsSchema = new mongoose.Schema({
    event: { type: mongoose.SchemaTypes.ObjectId, ref: 'Event' },
    author: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    created: { type: Date, default: Date.now },
    text: String,
    title: String
}, { timestamps: true });

export let News = mongoose.model<INewsModel>('News', newsSchema)