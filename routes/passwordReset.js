const express = require("express");
const {
  validate,
  resetRequestValidation,
  resetConfirmValidation,
} = require("../middleware/validateInput");
const {
  resetRequestLimiterIp,
  resetRequestLimiterEmail,
  resetConfirmLimiter,
} = require("../middleware/rateLimiters");
const {
  passwordResetRequest,
  passwordResetConfirm,
} = require("../controllers/authController");

const router = express.Router();

// POST /api/password-reset/request
router.post(
  "/request",
  resetRequestLimiterIp,
  resetRequestLimiterEmail,
  resetRequestValidation,
  validate,
  passwordResetRequest
);

// POST /api/password-reset/confirm
router.post(
  "/confirm",
  resetConfirmLimiter,
  resetConfirmValidation,
  validate,
  passwordResetConfirm
);

module.exports = router;
