// routes/product.js
const express = require("express");
const router = express.Router();
const { query, param } = require("express-validator");

const { optionalAuth } = require("../middleware/optionalAuth");
const { authenticateToken, requireRole } = require("../middleware/auth"); // ✨ requireRole hier importiert
const { productLimiter } = require("../middleware/rateLimiters");

const productValidation = require("../middleware/productValidation");
const { validate } = require("../middleware/validateInput");
const upload = require("../middleware/upload");
const productController = require("../controllers/product.controller");

// ✅ Öffentlich: Produkte lesen (mit sicherer Query-Validierung)
router.get(
  "/",
  optionalAuth,
  [
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("page").optional().isInt({ min: 1, max: 1000 }).toInt(),
    query("status").optional().isIn(["active", "inactive", "all"]),
    query("sortBy").optional().isIn(["name", "priceAsc", "priceDesc", "newest"]),
    query("brand").optional().trim().isLength({ max: 100 }),
    query("category").optional().trim().isLength({ max: 100 }),
    query("productLine").optional().trim().isLength({ max: 100 }),
    query("slug").optional().trim().isLength({ max: 160 }),
  ],
  validate,
  productController.getProductsByQuery
);

// 🔒 Admin: Produkt anlegen
router.post(
  "/",
  authenticateToken,
  requireRole("admin"), // ✨ ersetzt authorizeAdmin
  productLimiter,
  upload.single("imageUrl"),
  productValidation,
  validate,
  productController.createProduct
);

// 🔒 Admin: Produkt ändern
router.put(
  "/:id",
  authenticateToken,
  requireRole("admin"), // ✨ ersetzt authorizeAdmin
  productLimiter,
  [param("id").isMongoId().withMessage("Ungültige Produkt-ID")],
  validate,
  upload.single("imageUrl"),
  productValidation,
  validate,
  productController.updateProduct
);

// 🔒 Admin: Produkt löschen
router.delete(
  "/:id",
  authenticateToken,
  requireRole("admin"), // ✨ ersetzt authorizeAdmin
  productLimiter,
  [param("id").isMongoId().withMessage("Ungültige Produkt-ID")],
  validate,
  productController.deleteProduct
);

module.exports = router;
