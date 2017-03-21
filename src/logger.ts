import * as winston from 'winston';
import { injectable } from 'inversify';


@injectable()
export class Logger {
    private winston: any;
    
    constructor() {
        this.winston = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)({ 'timestamp': true })
            ]
        });
    }

    debug(data:any = ''){
        this.winston.debug(data);
    }

    info(data:any = ''){
        this.winston.info(data);
    }

    error(data:any = ''){
        this.winston.error(data);
    }
}