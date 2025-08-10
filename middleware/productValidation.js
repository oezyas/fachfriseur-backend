const { body } = require("express-validator");

const productValidation = [
  body("name").notEmpty().withMessage("Produktname ist erforderlich"),
  body("brand").notEmpty().withMessage("Marke ist erforderlich"),
  body("price").isFloat({ gt: 0 }).withMessage("Preis muss größer als 0 sein"),
  body("description").notEmpty().withMessage("Beschreibung ist erforderlich"),
  body("purchasePrice").isFloat({ gt: 0 }).withMessage("Einkaufspreis muss >= 0 sein"),
  // Bild wird über Upload geprüft, hier kein Textfeld
  body("category").notEmpty().withMessage("Kategorie ist erforderlich"),
  body("productLine").notEmpty().withMessage("Produktlinie ist erforderlich"),
  body("seoTitle").notEmpty().withMessage("SEO-Titel ist erforderlich").isLength({ max: 60 }).withMessage("SEO-Titel max. 60 Zeichen"),
  body("seoDescription").notEmpty().withMessage("SEO-Beschreibung ist erforderlich").isLength({ max: 160 }).withMessage("SEO-Beschreibung max. 160 Zeichen"),
  body("neu").notEmpty().withMessage("Neu ist erforderlich"),
  body("status").optional().isIn(["active", "inactive"]).withMessage("Status muss 'active' oder 'inactive' sein")
];

module.exports = productValidation;
