// middleware/optionalAuth.js
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error("JWT_SECRET ist nicht gesetzt!");

function optionalAuth(req, res, next) {
  // 1) Cookie
  let token = req.cookies?.token;

  // 2) Fallback: Authorization: Bearer <token>
  if (!token) {
    const auth = req.get("authorization");
    if (auth && auth.startsWith("Bearer ")) token = auth.slice(7);
  }

  if (!token) return next();

  try {
    const payload = jwt.verify(
      token,
      SECRET
      // , { algorithms: ["HS256"], clockTolerance: 5 } // optional härten
    );

    // nur minimale Infos weiterreichen; nicht überschreiben, falls schon gesetzt
    if (!req.user) {
      req.user = { id: payload.id, role: payload.role, email: payload.email };
    }
    res.locals.user = req.user; // optional hilfreich für Views
  } catch (err) {
    // ungültiger/abgelaufener Token -> einfach ohne User weiter
    // optional: ungültiges Cookie auto-löschen:
    // res.clearCookie("token", { path: "/" });
  }

  return next();
}

module.exports = { optionalAuth };
