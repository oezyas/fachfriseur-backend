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
    // nur minimal nötige Infos weiterreichen
    req.user = { id: payload.id, role: payload.role, email: payload.email };
    return next();
  } catch (err) {
    return res.status(403).json({ errors: [{ msg: "Zugriff verweigert." }] });
  }
}

module.exports = { authenticateToken };
