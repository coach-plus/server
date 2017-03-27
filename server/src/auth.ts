import * as express from 'express'
import * as jwt from 'jsonwebtoken'
import { Membership } from './models'


export let authenticationMiddleware = (jwtSecret: string) => {
    return (req: express.Request, res: express.Response, next: Function) => {
        let token = req.body.token || req.query.token || req.headers['x-access-token']
        if (token) {
            jwt.verify(token, jwtSecret, (error: any, user: any) => {
                (<any>req).authenticatedUser = user
                next()
            });
            return
        }
        return res.status(403).send({
            error: 'please provide a valid token'
        })
    }
}

export let getRoleOfUserForTeam = (userId: string, teamId: string) => {
    return new Promise((resolve, reject) => {
        Membership.findOne({ user: userId, team: teamId })
            .then(membership => {
                resolve(membership.role)
            }).catch(error => {
                reject(error)
            })
    })
}