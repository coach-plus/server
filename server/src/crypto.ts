import * as bcrypt from "bcrypt"
import * as util from "util"

const hashAsync = util.promisify(bcrypt.hash)
const compareAsync = util.promisify(bcrypt.compare)


export class Crypto {
    public static async encryptPassword(plainPassword: string){
        return await hashAsync(plainPassword, 10)
    }

    public static async comparePassword(testPassword: string, encryptedPassword: string){
        return await compareAsync(testPassword, encryptedPassword)
    }
}