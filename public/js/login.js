import { secureFetch } from "./utils/secureFetch.js";
import { showMessage, showError, showSuccess, showInfo, setButtonDisabled } from "./utils/ui.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return console.error("loginForm nicht gefunden.");

  const emailEl = document.getElementById("email");
  const passwordEl = document.getElementById("password");
  const message = document.getElementById("message");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = (emailEl?.value || "").trim().toLowerCase();
    const password = passwordEl?.value || "";

    if (!email || !password) {
      showError(message, "❌ Bitte E-Mail und Passwort eingeben.");
      return;
    }

    try {
      setButtonDisabled(submitBtn, true);
      showInfo(message, "🔑 Anmeldung läuft…");

      const res = await secureFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showSuccess(message, "✅ Login erfolgreich! Weiterleitung…");
        setTimeout(() => {
          if (data.role === "admin") {
            window.location.href = "/admin/produkte-verwalten.html";
          } else {
            window.location.href = "/index.html";
          }
        }, 800);
      } else if (res.status === 423) {
        showError(message, data?.errors?.[0]?.msg || "❌ Account vorübergehend gesperrt.");
      } else if (res.status === 401) {
        showError(message, data?.errors?.[0]?.msg || "❌ E-Mail oder Passwort falsch.");
      } else {
        showError(message, data?.errors?.[0]?.msg || "❌ Login fehlgeschlagen.");
      }
    } catch (err) {
      console.error("❌ Login-Fehler:", err);
      showError(message, "❌ Netzwerk-/Serverfehler oder Timeout.");
    } finally {
      setButtonDisabled(submitBtn, false);
    }
  });
});
