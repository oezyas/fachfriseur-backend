// public/js/password-reset.js
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  const resetRequestForm = document.getElementById("resetRequestForm");
  const resetConfirmForm = document.getElementById("resetConfirmForm");
  const messageEl = document.getElementById("message");
  const formTitle = document.getElementById("formTitle");

  const msg = (t, c="inherit") => { if (messageEl) { messageEl.textContent = t; messageEl.style.color = c; } };
  const withTimeout = (ms=10000) => { const c=new AbortController(); const t=setTimeout(()=>c.abort(),ms); return {signal:c.signal,done:()=>clearTimeout(t)} };

  if (token) {
    // Neues Passwort setzen
    resetConfirmForm?.style && (resetConfirmForm.style.display = "block");
    if (formTitle) formTitle.textContent = "Neues Passwort setzen";

    resetConfirmForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById("newPassword")?.value || "";
      if (!newPassword) return msg("❌ Bitte neues Passwort eingeben.", "red");

      // optional: clientseitige Kurzprüfung
      if (newPassword.length < 8) return msg("❌ Mind. 8 Zeichen.", "red");

      const t = withTimeout();
      try {
        const res = await fetch("/api/password-reset/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: t.signal,
          body: JSON.stringify({ token, newPassword }),
        });
        const result = await res.json().catch(() => ({}));
        if (res.ok) {
          msg("✅ Passwort wurde erfolgreich zurückgesetzt.", "green");
          resetConfirmForm.style.display = "none";
          setTimeout(() => (window.location.href = "login.html"), 1500);
        } else {
          msg(result?.errors?.[0]?.msg || "❌ Fehler beim Zurücksetzen.", "red");
        }
      } catch (err) {
        console.error(err);
        msg("❌ Serverfehler oder Timeout. Bitte später erneut versuchen.", "red");
      } finally { t.done(); }
    });
  } else {
    // Reset-E-Mail anfordern
    resetRequestForm?.style && (resetRequestForm.style.display = "block");
    if (formTitle) formTitle.textContent = "Passwort vergessen";

    resetRequestForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = (document.getElementById("email")?.value || "").trim().toLowerCase();
      if (!email || !email.includes("@")) return msg("❌ Bitte eine gültige E-Mail eingeben.", "red");

      msg("📧 Falls registriert, wurde eine E-Mail gesendet.");
      const t = withTimeout();
      try {
        await fetch("/api/password-reset/request", {          // << neu: /request
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: t.signal,
          body: JSON.stringify({ email }),
        });
        setTimeout(() => (window.location.href = "login.html"), 1500);
      } catch (err) {
        console.error(err);
        msg("❌ Netzwerkfehler oder Timeout. Bitte erneut versuchen.", "red");
      } finally { t.done(); }
    });
  }
});
