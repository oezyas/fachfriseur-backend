// utils/errorHandler.js
const logger = require("../logger");

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === "production";

  // Kontext mitloggen (ohne PII)
  logger.error(`HTTP ${status} ${req.method} ${req.originalUrl}`, {
    status,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    stack: err.stack,
    message: err.message,
  });

  res
    .status(status)
    .json({
      errors: [
        { msg: status >= 500 && isProd ? "Interner Serverfehler" : (err.message || "Fehler") }
      ],
    });
}

module.exports = { errorHandler };
