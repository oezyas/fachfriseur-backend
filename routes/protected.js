const express = require("express");
const router = express.Router();
const User = require("../models/User");
const logger = require("../logger");
const { authenticateToken } = require("../middleware/auth");
const { authorizeAdmin } = require("../middleware/authorizeAdmin");
const conditionalRateLimiter = require("../middleware/conditionalRateLimiter");

// Alle geschützten Routen: erst Auth, dann rollenbasierter Rate-Limiter
router.use(authenticateToken, conditionalRateLimiter);

// GET /api/protected – leichte DB-Last, dafür frische E-Mail/Rolle
router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("email role").lean();
    if (!user) {
      logger.warn(`Benutzer nicht gefunden: ${req.user.id}`);
      return res.status(401).json({ errors: [{ msg: "Nicht authentifiziert." }] });
    }
    return res.status(200).json({
      message: "Zugriff auf geschützte Route erfolgreich.",
      user: { id: req.user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    logger.error("Fehler bei /api/protected:", err);
    return res.status(500).json({ errors: [{ msg: "Serverfehler." }] });
  }
});

// GET /api/protected/admin-check – nur Admin
router.get("/admin-check", authorizeAdmin, (req, res) => {
  return res.status(200).json({
    message: "Admin bestätigt",
    user: { id: req.user.id, role: req.user.role },
  });
});

module.exports = router;
