// middleware/conditionalRateLimiter.js
const rateLimit = require("express-rate-limit");

const conditionalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Admins großzügiger (z. B. 400), sonst 100
  max: (req, res) => (req.user?.role === "admin" ? 400 : 100),
  // Pro User limitieren, sonst pro IP
  keyGenerator: (req, res) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  handler: (req, res /*, next, options*/) => {
    return res.status(429).json({
      errors: [{ msg: "Zu viele Anfragen. Bitte später erneut versuchen." }],
    });
  },
});

module.exports = conditionalRateLimiter;
