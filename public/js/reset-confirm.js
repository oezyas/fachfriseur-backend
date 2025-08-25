// public/js/reset-confirm.js
import { secureFetch } from "./utils/secureFetch.js";
import { withTimeout } from "./utils/withTimeout.js";
import {  showMessage, showError, showSuccess, showInfo , setButtonDisabled } from "./utils/ui.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetConfirmForm");
  const messageDiv = document.getElementById("message");
  if (!form || !messageDiv) return;

  const passwordEl = document.getElementById("password");
  const confirmEl = document.getElementById("confirmPassword");
  const submitBtn = form.querySelector('button[type="submit"]');

  // KEIN lokales show() mehr!

  // Token aus URL holen
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (!token) {
    showError(messageDiv, "❌ Ungültiger oder fehlender Reset-Link.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const pw = passwordEl?.value || "";
    const pw2 = confirmEl?.value || "";

    if (pw.length < 8) {
      showError(messageDiv, "❌ Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }
    if (pw !== pw2) {
      showError(messageDiv, "❌ Passwörter stimmen nicht überein.");
      return;
    }

    let t;
    try {
      setButtonDisabled(submitBtn, true);
      showInfo(messageDiv, "Sende neues Passwort…");

      t = withTimeout(10000);

      const res = await secureFetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: t.signal,
        body: JSON.stringify({ token, password: pw }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showSuccess(messageDiv, "✅ Passwort erfolgreich geändert. Bitte einloggen.");
        setTimeout(() => (window.location.href = "login.html"), 1500);
      } else {
        showError(messageDiv, data?.errors?.[0]?.msg || "❌ Fehler beim Zurücksetzen.");
      }
    } catch (err) {
      console.error("❌ Fehler beim Passwort-Reset-Confirm:", err);
      showError(messageDiv, "❌ Netzwerk-/Serverfehler oder Timeout.");
    } finally {
      if (t) t.done();
      setButtonDisabled(submitBtn, false);
    }
  });
});
