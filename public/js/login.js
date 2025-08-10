// public/js/login.js
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

  const withTimeout = (ms = 10000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return { signal: ctrl.signal, done: () => clearTimeout(t) };
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = (emailEl?.value || "").trim().toLowerCase();
    const password = passwordEl?.value || "";

    if (!email || !password) {
      showMsg("Bitte E-Mail und Passwort eingeben.", "red");
      return;
    }

    try {
      submitBtn && (submitBtn.disabled = true);
      showMsg("Anmeldung läuft…");

      const t = withTimeout(10000);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // wichtig für httpOnly-Cookie
        signal: t.signal,
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      t.done();

      if (res.ok) {
        showMsg("Login erfolgreich! Weiterleitung…", "green");
        // Nichts Sensibles in localStorage speichern – wir verlassen uns auf das Cookie
        setTimeout(() => {
          window.location.href = data.redirectUrl || "/index.html";
        }, 800);
      } else if (res.status === 423) {
        showMsg(data?.errors?.[0]?.msg || "Account vorübergehend gesperrt.", "red");
      } else if (res.status === 401) {
        showMsg(data?.errors?.[0]?.msg || "E-Mail oder Passwort falsch.", "red");
      } else {
        showMsg(data?.errors?.[0]?.msg || "Login fehlgeschlagen.", "red");
      }
    } catch (err) {
      console.error("Login-Fehler:", err);
      showMsg("❌ Netzwerk-/Serverfehler oder Timeout.", "red");
    } finally {
      submitBtn && (submitBtn.disabled = false);
    }
  });
});
