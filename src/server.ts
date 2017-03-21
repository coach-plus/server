import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as http from 'http';
import { injectable, inject } from "inversify";
import { Logger } from './logger'
import { Api } from './api';
import { Config } from "./config";


@injectable()
export class Server {

    constructor( @inject(Logger) private logger: Logger, @inject(Api) private api: Api,
        @inject(Config) private config: Config) {
    }

    public start() {
        let app = express();
        let server = http.createServer(app);
        app.use(bodyParser.json({ limit: '5mb' }));

        app.get('/', (req, res) => res.send('coach plus'))
        app.use('/api', this.api.getRouter());

        let port = this.config.get('port', 4000)

        server.listen(port, () => {
            this.logger.info("starting on port " + port);
        });
    };
}