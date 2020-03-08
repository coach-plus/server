import { Logger } from './logger'
import { inject, injectable } from 'inversify'
import { Verification, IUserModel, IVerification } from './models'
import { Mailer } from "./mailer"
import * as Uuid from 'uuid/v4'

@injectable()
export class EmailVerification {

    constructor( @inject(Logger) private logger: Logger, @inject(Mailer) private mailer: Mailer) { }

    create(user: IUserModel, causedByRegistration: boolean) {

        let verification: IVerification = {
            token: Uuid(),
            user: user._id
        }

        Verification.create(verification).then((createdVerification) => {
            let verificationO = <IVerification>createdVerification.toObject()
            verificationO.user = user
            if (causedByRegistration) {
                this.mailer.sendRegistrationMail(verificationO)
            } else {
                this.mailer.sendVerificationMail(verificationO)
            }
        }).catch((err) => {
            this.logger.error(err)
        })

    }
}