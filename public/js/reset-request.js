// public/js/reset-request.js
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

  const withTimeout = (ms = 10000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return { signal: ctrl.signal, done: () => clearTimeout(t) };
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = (emailEl?.value || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      show("❌ Bitte eine gültige E-Mail eingeben.", "red");
      return;
    }

    try {
      submitBtn && (submitBtn.disabled = true);
      show("Sende Anfrage…");

      const t = withTimeout();
      const res = await fetch("/api/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: t.signal,
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      t.done();

      if (res.ok) {
        // immer generische Antwort (keine Enumeration)
        show("📧 Falls registriert, wurde eine E-Mail gesendet.", "green");
        // optional: nach kurzer Pause zurück zum Login
        setTimeout(() => (window.location.href = "login.html"), 1500);
      } else {
        show(data?.errors?.[0]?.msg || "❌ Fehler bei der Anfrage.", "red");
      }
    } catch (err) {
      console.error(err);
      show("❌ Netzwerk-/Serverfehler oder Timeout.", "red");
    } finally {
      submitBtn && (submitBtn.disabled = false);
    }
  });
});
