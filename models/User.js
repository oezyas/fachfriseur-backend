const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, default: "", trim: true, maxlength: 64 },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true, // normalize for unique index
    },
    // Hinweis: wir lassen select: true, damit dein aktueller Login nicht bricht.
    // Wenn du willst, können wir später auf select:false umstellen und im Login .select('+password') nutzen.
    password: { type: String, required: true },

    role: { type: String, enum: ["user", "admin"], default: "user", index: true },

    // Sicheres Reset-Token: nur der Hash wird gespeichert
    resetTokenHash: { type: String, select: false, index: true },
    resetTokenExpire: { type: Date, index: true },

    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        // sensible Felder nie nach außen geben
        delete ret.password;
        delete ret.resetTokenHash;
        delete ret.resetTokenExpire;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Virtuelles Feld: ob der Benutzer aktuell gesperrt ist
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hilfsfunktionen für Reset-Token
userSchema.methods.setResetToken = function (rawToken, ttlMinutes = 20) {
  this.resetTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.resetTokenExpire = new Date(Date.now() + ttlMinutes * 60 * 1000);
};

userSchema.methods.clearResetToken = function () {
  this.resetTokenHash = undefined;
  this.resetTokenExpire = undefined;
};

// sinnvolle Indizes
userSchema.index({ resetTokenHash: 1, resetTokenExpire: 1 });

module.exports = mongoose.model("User", userSchema);
