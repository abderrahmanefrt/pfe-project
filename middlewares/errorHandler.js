import { constants } from "../constants.js";

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  switch (statusCode) {
    case constants.VALIDATION_ERROR:
      res.status(statusCode).json({
        title: "Validation Error",
        message: err.message,
        stackTrace: process.env.NODE_ENV === "production" ? null : err.stack,
      });
      break;

    case constants.NOT_FOUND:
      res.status(statusCode).json({
        title: "Not Found",
        message: err.message,
        stackTrace: process.env.NODE_ENV === "production" ? null : err.stack,
      });
      break;

    case constants.UNAUTHORIZED:
      res.status(statusCode).json({
        title: "Unauthorized",
        message: err.message,
        stackTrace: process.env.NODE_ENV === "production" ? null : err.stack,
      });
      break;

    case constants.FORBIDDEN:
      res.status(statusCode).json({
        title: "Forbidden",
        message: err.message,
        stackTrace: process.env.NODE_ENV === "production" ? null : err.stack,
      });
      break;

    case constants.SERVER_ERROR:
      res.status(statusCode).json({
        title: "Server Error",
        message: err.message,
        stackTrace: process.env.NODE_ENV === "production" ? null : err.stack,
      });
      break;

    default:
      console.error("Unhandled error:", err);
      res.status(500).json({
        title: "Unknown Error",
        message: err.message || "Something went wrong",
        stackTrace: process.env.NODE_ENV === "production" ? null : err.stack,
      });
      break;
  }
};

export default errorHandler;
