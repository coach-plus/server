import * as express from 'express'
import * as jwt from 'jsonwebtoken'
import { Membership } from './models'
import { Request, Response, IApiResponse } from './interfaces'
import { sendError, sendSuccess, sendErrorCode } from './api'
import { Unauthenticated, Unauthorized, InternalServerError, UserNotACoach } from './responseCodes';



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
        sendErrorCode(res, Unauthenticated)
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

export let authenticatedUserIsMemberOfTeam = (req: Request, res: Response, next: Function) => {
    let teamId = req.params['teamId']
    Membership.findOne({ user: req.authenticatedUser._id, team: teamId })
        .then(userModel => {
            if (userModel == null) {
                sendErrorCode(res, Unauthorized)
                return
            }
            next()
        }).catch(error => {
            sendErrorCode(res, InternalServerError)
        })
}

export let authenticatedUserIsCoachOfMembershipTeam = (req: Request, res: Response, next: Function) => {
    let membershipId = req.params['membershipId']
    Membership.findById(membershipId).then(changeMembership => {
        Membership.findOne({ team: changeMembership.team, user: req.authenticatedUser._id })
        .then(membership => {
            if (membership != null && membership.role == 'coach') {
                next()
            } else {
                sendErrorCode(res, UserNotACoach)
                return
            }
        }).catch(error => {
            sendErrorCode(res, InternalServerError)
        })
    })
}

export let authenticatedUserIsMemberOfMembershipTeam = (req: Request, res: Response, next: Function) => {
    let membershipId = req.params['membershipId']
    Membership.findById(membershipId).then(changeMembership => {
        Membership.findOne({ team: changeMembership.team, user: req.authenticatedUser._id })
        .then(membership => {
            if (membership != null) {
                next()
            } else {
                sendErrorCode(res, UserNotACoach)
                return
            }
        }).catch(error => {
            sendErrorCode(res, InternalServerError)
        })
    })
}

export let authenticatedUserIsCoach = (req: Request, res: Response, next: Function) => {
    let teamId = req.params['teamId']
    isUserCoachOfTeam(req.authenticatedUser._id, teamId).then(isUserCoach => {
        if (isUserCoach) {
            next()
            return
        }
        sendErrorCode(res, UserNotACoach)
    }).catch(error => {
        sendErrorCode(res, InternalServerError)
    })
}

export let authenticatedUserIsUser = (userIdParameter: string) => {
    return (req: Request, res: Response, next: Function) => {
        let userId = req.params[userIdParameter]
        if (userId == req.authenticatedUser._id) {
            next()
            return
        }
        sendErrorCode(res, Unauthenticated)
    }
}

export let isUserCoachOfTeam = (userId: string, teamId: string) => {
    return new Promise((resolve, reject) => {
        Membership.findOne({ user: userId, team: teamId })
            .then(membership => {
                if (membership.role == 'coach') {
                    resolve(true)
                    return
                }
                resolve(false)
            }).catch(error => {
                reject(error)
            })
    })
}