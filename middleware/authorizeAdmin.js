// middleware/authorizeAdmin.js
const logger = require("../logger");

function authorizeAdmin(req, res, next) {
  if (!req.user) {
    logger.warn("Adminzugriff verweigert – kein Benutzer im Request");
    return res.status(401).json({ errors: [{ msg: "Nicht authentifiziert." }] });
  }

  if (req.user.role !== "admin") {
    logger.warn(`Adminzugriff verweigert – userId=${req.user.id || "?"}`);
    return res.status(403).json({ errors: [{ msg: "Kein Zugriff, Adminrechte erforderlich." }] });
  }

  logger.info(`Adminzugriff erlaubt – userId=${req.user.id || "?"}`);
  return next();
}

module.exports = { authorizeAdmin };
