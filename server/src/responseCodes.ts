import * as HttpStatus from 'http-status-codes'

export interface IResponseCode {
    message : string
    statusCode: number
}

// generic errors
export const Unauthenticated : IResponseCode  = { message: 'Unauthenticated', statusCode: HttpStatus.UNAUTHORIZED }
export const Unauthorized : IResponseCode =  { message: 'Unauthorized', statusCode: HttpStatus.FORBIDDEN }
export const InternalServerError : IResponseCode =  { message: 'Internal_server_error', statusCode: HttpStatus.INTERNAL_SERVER_ERROR }

// specific errors
export const LastCoachCantLeaveTeam : IResponseCode =  { message: 'The_last_coach_cant_leave_the_team', statusCode: HttpStatus.CONFLICT }
export const EmailAlreadyVerified : IResponseCode =  { message: 'The_email_address_was_already_verified', statusCode: HttpStatus.PRECONDITION_FAILED }
export const UserNotFound : IResponseCode =  { message: 'The_user_could_not_be_found', statusCode: HttpStatus.NOT_FOUND }

export const EventAlreadyStarted : IResponseCode =  { message: 'The_Event_has_already_started', statusCode: HttpStatus.PRECONDITION_FAILED }
export const EventNotFound : IResponseCode =  { message: 'The_event_could_not_be_found', statusCode: HttpStatus.NOT_FOUND }

// specific success status results
export const ParticipationUpdated : IResponseCode =  { message: 'Your_participation_was_updated_successfully', statusCode: HttpStatus.OK }