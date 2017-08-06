import 'reflect-metadata'
import * as mongoose from 'mongoose'
import { injectable, inject, Container } from 'inversify'
import { Logger } from './logger'
import { Api } from './api'
import { Server } from './server'
import { Config } from './config'
import { UserApi } from "./api/user"
import { Sites } from "./sites"
import { Mailer } from './mailer'
import { PushServer } from './pushserver'
import { EmailVerification } from './emailverification'
import { TeamApi } from "./api/team";
import { MembershipApi } from "./api/membership";
import { ImageManager } from "./imagemanager";
import { Notifications } from "./notifications";

// use ES6 Promise for mongoose
(<any>mongoose).Promise = global.Promise

let container = new Container()

container.bind<Logger>(Logger).toSelf().inSingletonScope()
container.bind<Config>(Config).toSelf().inSingletonScope()

container.bind<Server>(Server).toSelf().inSingletonScope()
container.bind<Api>(Api).toSelf().inSingletonScope()
container.bind<UserApi>(UserApi).toSelf().inSingletonScope()
container.bind<TeamApi>(TeamApi).toSelf().inSingletonScope()
container.bind<MembershipApi>(MembershipApi).toSelf().inSingletonScope()

container.bind<Sites>(Sites).toSelf().inSingletonScope()

container.bind<PushServer>(PushServer).toSelf().inSingletonScope()
container.bind<Mailer>(Mailer).toSelf().inSingletonScope()
container.bind<ImageManager>(ImageManager).toSelf().inSingletonScope()

container.bind<EmailVerification>(EmailVerification).toSelf().inSingletonScope()
container.bind<Notifications>(Notifications).toSelf().inSingletonScope()

let logger = container.get<Logger>(Logger)
let config = container.get<Config>(Config)
config.init(`${__dirname}/../.env.json`)

mongoose.connect(config.get('mongodb'),
    {
        server: {
            socketOptions: {
                keepAlive: 300000,
                connectTimeoutMS: 30000
            }
        }
    })
    .then(() => {
        logger.info("connected to mongodb")
        let server = container.get<Server>(Server)
        server.start()
    }, (error) => {
        logger.error(error)
        process.exit(1)
    })
