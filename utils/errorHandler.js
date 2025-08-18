// utils/errorHandler.js
const logger = require("../logger");

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // Bekannte Fehlerfälle mappen (CSRF, Body-Parser, Mongoose, Duplikate, etc.)
  let status = err.status || 500;
  if (err && err.code === "EBADCSRFTOKEN") status = 403;                         // CSRF
  else if (err && err.type === "entity.too.large") status = 413;                 // Payload zu groß
  else if (err && (err.type === "entity.parse.failed" || err instanceof SyntaxError)) status = 400; // Ungültiges JSON
  else if (err && (err.name === "ValidationError" || err.name === "CastError")) status = 400;       // Mongoose Validation/ObjectId
  else if (err && (err.code === 11000 || err.code === "11000")) status = 409;    // Mongo Duplicate Key

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
    code: err.code,
    name: err.name,
  });

  // Nutzerfreundliche, aber knappe Fehlermeldungen
  let msg;
  if (err && err.code === "EBADCSRFTOKEN") {
    msg = "Ungültiges CSRF-Token";
  } else if (err && err.type === "entity.too.large") {
    msg = "Payload zu groß";
  } else if (err && (err.type === "entity.parse.failed" || err instanceof SyntaxError)) {
    msg = "Ungültiges JSON im Request-Body";
  } else if (err && err.name === "ValidationError") {
    msg = "Validierungsfehler";
  } else if (err && err.name === "CastError") {
    msg = "Ungültiger Parameter";
  } else if (err && (err.code === 11000 || err.code === "11000")) {
    msg = "Ressource existiert bereits (Duplikat)";
  } else {
    msg = status >= 500 && isProd ? "Interner Serverfehler" : (err.message || "Fehler");
  }

  res.status(status).json({
    errors: [{ msg }],
  });
}

module.exports = { errorHandler };
