const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      default: "",
      trim: true,
      maxlength: [64, "Username darf max. 64 Zeichen haben"],
    },
    email: {
      type: String,
      required: [true, "E-Mail ist erforderlich"],
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Ungültige E-Mail-Adresse"],
    },
    password: {
      type: String,
      required: [true, "Passwort ist erforderlich"],
      minlength: [8, "Passwort muss mindestens 8 Zeichen lang sein"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
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

userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.methods.setResetToken = function (rawToken, ttlMinutes = 20) {
  this.resetTokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  this.resetTokenExpire = new Date(Date.now() + ttlMinutes * 60 * 1000);
};

userSchema.methods.clearResetToken = function () {
  this.resetTokenHash = undefined;
  this.resetTokenExpire = undefined;
};

userSchema.index({ resetTokenHash: 1, resetTokenExpire: 1 });

module.exports = mongoose.model("User", userSchema);
