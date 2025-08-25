import { secureFetch } from "./utils/secureFetch.js";
import { withTimeout } from "./utils/withTimeout.js";
import { showError, showSuccess, showInfo, setButtonDisabled } from "./utils/ui.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const message = document.getElementById("message");
  if (!form || !message) return;

  const btn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = (document.getElementById("email")?.value || "").trim().toLowerCase();
    const password = document.getElementById("password")?.value || "";
    const passwordConfirm = document.getElementById("passwordConfirm")?.value || "";
    const username = (document.getElementById("username")?.value || "").trim();

    if (!email || !password || !passwordConfirm) {
      return showError(message, "❌ Bitte alle Pflichtfelder ausfüllen.");
    }

    if (password !== passwordConfirm) {
      return showError(message, "❌ Passwörter stimmen nicht überein.");
    }

    if (password.length < 12) {
      return showError(message, "❌ Passwort: mind. 12 Zeichen, Groß-/Kleinbuchstabe, Zahl, Sonderzeichen.");
    }

    let t;
    try {
      setButtonDisabled(btn, true);
      showInfo(message, "📝 Registrierung läuft…");

      const body = { email, password, passwordConfirm };
      if (username) body.username = username;

      t = withTimeout(10000);
      const res = await secureFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: t.signal,
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showSuccess(message, "✅ Registrierung erfolgreich. Du wirst weitergeleitet.");
        setTimeout(() => {
          window.location.href = "/login.html";
        }, 1200);
      } else {
        if (Array.isArray(data.errors) && data.errors.length) {
          const text = data.errors.map((e) => `❌ ${e.msg || String(e)}`).join("\n");
          showError(message, text);
          message.style.whiteSpace = "pre-wrap";
        } else {
          showError(message, `❌ ${data.message || "Fehler bei der Registrierung."}`);
        }
      }
    } catch (err) {
      console.error("❌ Registrierungs-Fehler:", err);
      showError(message, "❌ Netzwerk-/Serverfehler oder Timeout.");
    } finally {
      if (t) t.done();
      setButtonDisabled(btn, false);
    }
  });
});
