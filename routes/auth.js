const express = require("express");
const {
  registerValidation,
  loginValidation,
  validate,
} = require("../middleware/validateInput");
const { authenticateToken } = require("../middleware/auth");
const authController = require("../controllers/authController");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

// Registrierung (Limiter + Validierung)
router.post(
  "/register",
  registerLimiter,
  registerValidation,
  validate,
  authController.register
);

// Login (Limiter + Validierung)
router.post(
  "/login",
  loginLimiter,
  loginValidation,
  validate,
  authController.login
);

// Logout (geschützt)
router.post("/logout", authenticateToken, authController.logout);

module.exports = router;
