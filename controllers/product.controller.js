const Product = require("../models/product");
const path = require("path");
const slugify = require("slugify");

// GET /api/produkte mit Filter, Sortierung, Pagination, Einzelprodukt per Slug
exports.getProductsByQuery = async (req, res, next) => {
  try {
    const {
      slug,
      category,
      featured,
      collection,
      productLine,
      brand,
      sortBy,
      limit,
      page,
    } = req.query;

    if (slug) {
    const slugFilter = { slug };

  // Nur Admins dürfen inaktive Produkte sehen
    if (!req.user || req.user.role !== "admin") {
      slugFilter.status = "active";
    }

  const products = await Product.find(slugFilter)
    .select("name price description imageUrl category slug productLine brand status");

  return res.json(products);
}


    const filter = {};
    if (!req.user || req.user.role !== "admin") {
      filter.status = "active";
    }
    if (category) filter.category = category;
    if (featured !== undefined) filter.isFeatured = featured === "true";
    if (collection) filter.collectionId = collection;
    if (productLine) filter.productLine = productLine;
    if (brand) filter.brand = brand;

    const lim = Number.isInteger(parseInt(limit)) && parseInt(limit) > 0 ? parseInt(limit) : 3;
    const pg = Number.isInteger(parseInt(page)) && parseInt(page) > 0 ? parseInt(page) : 1;
    const skip = (pg - 1) * lim;

    let query = Product.find(filter)
    .skip(skip)
    .limit(lim)
    .select("name price description imageUrl category slug productLine brand status");

    const sortOptions = {
      name: { name: 1 },
      priceAsc: { price: 1 },
      priceDesc: { price: -1 },
      newest: { createdAt: -1 },
    };
    if (sortBy && sortOptions[sortBy]) {
      query = query.sort(sortOptions[sortBy]);
    }

    const products = await query.exec();
    const totalCount = await Product.countDocuments(filter);
    res.json({ products, totalCount });

  } catch (err) {
    next(err);
  }
};

// POST /api/produkte - Produkt erstellen
exports.createProduct = async (req, res, next) => {
  try {
    const data = req.body;

    const price = parseFloat(data.price);
    const purchasePrice = data.purchasePrice !== undefined ? parseFloat(data.purchasePrice) : undefined;


    if (req.file) {
      data.imageUrl = req.file.filename;
    }

    if (!data.name || !data.price || !data.category) {
      return res.status(400).json({ message: "Name, Preis und Kategorie sind erforderlich." });
    }

    // Slug manuell erzeugen, falls nicht automatisch von mongoose pre-save
    let baseSlug = slugify(data.name, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;

    while (await Product.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }
    data.slug = slug;

    console.log("Gesendeter Status ist:", data.status);
    const newProduct = new Product(data);
    await newProduct.save();
    console.log("Gespeicherter Status:", newProduct.status);

    res.status(201).json(newProduct);
  } catch (err) {
    console.error("❌ Fehler beim Produkt-Speichern:", err);
    next(err);
  }
};


// PUT /api/produkte/:id - Produkt aktualisieren
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const price = parseFloat(data.price);
    const purchasePrice = data.purchasePrice !== undefined ? parseFloat(data.purchasePrice) : undefined;

    console.log("Update Produkt ID:", id);
    console.log("Daten:", data);

    if (req.file) {
      data.imageUrl = req.file.filename; // nur Dateiname speichern
    } 

    const updatedProduct = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!updatedProduct) {
      return res.status(404).json({ message: "Produkt nicht gefunden." });
    }

    res.json(updatedProduct);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/produkte/:id - Produkt löschen
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Produkt nicht gefunden." });
    }

    res.json({ message: "Produkt gelöscht." });
  } catch (err) {
    next(err);
  }
};
