/** Doctor Tracker: Carries an expected HTTP status and stable error code through route handlers. */
export class AppError extends Error {
  /** Create a request error that the shared middleware can serialize safely. */
  constructor(statusCode, message, code = "REQUEST_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}
