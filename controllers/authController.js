// controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { validationResult } = require("express-validator");
const User = require("../models/User");
const logger = require("../logger");
const sendEmail = require("../utils/sendEmail");
const { setAuthCookie, clearAuthCookie } = require("../utils/cookieManager");


if (!process.env.JWT_SECRET) {
  throw new Error("❌ JWT_SECRET ist nicht gesetzt! Bitte in .env konfigurieren.");
}
const SECRET = process.env.JWT_SECRET;

const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "https://localhost:3443";

// Hilfsfunktion: Basis-URL aus Request ableiten
const getBaseUrl = (req) => {
  const proto = (req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0];
  const host = req.get("host");
  return `${proto}://${host}`;
};

// Helfer: E-Mail maskieren (PII-sparsam loggen)
const mask = (e) => String(e || "").replace(/(.{3}).+(@.+)/, "$1***$2");

// Registrierung 
exports.register = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.debug("❌ Ungültige Registrierungsdaten", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { username = "", email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      logger.debug(`❌ Registrierung abgelehnt – E-Mail existiert bereits: ${mask(email)}`);
      return res.status(400).json({ errors: [{ msg: "E-Mail bereits registriert." }] });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "user",
    });

    await user.save();
    logger.info(`✅ Neuer Benutzer registriert: ${mask(email)}`);
    res.status(201).json({ message: "Registrierung erfolgreich." });
  } catch (err) {
    logger.error("❌ Registrierung fehlgeschlagen:", err);
    res.status(500).json({ errors: [{ msg: "Serverfehler bei Registrierung." }] });
  }
};

// Login mit Account-Lockout
exports.login = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  logger.info("🔥 Login-Funktion wird aufgerufen");

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const normEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normEmail });
    if (!user) {
      logger.debug(`❌ Login fehlgeschlagen – Benutzer nicht gefunden: ${mask(email)}`);
      return res.status(401).json({ errors: [{ msg: "E-Mail nicht gefunden." }] });
    }

    if (user.lockUntil && user.lockUntil < Date.now()) {
      user.lockUntil = undefined;
      user.failedLoginAttempts = 0;
      await user.save();
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      logger.debug(`⏳ Account gesperrt: ${mask(email)} bis ${user.lockUntil.toISOString()}`);
      return res
        .status(423)
        .json({ errors: [{ msg: "Account vorübergehend gesperrt. Bitte später erneut versuchen." }] });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      logger.debug(`❌ Falsches Passwort (${user.failedLoginAttempts}/5): ${mask(email)}`);

      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        logger.debug(`🔒 Account für 15 Minuten gesperrt: ${mask(email)}`);
      }

      await user.save();
      return res.status(401).json({ errors: [{ msg: "Falsches Passwort." }] });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    logger.info(`✅ Benutzer eingeloggt: ${mask(email)}`);

    const token = jwt.sign({ id: user._id, role: user.role }, SECRET, { expiresIn: "1h" });

    setAuthCookie(res, token);

    // Nur Rolle zurückgeben, kein Redirect
    return res.status(200).json({
      message: "Login erfolgreich.",
      role: user.role
    });
  } catch (err) {
    logger.error("❌ Login fehlgeschlagen:", err);
    return res.status(500).json({ errors: [{ msg: "Serverfehler bei Login." }] });
  }
};


// Logout
exports.logout = (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  const { id, role } = req.user || {};
  logger.info(`🚪 Logout: userId=${id || "∅"} role=${role || "∅"}`);

  clearAuthCookie(res);

  res.status(200).json({ message: "Logout erfolgreich." });
};

// Passwort-Reset: Request
exports.passwordResetRequest = async (req, res, next) => {
  try {
    logger.info("🚀 Passwort-Reset-Request aufgerufen");

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.debug("❌ Ungültige Passwort-Reset-Anfrage", { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    const email = (req.body.email || "").toLowerCase().trim();
    const user = await User.findOne({ email });

    if (!user) {
      logger.debug(`🔎 Passwort-Reset: E-Mail nicht gefunden (generische Antwort gesendet) – ${mask(email)}`);
      return res.status(200).json({ msg: "Falls die E-Mail existiert, wurde ein Link versendet." });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.setResetToken(rawToken, 20);
    await user.save();

    logger.info(`🔐 Passwort-Reset-Token erstellt (Hash gespeichert) für ${mask(email)}`);

    // Neuer Code: dynamische Base-URL
    const baseUrl = (process.env.FRONTEND_BASE_URL || "").trim() || getBaseUrl(req);
    const resetLink = `${baseUrl}/password-reset-confirm.html?token=${rawToken}`;

    const html = `
      <h2>Passwort zurücksetzen</h2>
      <p>Hallo,</p>
      <p>du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt.</p>
      <p>Klicke auf den folgenden Link, um dein Passwort zurückzusetzen (gültig 20 Minuten):</p>
      <p><a href="${resetLink}">Passwort zurücksetzen</a></p>
      <p>Falls du das nicht warst, kannst du diese Nachricht ignorieren.</p>
      <br/>
      <p>Dein Fachfriseur-Team</p>
    `;

    await sendEmail({ to: email, subject: "Passwort zurücksetzen – Fachfriseur", html });

    return res.status(200).json({ msg: "Falls die E-Mail existiert, wurde ein Link versendet." });
  } catch (err) {
    logger.error("❌ Fehler beim Passwort-Reset-Request:", err);
    next(err);
  }
};

// Passwort-Reset: Bestätigung
exports.passwordResetConfirm = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const { token, newPassword } = req.body;

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetTokenHash: tokenHash,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      logger.debug("❌ Ungültiger oder abgelaufener Token beim Passwort-Reset.");
      return res.status(400).json({ errors: [{ msg: "Ungültiger oder abgelaufener Token." }] });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    if (typeof user.clearResetToken === "function") {
      user.clearResetToken();
    } else {
      user.resetTokenHash = undefined;
      user.resetTokenExpire = undefined;
    }

    await user.save();
    logger.info(`🔁 Passwort zurückgesetzt für: ${mask(user.email)}`);
    res.status(200).json({ message: "Passwort erfolgreich zurückgesetzt." });
  } catch (err) {
    logger.error("❌ Fehler beim Zurücksetzen des Passworts:", err);
    res.status(500).json({ errors: [{ msg: "Serverfehler beim Zurücksetzen des Passworts." }] });
  }
};
