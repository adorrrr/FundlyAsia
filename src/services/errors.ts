/** Errors the UI knows how to explain. */
export class ServiceError extends Error {
  constructor(public code: 'invalid_credentials' | 'invalid_otp' | 'not_found' | 'not_connected' | 'unavailable' | 'validation') {
    super(code);
  }
}
