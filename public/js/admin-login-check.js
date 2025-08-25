import { secureFetch } from "./utils/secureFetch.js";
import { withTimeout } from "./utils/withTimeout.js";
import { showMessage, showError, showSuccess, showInfo, setButtonDisabled } from "./utils/ui.js";

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

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = (document.getElementById("login-email")?.value || "").trim().toLowerCase();
      const password = document.getElementById("login-password")?.value || "";

      if (!email || !password) {
        showError(msg, "E-Mail und Passwort erforderlich.");
        return;
      }

      let t;
      try {
        t = withTimeout(10000);
        setButtonDisabled(btn, true);
        showInfo(msg, "Anmeldung läuft…");

        const res = await secureFetch("/api/auth/login", {
          method: "POST",
          signal: t.signal,
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          showAdmin();
          showSuccess(msg, "✅ Erfolgreich angemeldet.");
          setTimeout(() => window.location.reload(), 300);
        } else {
          const errMsg =
            data?.errors?.[0]?.msg ||
            (res.status === 423 ? "Account vorübergehend gesperrt." :
             res.status === 401 ? "E-Mail/Passwort falsch." :
             "Anmeldung fehlgeschlagen.");
          showError(msg, "❌ " + errMsg);
        }
      } catch (err) {
        console.error("❌ Admin-Login-Fehler:", err);
        showError(msg, "❌ Netzwerk-/Serverfehler oder Timeout.");
      } finally {
        if (t) t.done();
        setButtonDisabled(btn, false);
      }
    });
  }
});
