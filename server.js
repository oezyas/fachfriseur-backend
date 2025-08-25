require("dotenv").config();

const https = require("https");
const http = require("http");
const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const expressWinston = require("express-winston");
const path = require("path");
const mongoose = require("mongoose");
const logger = require("./logger");
const { errorHandler } = require("./utils/errorHandler");
const { setCsrfCookie } = require("./utils/cookieManager");
const csrfProtection = require("./middleware/csrf");


process.on("unhandledRejection", (e) => logger.error("UNHANDLED:", e));
process.on("uncaughtException", (e) => logger.error("UNCAUGHT:", e));

const app = express();
const isProd = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(cookieParser());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
const connectSrc = ["'self'"];
if (process.env.FRONTEND_ORIGIN) {
  connectSrc.push(
    ...process.env.FRONTEND_ORIGIN
      .split(",")
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
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;
if (FRONTEND_ORIGIN) {
  const origins = FRONTEND_ORIGIN.split(",").map((s) => s.trim());
  app.use(cors({ origin: origins, credentials: true }));
}
app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms",
    colorize: false,
    ignoreRoute: () => false,
  })
);

app.get("/api/csrf-token", csrfProtection, (req, res) => {
  const token = req.csrfToken();
  setCsrfCookie(res, token);
  res.json({ csrfToken: token });
});

app.use((req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  csrfProtection(req, res, next);
});






app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

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

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const protectedRoutes = require("./routes/protected");
const passwordResetRoutes = require("./routes/passwordReset");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/produkte", productRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/password-reset", passwordResetRoutes);

app.get("/health", (req, res) => res.send("ok"));

app.use((req, res) => {
  logger.warn(`404 ${req.method} ${req.originalUrl}`);
  res.status(404).json({ errors: [{ msg: "Route nicht gefunden" }] });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3443;
const keyPath = process.env.TLS_KEY_PATH || "localhost-key.pem";
const certPath = process.env.TLS_CERT_PATH || "localhost.pem";

try {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  https.createServer(options, app).listen(PORT, () => {
    logger.info(`✅ HTTPS Server läuft auf Port ${PORT}`);
  });
} catch (e) {
  logger.warn(`⚠️  Konnte HTTPS nicht starten (${e.message}). Fallback auf HTTP (nur DEV).`);
  http.createServer(app).listen(PORT, () => {
    logger.info(`✅ HTTP Server läuft auf Port ${PORT}`);
  });
}
