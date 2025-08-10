// routes/user.js
const express = require('express');
const { param } = require('express-validator');
const router = express.Router();

const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const conditionalRateLimiter = require('../middleware/conditionalRateLimiter');
const { validate } = require('../middleware/validateInput');

// Alle User-Routen: Auth + rollenbasierter Rate-Limiter
router.use(authenticateToken, conditionalRateLimiter);

// GET /api/users/me  – eigenes Profil
router.get('/me', async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('username email role')
      .lean();
    if (!user) {
      return res.status(401).json({ errors: [{ msg: 'Nicht authentifiziert.' }] });
    }
    return res.json({ user: { id: req.user.id, ...user } });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id  – nur Self oder Admin
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Ungültige Benutzer-ID')],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const isSelf = id === req.user.id;
      const isAdmin = req.user.role === 'admin';
      if (!isSelf && !isAdmin) {
        return res.status(403).json({ errors: [{ msg: 'Kein Zugriff.' }] });
      }

      const user = await User.findById(id)
        .select('username email role')
        .lean();

      if (!user) {
        return res.status(404).json({ errors: [{ msg: 'Benutzer nicht gefunden.' }] });
      }

      return res.json({ user: { id, ...user } });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
