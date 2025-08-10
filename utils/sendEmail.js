const nodemailer = require("nodemailer");
const logger = require("../logger");

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
} = process.env;

if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASS) {
  throw new Error("E-Mail-Konfiguration unvollständig (HOST/PORT/USER/PASS)!");
}

const port = Number(EMAIL_PORT);
const secure = port === 465; // 465 = SMTPS; 587 = STARTTLS

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port,
  secure,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  // etwas robuster im Betrieb
  pool: true,
  maxConnections: 5,
  maxMessages: 50,
  // Für 587: TLS aushandeln
  requireTLS: !secure,
  // timeouts
  socketTimeout: 20000,
  greetingTimeout: 10000,
  connectionTimeout: 20000,
});

// Beim Start kurz prüfen (loggt nur Warnung – wir werfen nicht hart)
transporter.verify((err, success) => {
  if (err) {
    logger.warn("⚠️  SMTP-Verify fehlgeschlagen:", err.message || err);
  } else {
    logger.info("✅ SMTP-Transport bereit.");
  }
});

async function sendEmail({ to, subject, html, text }) {
  const from = EMAIL_FROM || EMAIL_USER;

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
    });

    // E-Mail-Adresse im Log maskieren (DSGVO)
    const masked = String(to).replace(/(.{3}).+(@.+)/, "$1***$2");
    logger.info(`📧 E-Mail gesendet an ${masked} – Betreff: ${subject}`);
  } catch (err) {
    logger.error("❌ Fehler beim E-Mail-Versand:", err);
    // nach außen keine Sensitivdetails leaken
    throw new Error("E-Mail konnte nicht gesendet werden.");
  }
}

module.exports = sendEmail;
