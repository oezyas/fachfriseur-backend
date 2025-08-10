// logger/index.js
const fs = require("fs");
const { createLogger, transports, format } = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

fs.mkdirSync("logs", { recursive: true });

const isProd = process.env.NODE_ENV === "production";
const level = process.env.LOG_LEVEL || "info";

const baseFormat = format.combine(
  format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, stack }) =>
    `${timestamp} [${level.toUpperCase()}]: ${stack || message}`
  )
);

const logger = createLogger({
  level,
  format: baseFormat,
  transports: [
    new DailyRotateFile({
      level: "error",
      filename: "logs/error-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "10m",
      maxFiles: "14d",
      auditFile: "logs/.error-audit.json",      // ← vermeidet viele Hash-Auditfiles
    }),
    new DailyRotateFile({
      filename: "logs/combined-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "10m",
      maxFiles: "14d",
      auditFile: "logs/.combined-audit.json",   // ← dito
    }),
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: "logs/exceptions-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxFiles: "30d",
      auditFile: "logs/.exceptions-audit.json",
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: "logs/rejections-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxFiles: "30d",
      auditFile: "logs/.rejections-audit.json",
    }),
  ],
});

// Konsole in DEV
if (!isProd) logger.add(new transports.Console());

module.exports = logger;
