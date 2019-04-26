import * as HttpStatus from 'http-status-codes'

export interface IError {
    errorCode : string
    statusCode: number
}

// generic errors
export const Unauthenticated : IError  = { errorCode: 'Unauthenticated', statusCode: HttpStatus.UNAUTHORIZED }
export const Unauthorized : IError =  { errorCode: 'Unauthorized', statusCode: HttpStatus.FORBIDDEN }
export const InternalServerError : IError =  { errorCode: 'InternalServerError', statusCode: HttpStatus.INTERNAL_SERVER_ERROR }

// specific errors
export const LastCoachCantLeaveTeam : IError =  { errorCode: 'LastCoachCantLeaveTeam', statusCode: HttpStatus.CONFLICT }
export const EmailAlreadyVerified : IError =  { errorCode: 'EmailAlreadyVerified', statusCode: HttpStatus.PRECONDITION_FAILED }
export const UserNotFound : IError =  { errorCode: 'UserNotFound', statusCode: HttpStatus.NOT_FOUND }
