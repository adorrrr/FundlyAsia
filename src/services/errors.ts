export type ServiceErrorCode =
  | 'invalid_credentials'
  | 'invalid_otp'
  | 'invalid_token'
  | 'email_taken'
  | 'already_registered'
  | 'masterclass_full'
  | 'registration_closed'
  | 'not_found'
  | 'not_connected'
  | 'unavailable'
  | 'validation'
  | 'has_registrations';

export class ServiceError extends Error {
  constructor(public code: ServiceErrorCode) {
    super(code);
  }
}

