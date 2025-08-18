// public/js/register.js
import { secureFetch } from "./utils/secureFetch.js";
import { withTimeout } from "./utils/withTimeout.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const message = document.getElementById("message");
  if (!form || !message) return;

  const show = (txt, color = "inherit") => {
    message.textContent = txt;
    message.style.color = color;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = (document.getElementById("email")?.value || "").trim().toLowerCase();
    const emailRepeat = (document.getElementById("emailRepeat")?.value || "").trim().toLowerCase();
    const password = document.getElementById("password")?.value || "";
    const passwordConfirm = document.getElementById("passwordConfirm")?.value || "";
    const username = (document.getElementById("username")?.value || "").trim();
    const btn = form.querySelector('button[type="submit"]');

    if (!email || !emailRepeat || !password || !passwordConfirm) {
      return show("❌ Bitte fülle alle Felder aus.", "red");
    }
    if (email !== emailRepeat) {
      return show("❌ E-Mail-Adressen stimmen nicht überein.", "red");
    }
    if (password !== passwordConfirm) {
      return show("❌ Passwörter stimmen nicht überein.", "red");
    }
    if (
      password.length < 12 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z0-9]/.test(password)
    ) {
      return show("❌ Passwort: mind. 12 Zeichen, Groß-/Kleinbuchstabe, Zahl, Sonderzeichen.", "red");
    }

    let t;
    try {
      btn && (btn.disabled = true);
      show("📝 Registrierung läuft…");

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
        show("✅ Registrierung erfolgreich! Weiterleitung…", "green");
        form.reset();
        setTimeout(() => (window.location.href = "login.html"), 800);
      } else {
        const html = Array.isArray(data.errors)
          ? data.errors.map((e) => `<p>❌ ${e.msg}</p>`).join("")
          : `<p>❌ ${data.message || "Fehler bei der Registrierung."}</p>`;
        message.innerHTML = html;
        message.style.color = "red";
      }
    } catch (err) {
      console.error("❌ Registrierungs-Fehler:", err);
      show("❌ Netzwerk-/Serverfehler oder Timeout.", "red");
    } finally {
      if (t) t.done();
      btn && (btn.disabled = false);
    }
  });
});
