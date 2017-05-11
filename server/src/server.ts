import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as http from 'http'
import { injectable, inject } from "inversify"
import { Logger } from './logger'
import { Api } from './api'
import { Config } from "./config"
import * as exphbs from 'express-handlebars'
import { Sites } from "./sites"
import * as fs from 'fs'


@injectable()
export class Server {

    constructor( @inject(Logger) private logger: Logger, @inject(Api) private api: Api,
        @inject(Config) private config: Config,
        @inject(Sites) private sites: Sites) {
    }

    public start() {
        let app = express();
        let server = http.createServer(app);
        app.use(bodyParser.json({ limit: '10mb' }));

        let hbs = exphbs.create({
            extname: '.hbs',
            layoutsDir: `${__dirname}/../views/layouts/`,
            partialsDir: `${__dirname}/../views/partials/`,
            defaultLayout: 'main'
        })

        app.set('views', `${__dirname}/../views`)
        app.engine('.hbs', hbs.engine)
        app.set('view engine', '.hbs')

        // app.use('/app/register', express.static(__dirname + '/../../client/dist/'));
        app.use('/app', express.static(__dirname + '/../../client/dist/'));
        app.use('/app/*', express.static(__dirname + '/../../client/dist/'));
        app.use('/static', express.static(__dirname + '/../../client/static'));
        app.use('/api', this.api.getRouter());
        app.use('/static', express.static(__dirname + '/../static'))
        app.use('/uploads', express.static(__dirname + '/../../uploads'))
        app.get('/apple-app-site-association', (req, res) => {
            fs.readFile(__dirname + '/../assets/apple-app-site-association', (err, data) => {
                res.contentType('application/json')
                res.send(data)
            })
        })
        app.use(this.sites.getRouter())

        let port = this.config.get('port', 4000)

        server.listen(port, () => {
            this.logger.info("starting on port " + port);
        });
    };
}