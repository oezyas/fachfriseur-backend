// public/js/login.js
import { secureFetch } from "./utils/secureFetch.js";
import { withTimeout } from "./utils/withTimeout.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return console.error("loginForm nicht gefunden.");

  const emailEl = document.getElementById("email");
  const passwordEl = document.getElementById("password");
  const message = document.getElementById("message");
  const submitBtn = form.querySelector('button[type="submit"]');

  const showMsg = (text, color = "inherit") => {
    if (!message) return;
    message.textContent = text;
    message.style.color = color;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = (emailEl?.value || "").trim().toLowerCase();
    const password = passwordEl?.value || "";

    if (!email || !password) {
      showMsg("❌ Bitte E-Mail und Passwort eingeben.", "red");
      return;
    }

    let t;
    try {
      submitBtn && (submitBtn.disabled = true);
      showMsg("🔑 Anmeldung läuft…");

      t = withTimeout(10000);
      const res = await secureFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: t.signal,
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        showMsg("✅ Login erfolgreich! Weiterleitung…", "green");
        setTimeout(() => {
          window.location.href = data.redirectUrl || "/index.html";
        }, 800);
      } else if (res.status === 423) {
        showMsg(data?.errors?.[0]?.msg || "❌ Account vorübergehend gesperrt.", "red");
      } else if (res.status === 401) {
        showMsg(data?.errors?.[0]?.msg || "❌ E-Mail oder Passwort falsch.", "red");
      } else {
        showMsg(data?.errors?.[0]?.msg || "❌ Login fehlgeschlagen.", "red");
      }
    } catch (err) {
      console.error("❌ Login-Fehler:", err);
      showMsg("❌ Netzwerk-/Serverfehler oder Timeout.", "red");
    } finally {
      if (t) t.done();
      submitBtn && (submitBtn.disabled = false);
    }
  });
});

