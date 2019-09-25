import * as express from 'express'
import { Logger } from '../logger'
import { inject, injectable } from 'inversify'
import { Membership, User, Team, Event, Device, News, Invitation, Participation, Verification } from '../models'
import { Config } from '../config'
import { Request, Response } from '../interfaces'
import { Registry, Gauge } from 'prom-client'


@injectable()
export class MetricsApi {

    constructor( @inject(Config) private config: Config) {
    }

    getRouter() {
        let router = express.Router()
        router.get('/', this.getMetrics.bind(this))
        return router
    }

    async getMetrics(req: Request, res: Response) {
        if(req.header('authorization') !== 'Bearer ' + this.config.get('monitoring_token', Math.random().toString(36).substr(2, 5))){
            res.status(403).send('unauthorized')
            return
        }
        const registry = new Registry()
        
        const usersGauge = new Gauge({ name: 'coach_plus_users', help: 'number of users', registers: [registry] });
        usersGauge.set(await User.count({}))

        const teamsGauge = new Gauge({ name: 'coach_plus_teams', help: 'number of teams', registers: [registry] });
        teamsGauge.set(await Team.count({}))

        const eventsGauge = new Gauge({ name: 'coach_plus_events', help: 'number of events', registers: [registry] });
        eventsGauge.set(await Event.count({}))

        const membershipsGauge = new Gauge({ name: 'coach_plus_memberships', help: 'number of memberships', registers: [registry] });
        membershipsGauge.set(await Membership.count({}))

        const devicesGauge = new Gauge({ name: 'coach_plus_devices', help: 'number of devices', registers: [registry] });
        devicesGauge.set(await Device.count({}))

        const newsGauge = new Gauge({ name: 'coach_plus_news', help: 'number of news', registers: [registry] });
        newsGauge.set(await News.count({}))

        const invitationsGauge = new Gauge({ name: 'coach_plus_invitations', help: 'number of invitations', registers: [registry] });
        invitationsGauge.set(await Invitation.count({}))

        const participationsGauge = new Gauge({ name: 'coach_plus_participations', help: 'number of participations', registers: [registry] });
        participationsGauge.set(await Participation.count({}))

        const verificationsGauge = new Gauge({ name: 'coach_plus_verifications', help: 'number of verifications', registers: [registry] });
        verificationsGauge.set(await Verification.count({}))

        res.type('application/text').send(registry.metrics())
    }
}