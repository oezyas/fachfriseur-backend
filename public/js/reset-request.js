// public/js/reset-request.js
import { secureFetch } from "./utils/secureFetch.js";
import { withTimeout } from "./utils/withTimeout.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetRequestForm");
  const messageDiv = document.getElementById("message");
  if (!form || !messageDiv) return;

  const emailEl = document.getElementById("email");
  const submitBtn = form.querySelector('button[type="submit"]');

  const show = (txt, color = "inherit") => {
    messageDiv.textContent = txt;
    messageDiv.style.color = color;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (emailEl?.value || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      show("❌ Bitte eine gültige E-Mail eingeben.", "red");
      return;
    }

    let t;
    try {
      submitBtn && (submitBtn.disabled = true);
      show("Sende Anfrage…");

      t = withTimeout(10000);

      const res = await secureFetch("/api/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: t.signal,
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        show("📧 Falls registriert, wurde eine E-Mail gesendet.", "green");
        setTimeout(() => (window.location.href = "login.html"), 1500);
      } else {
        show(data?.errors?.[0]?.msg || "❌ Fehler bei der Anfrage.", "red");
      }
    } catch (err) {
      console.error("❌ Fehler beim Passwort-Reset-Request:", err);
      show("❌ Netzwerk-/Serverfehler oder Timeout.", "red");
    } finally {
      if (t) t.done();
      submitBtn && (submitBtn.disabled = false);
    }
  });
});
