import { secureFetch } from "./utils/secureFetch.js";
import { withTimeout } from "./utils/withTimeout.js";
import { showMessage, showError, showSuccess, showInfo, setButtonDisabled } from "./utils/ui.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetRequestForm");
  const messageDiv = document.getElementById("message");
  if (!form || !messageDiv) return;

  const emailEl = document.getElementById("email");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (emailEl?.value || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      showError(messageDiv, "❌ Bitte eine gültige E-Mail eingeben.");
      return;
    }

    let t;
    try {
      setButtonDisabled(submitBtn, true);
      showInfo(messageDiv, "Sende Anfrage…");

      t = withTimeout(10000);

      const res = await secureFetch("/api/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: t.signal,
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showSuccess(messageDiv, "📧 Falls registriert, wurde eine E-Mail gesendet.");
        setTimeout(() => (window.location.href = "login.html"), 1500);
      } else {
        showError(messageDiv, data?.errors?.[0]?.msg || "❌ Fehler bei der Anfrage.");
      }
    } catch (err) {
      console.error("❌ Fehler beim Passwort-Reset-Request:", err);
      showError(messageDiv, "❌ Netzwerk-/Serverfehler oder Timeout.");
    } finally {
      if (t) t.done();
      setButtonDisabled(submitBtn, false);
    }
  });
});
