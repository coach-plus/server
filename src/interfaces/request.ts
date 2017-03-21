import * as express from 'express'
import { IUser } from '../models/user'

export interface Request extends express.Request {
    authenticatedUser?: IUser
}
