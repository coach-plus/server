import * as fs from 'fs'
import { inject, injectable } from 'inversify'
import { Logger } from './logger'


@injectable()
export class Config {
    config: any;

    constructor( @inject(Logger) private logger: Logger) { }

    init(configPath: string) {
        try {
            this.config = JSON.parse(fs.readFileSync(configPath).toString())
        }
        catch (error) {
            this.logger.error('.env.json is not valid!')
            process.exit(1)
        }
    }

    get(key: string, fallbackValue = null) {
        return this.config[key] || fallbackValue
    }
}