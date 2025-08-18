// public/js/reset-confirm.js
import { secureFetch } from "./utils/secureFetch.js";
import { withTimeout } from "./utils/withTimeout.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetConfirmForm");
  const messageDiv = document.getElementById("message");
  if (!form || !messageDiv) return;

  const passwordEl = document.getElementById("password");
  const confirmEl = document.getElementById("confirmPassword");
  const submitBtn = form.querySelector('button[type="submit"]');

  const show = (txt, color = "inherit") => {
    messageDiv.textContent = txt;
    messageDiv.style.color = color;
  };

  // Token aus URL holen
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (!token) {
    show("❌ Ungültiger oder fehlender Reset-Link.", "red");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const pw = passwordEl?.value || "";
    const pw2 = confirmEl?.value || "";

    if (pw.length < 8) {
      show("❌ Passwort muss mindestens 8 Zeichen lang sein.", "red");
      return;
    }
    if (pw !== pw2) {
      show("❌ Passwörter stimmen nicht überein.", "red");
      return;
    }

    let t;
    try {
      submitBtn && (submitBtn.disabled = true);
      show("Sende neues Passwort…");

      t = withTimeout(10000);

      const res = await secureFetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: t.signal,
        body: JSON.stringify({ token, password: pw }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        show("✅ Passwort erfolgreich geändert. Bitte einloggen.", "green");
        setTimeout(() => (window.location.href = "login.html"), 1500);
      } else {
        show(data?.errors?.[0]?.msg || "❌ Fehler beim Zurücksetzen.", "red");
      }
    } catch (err) {
      console.error("❌ Fehler beim Passwort-Reset-Confirm:", err);
      show("❌ Netzwerk-/Serverfehler oder Timeout.", "red");
    } finally {
      if (t) t.done();
      submitBtn && (submitBtn.disabled = false);
    }
  });
});
