// controllers/protected.controller.js
// Geschützte Route – Token wurde bereits in Middleware geprüft
exports.getProtectedData = (req, res) => {
  // defensive: nur minimale Infos weitergeben
  const safeUser = req.user
    ? { id: req.user.id, role: req.user.role, email: req.user.email }
    : null;

  res
    .status(200)
    .type("application/json; charset=utf-8")
    .json({
      message: "Geschützte Route, Zugriff erlaubt",
      user: safeUser,
    });
};
