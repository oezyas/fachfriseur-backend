// middleware/optionalAuth.js
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error("JWT_SECRET ist nicht gesetzt!");

function optionalAuth(req, res, next) {
  let token = req.cookies?.token;

  if (!token) {
    const auth = req.get("authorization");
    if (auth && auth.startsWith("Bearer ")) token = auth.slice(7);
  }

  if (!token) return next();

  try {
    const payload = jwt.verify(token, SECRET);

    if (!req.user) {
      req.user = { id: payload.id, role: payload.role, email: payload.email };
    }
    res.locals.user = req.user;
  } catch (err) {
    // Ungültiger oder abgelaufener Token → Anfrage läuft ohne User weiter
  }

  return next();
}

module.exports = { optionalAuth };
