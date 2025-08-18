// public/js/admin-login-check.js
import { secureFetch } from "./utils/secureFetch.js";
import { withTimeout } from "./utils/withTimeout.js";

document.addEventListener("DOMContentLoaded", () => {
  const adminArea = document.getElementById("admin-area");
  const loginBox = document.getElementById("admin-login-box");
  const form = document.getElementById("admin-login-form");
  const msg = document.getElementById("login-message");
  const btn = form?.querySelector("button[type=submit]");

  const showLogin = () => {
    if (adminArea) adminArea.style.display = "none";
    if (loginBox) loginBox.style.display = "block";
  };

  const showAdmin = () => {
    if (loginBox) loginBox.style.display = "none";
    if (adminArea) adminArea.style.display = "block";
  };

  // --- Admin-Check beim Laden ---
  (async () => {
    let t;
    try {
      t = withTimeout(8000);
      const res = await secureFetch("/api/protected/admin-check", {
        signal: t.signal,
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.user?.role === "admin") return showAdmin();
      }
      showLogin();
    } catch (e) {
      console.error("❌ Fehler bei Admin-Check:", e);
      showLogin();
    } finally {
      if (t) t.done();
    }
  })();

  // --- Admin-Login-Formular ---
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = (document.getElementById("login-email")?.value || "").trim().toLowerCase();
      const password = document.getElementById("login-password")?.value || "";

      if (!email || !password) {
        if (msg) { msg.textContent = "E-Mail und Passwort erforderlich."; msg.style.color = "red"; }
        return;
      }

      let t;
      try {
        t = withTimeout(10000);
        if (btn) btn.disabled = true;
        if (msg) { msg.textContent = "Anmeldung läuft…"; msg.style.color = "inherit"; }

        const res = await secureFetch("/api/auth/login", {
          method: "POST",
          signal: t.signal,
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          showAdmin();
          if (msg) { msg.textContent = "✅ Erfolgreich angemeldet."; msg.style.color = "green"; }
          setTimeout(() => window.location.reload(), 300);
        } else {
          const errMsg =
            data?.errors?.[0]?.msg ||
            (res.status === 423 ? "Account vorübergehend gesperrt." :
             res.status === 401 ? "E-Mail/Passwort falsch." :
             "Anmeldung fehlgeschlagen.");
          if (msg) { msg.textContent = "❌ " + errMsg; msg.style.color = "red"; }
        }
      } catch (err) {
        console.error("❌ Admin-Login-Fehler:", err);
        if (msg) { msg.textContent = "❌ Netzwerk-/Serverfehler oder Timeout."; msg.style.color = "red"; }
      } finally {
        if (t) t.done();
        if (btn) btn.disabled = false;
      }
    });
  }
});
