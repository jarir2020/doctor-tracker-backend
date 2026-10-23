/** Doctor Tracker: Converts application and database failures into consistent API responses. */
import { AppError } from "../utils/AppError.js";

/** Return the common API error shape when no route matches the request. */
export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: "API route not found." });
}

/** Translate expected validation/database errors and hide unexpected details. */
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  let statusCode = error instanceof AppError ? error.statusCode : 500;
  let message = error instanceof AppError ? error.message : "An unexpected server error occurred.";

  if (error?.code === 11000) {
    statusCode = 409;
    message = "A record with that email already exists.";
  } else if (error?.name === "ValidationError" || error?.name === "ZodError") {
    statusCode = 400;
    message = "The submitted data is invalid.";
  } else if (error?.name === "CastError") {
    statusCode = 400;
    message = "The requested record ID is invalid.";
  } else if (error?.name === "MongoServerSelectionError") {
    statusCode = 503;
    message = "The database is temporarily unavailable.";
  }

  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({ success: false, message });
}
