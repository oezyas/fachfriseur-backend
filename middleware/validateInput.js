// middleware/validateInput.js
const { body, validationResult } = require("express-validator");

// Registrierung
const registerValidation = [
  body("email").isEmail().withMessage("Ungültige E-Mail-Adresse").normalizeEmail().bail(),
  body("password")
    .isStrongPassword({
      minLength: 12,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage("Passwort muss mind. 12 Zeichen, Groß-/Kleinbuchstaben, Zahl und Sonderzeichen enthalten.")
    .bail(),
  body("passwordConfirm")
    .custom((v, { req }) => v === req.body.password)
    .withMessage("Passwörter stimmen nicht überein.")
    .bail(),
  body("username").optional().trim().isLength({ max: 64 }).withMessage("Benutzername darf max. 64 Zeichen lang sein."),
];

// Login
const loginValidation = [
  body("email").isEmail().withMessage("Ungültige E-Mail-Adresse").normalizeEmail().bail(),
  body("password").notEmpty().withMessage("Passwort ist erforderlich.").bail(),
];

// Password-Reset
const resetRequestValidation = [
  body("email").isEmail().withMessage("Ungültige E-Mail-Adresse").normalizeEmail().bail(),
];

const resetConfirmValidation = [
  body("token").isString().trim().notEmpty().withMessage("Token fehlt.").bail(),
  body("newPassword")
    .isStrongPassword({
      minLength: 12,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage("Neues Passwort muss mind. 12 Zeichen, Groß-/Kleinbuchstaben, Zahl und Sonderzeichen enthalten.")
    .bail(),
];

// Fehlerauswertung
function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map(({ msg, param }) => ({ msg, param }));
    return res.status(400).json({ errors });
  }
  next();
}

module.exports = {
  registerValidation,
  loginValidation,
  resetRequestValidation,
  resetConfirmValidation,
  validate,
};
