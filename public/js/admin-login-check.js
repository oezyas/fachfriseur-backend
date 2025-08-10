document.addEventListener("DOMContentLoaded", () => {
  const adminArea = document.getElementById("admin-area");
  const loginBox = document.getElementById("admin-login-box");
  const form = document.getElementById("admin-login-form");
  const msg = document.getElementById("login-message");
  const btn = form?.querySelector("button[type=submit]");

  const showLogin = () => { if (loginBox) loginBox.style.display = "block"; if (adminArea) adminArea.style.display = "none"; };
  const showAdmin = () => { if (loginBox) loginBox.style.display = "none"; if (adminArea) adminArea.style.display = "block"; };

  const withTimeout = (ms = 10000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return { signal: ctrl.signal, done: () => clearTimeout(t) };
  };

  // 1) Admin-Check
  (async () => {
    const t = withTimeout(8000);
    try {
      const res = await fetch("/api/protected/admin-check", { credentials: "include", signal: t.signal });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.user?.role === "admin") return showAdmin();
      }
      showLogin();
    } catch (e) {
      console.error("Fehler bei Admin-Check:", e);
      showLogin();
    } finally { t.done(); }
  })();

  // 2) Inline-Login
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = (document.getElementById("login-email")?.value || "").trim().toLowerCase();
      const password = document.getElementById("login-password")?.value || "";

      if (!email || !password) {
        if (msg) { msg.textContent = "E-Mail und Passwort erforderlich."; msg.style.color = "red"; }
        return;
      }

      const t = withTimeout(10000);
      try {
        if (btn) btn.disabled = true;
        if (msg) { msg.textContent = "Anmeldung läuft…"; msg.style.color = "inherit"; }

        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: t.signal,
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          showAdmin();
          if (msg) { msg.textContent = "Erfolgreich angemeldet."; msg.style.color = "green"; }
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
        console.error(err);
        if (msg) { msg.textContent = "❌ Netzwerk-/Serverfehler oder Timeout."; msg.style.color = "red"; }
      } finally {
        t.done();
        if (btn) btn.disabled = false;
      }
    });
  }
});
