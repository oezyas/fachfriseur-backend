// middleware/rateLimiters.js
const rateLimit = require("express-rate-limit");

// Einheitlicher JSON-Handler
const json429 = (msg = "Zu viele Anfragen. Bitte später erneut versuchen.") => (
  req,
  res
) => res.status(429).json({ errors: [{ msg }] });

// Login: IP-basiert (Account-Lockout greift zusätzlich serverseitig)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  keyGenerator: (req) => req.ip,
  handler: json429("Zu viele Loginversuche, bitte 15 Minuten warten."),
});

// Registrierung: IP-basiert
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  keyGenerator: (req) => req.ip,
  handler: json429("Zu viele Registrierungsversuche, bitte später erneut versuchen."),
});

// Admin-APIs: userId-basiert (fällt auf IP zurück, wenn nicht eingeloggt)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => (req.user?.role === "admin" ? 200 : 50),
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  keyGenerator: (req) => req.user?.id || req.ip,
  handler: json429("Zu viele Anfragen, bitte später erneut versuchen."),
});

// Produkt-APIs (öffentlich): IP-basiert
const productLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  keyGenerator: (req) => req.ip,
  handler: json429("Zu viele Produktanfragen, bitte 15 Minuten warten."),
});

// Passwort-Reset-Request: doppelt limitieren (pro IP UND pro E-Mail)
const resetRequestLimiterIp = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  keyGenerator: (req) => req.ip,
  handler: json429("Zu viele Reset-Anfragen (IP), bitte später erneut versuchen."),
});
const resetRequestLimiterEmail = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  keyGenerator: (req) => (req.body?.email || "").toLowerCase(),
  handler: json429("Zu viele Reset-Anfragen für diese E-Mail, bitte später erneut versuchen."),
});

// Passwort-Reset-Confirm: IP-basiert
const resetConfirmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  keyGenerator: (req) => req.ip,
  handler: json429("Zu viele Bestätigungsversuche, bitte später erneut versuchen."),
});

module.exports = {
  loginLimiter,
  registerLimiter,
  adminLimiter,
  productLimiter,
  resetRequestLimiterIp,
  resetRequestLimiterEmail,
  resetConfirmLimiter,
};
