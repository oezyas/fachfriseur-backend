// middleware/auth.js
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error("JWT_SECRET ist nicht gesetzt!");

// Prüft Token aus Cookie ODER Authorization-Header
function authenticateToken(req, res, next) {
  // 1) Cookie
  let token = req.cookies?.token;

  // 2) Fallback: Authorization: Bearer <token>
  if (!token) {
    const auth = req.get("authorization");
    if (auth && auth.startsWith("Bearer ")) {
      token = auth.slice(7);
    }
  }

  if (!token) {
    return res.status(401).json({ errors: [{ msg: "Nicht autorisiert." }] });
  }

  try {
    const payload = jwt.verify(token, SECRET);

    // ✨ Änderung: Email entfernt, da sie nicht im Token enthalten ist
    req.user = { 
      id: payload.id, 
      role: payload.role 
    };

    return next();
  } catch (err) {
    return res.status(403).json({ errors: [{ msg: "Zugriff verweigert." }] });
  }
}

// Neue Middleware: Rollenprüfung
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ errors: [{ msg: "Nicht eingeloggt." }] });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ errors: [{ msg: "Keine Berechtigung." }] });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole };
