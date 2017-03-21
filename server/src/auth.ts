import * as express from 'express'
import * as jwt from 'jsonwebtoken'


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