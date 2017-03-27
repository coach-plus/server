import * as express from 'express'
import { UserJWT } from "./user-jwt";


export interface Request extends express.Request {
    authenticatedUser?: UserJWT
}
