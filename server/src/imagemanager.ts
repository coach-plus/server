import { IUserModel } from './models/user';
import { Logger } from './logger'
import { inject, injectable } from 'inversify'
import { IVerification, IUser } from './models'
import { IMailRequest } from './interfaces'
import { Config } from './config'
import * as Uuid from 'uuid/v4'
import * as fs from 'fs'

@injectable()
export class ImageManager {

    appUrl: string
    uploadDirPath = __dirname + '/../../uploads/'

    constructor( @inject(Logger) private logger: Logger, @inject(Config) private config: Config) {
        this.appUrl = this.config.get('app_url')
    }

    storeImageAsFile(content: String) {
        return new Promise((resolve, reject) => {

            let splitted = content.split('/')
            let right = splitted[1]
            let typeSplitted = right.split(';')
            let fileType = typeSplitted[0]
            let base64Data = content.split(',')[1]

            let filename = Uuid() + '.' + fileType
            let filepath = this.uploadDirPath + filename

            fs.writeFile(filepath, base64Data, 'base64', (err) => {
                if (err) {
                    reject(err)
                }
                resolve(filename)
            });
        })
    }
}