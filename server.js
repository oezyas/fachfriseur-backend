// server.js
require("dotenv").config();

const https = require("https");
const http = require("http");
const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const mongoose = require("mongoose");

const logger = require("./logger");
const { errorHandler } = require("./utils/errorHandler");

process.on("unhandledRejection", (e) => logger.error("UNHANDLED:", e));
process.on("uncaughtException", (e) => logger.error("UNCAUGHT:", e));

const app = express();
const isProd = process.env.NODE_ENV === "production";

// Proxy/Hardening
app.set("trust proxy", 1);
app.disable("x-powered-by");

// --- Core Middleware ---
app.use(cookieParser());
if (!isProd) app.use(morgan("dev"));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Helmet + CSP (connect-src dynamisch)
const connectSrc = ["'self'"];
if (process.env.FRONTEND_ORIGIN) {
  connectSrc.push(
    ...process.env.FRONTEND_ORIGIN.split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:"],
      "connect-src": connectSrc,
      "frame-ancestors": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
    },
  })
);

// CORS (nur wenn externes Frontend)
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
if (FRONTEND_ORIGIN) {
  const origins = FRONTEND_ORIGIN.split(",").map((s) => s.trim());
  app.use(cors({ origin: origins, credentials: true }));
}

// Alte URLs dauerhaft umleiten (später entfernbar)

// --- Static Assets ---
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

// Root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- DB ---
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  logger.error("Fehler: MONGO_URI ist nicht gesetzt in .env!");
  process.exit(1);
}
mongoose
  .connect(mongoUri)
  .then(() => logger.info("MongoDB connected"))
  .catch((err) => {
    logger.error("MongoDB connection error:", err);
    process.exit(1);
  });

// --- Routes ---
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const protectedRoutes = require("./routes/protected");
const passwordResetRoutes = require("./routes/passwordReset"); // /request & /confirm

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/produkte", productRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/password-reset", passwordResetRoutes);

// ✅ Healthcheck
app.get('/health', (req, res) => res.send('ok'));

// 404
app.use((req, res) => {
  logger.warn(`404 ${req.method} ${req.originalUrl}`);
  res.status(404).json({ errors: [{ msg: "Route nicht gefunden" }] });
});

// Zentraler Error-Handler (letzte Middleware)
app.use(errorHandler);

// --- Server (HTTPS mit Fallback auf HTTP) ---
const PORT = process.env.PORT || 3443;
const keyPath = process.env.TLS_KEY_PATH || "localhost-key.pem";
const certPath = process.env.TLS_CERT_PATH || "localhost.pem";

try {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  https.createServer(options, app).listen(PORT, () => {
    logger.info(`HTTPS Server läuft auf Port ${PORT}`);
  });
} catch (e) {
  logger.warn(`⚠️  Konnte HTTPS nicht starten (${e.message}). Fallback auf HTTP (nur DEV).`);
  http.createServer(app).listen(PORT, () => {
    logger.info(`HTTP Server läuft auf Port ${PORT}`);
  });
}
