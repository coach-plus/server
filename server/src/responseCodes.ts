import * as HttpStatus from 'http-status-codes'

export interface IResponseCode {
    message : string
    statusCode: number
}

// generic errors
export const Unauthenticated : IResponseCode = { message: 'Unauthenticated', statusCode: HttpStatus.UNAUTHORIZED }
export const Unauthorized : IResponseCode =  { message: 'Unauthorized', statusCode: HttpStatus.FORBIDDEN }
export const InternalServerError : IResponseCode =  { message: 'Internal_server_error', statusCode: HttpStatus.INTERNAL_SERVER_ERROR }

// specific errors
export const LastCoachCantLeaveTeam : IResponseCode =  { message: 'The_last_coach_cant_leave_the_team', statusCode: HttpStatus.CONFLICT }
export const EmailAlreadyVerified : IResponseCode =  { message: 'The_email_address_was_already_verified', statusCode: HttpStatus.PRECONDITION_FAILED }
export const EmailAlreadyRegistered : IResponseCode =  { message: 'The_email_address_was_already_registered', statusCode: HttpStatus.PRECONDITION_FAILED }
export const EmailRequired : IResponseCode =  { message: 'The_email_address_is_required', statusCode: HttpStatus.BAD_REQUEST }
export const UserNotFound : IResponseCode =  { message: 'The_user_could_not_be_found', statusCode: HttpStatus.NOT_FOUND }
export const TeamNotFound : IResponseCode =  { message: 'The_team_could_not_be_found', statusCode: HttpStatus.NOT_FOUND }
export const EventAlreadyStarted : IResponseCode =  { message: 'The_event_has_already_started', statusCode: HttpStatus.PRECONDITION_FAILED }
export const EventNotStartedYet : IResponseCode =  { message: 'The_event_has_not_started_yet', statusCode: HttpStatus.PRECONDITION_FAILED }
export const EventNotFound : IResponseCode =  { message: 'The_event_could_not_be_found', statusCode: HttpStatus.NOT_FOUND }
export const ImageIsMissing : IResponseCode = { message: 'The_image_is_missing', statusCode: HttpStatus.BAD_REQUEST }
export const MembershipNotFound : IResponseCode =  { message: 'The_membership_could_not_be_found', statusCode: HttpStatus.NOT_FOUND }
export const RoleInvalid : IResponseCode =  { message: 'The_role_is_invalid', statusCode: HttpStatus.BAD_REQUEST }
export const TeamAlreadyExists : IResponseCode =  { message: 'The_team_already_exists', statusCode: HttpStatus.BAD_REQUEST }
export const JoinTokenNotValid : IResponseCode =  { message: 'The_token_is_not_valid', statusCode: HttpStatus.NOT_FOUND }
export const UserAlreadyMember : IResponseCode =  { message: 'The_user_is_already_member_of_this_team', statusCode: HttpStatus.BAD_REQUEST }
export const UserNotACoach : IResponseCode =  { message: 'The_user_is_not_a_coach_of_this_team', statusCode: HttpStatus.PRECONDITION_FAILED }
export const CredentialsAreNotCorrect : IResponseCode =  { message: 'The_credentials_are_not_correct', statusCode: HttpStatus.BAD_REQUEST }
export const VerificationTokenNotFound : IResponseCode =  { message: 'The_verification_token_could_not_be_found', statusCode: HttpStatus.BAD_REQUEST }
export const OldNewAndRepeatPasswordsRequired : IResponseCode =  { message: 'Old_password_new_password_and_password_repeat_are_required', statusCode: HttpStatus.BAD_REQUEST }
export const NewPasswordsDoNotMatch : IResponseCode =  { message: 'New_passwords_do_not_match', statusCode: HttpStatus.BAD_REQUEST }
export const WrongPassword : IResponseCode =  { message: 'Wrong_password', statusCode: HttpStatus.BAD_REQUEST }

// specific success status results
export const ParticipationUpdated : IResponseCode =  { message: 'Your_participation_was_updated_successfully', statusCode: HttpStatus.OK }
export const UserRegistered : IResponseCode =  { message: 'Your_registration_was_successful', statusCode: HttpStatus.OK }
export const RoleUpdated : IResponseCode =  { message: 'The_role_was_updated_successfully', statusCode: HttpStatus.OK }
export const TeamJoined : IResponseCode =  { message: 'Joined_team_successfully', statusCode: HttpStatus.OK }
export const LeftTeam : IResponseCode =  { message: 'Left_team_successfully', statusCode: HttpStatus.OK }
export const UserRemoved : IResponseCode =  { message: 'The_user_was_removed_user_successfully', statusCode: HttpStatus.OK }
export const UpdatedTeam : IResponseCode =  { message: 'The_team_was_updated_successfully', statusCode: HttpStatus.OK }
export const TeamDeleted : IResponseCode =  { message: 'The_team_was_deleted_successfully', statusCode: HttpStatus.OK }
export const EventCreated : IResponseCode =  { message: 'The_event_was_created_successfully', statusCode: HttpStatus.OK }
export const ReminderSent : IResponseCode =  { message: 'The_reminder_was_sent_successfully', statusCode: HttpStatus.OK }
export const EventUpdated : IResponseCode =  { message: 'The_event_was_updated_successfully', statusCode: HttpStatus.OK }
export const EventDeleted : IResponseCode =  { message: 'The_event_was_deleted_successfully', statusCode: HttpStatus.OK }
export const AnnouncementDeleted : IResponseCode =  { message: 'The_announcement_was_deleted_successfully', statusCode: HttpStatus.OK }
export const AnnouncementCreated : IResponseCode =  { message: 'The_announcement_was_created_successfully', statusCode: HttpStatus.OK }
