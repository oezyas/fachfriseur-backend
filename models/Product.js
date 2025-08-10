const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true},
    price: { type: Number, required: true },
    purchasePrice: { type: Number, select: false },
    description: { type: String, default: "" },
    category: { type: String, required: true },
    productLine: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    slug: { type: String, required: true }, // unique entfernt
    isFeatured: { type: Boolean, default: false },
    collectionId: { type:String, default: "" },
    neu: {type: String, default: ""}
  },
  { timestamps: true }
);

// Slug automatisch setzen vor dem Speichern (nur beim Erstellen oder Name-Änderung)
productSchema.pre("save", async function(next) {
  if (!this.slug || this.isModified('name')) {
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    let slug = baseSlug;
    let count = 1;

    // Prüfen, ob Slug schon existiert (außer bei eigenem Dokument)
    while (await mongoose.models.Product.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${count++}`;
    }

    this.slug = slug;
  }
  next();
});

// Einziger eindeutiger Index für slug
productSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model("Product", productSchema);
