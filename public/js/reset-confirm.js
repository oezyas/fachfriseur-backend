// public/js/reset-confirm.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetConfirmForm");
  const messageDiv = document.getElementById("message");
  if (!form || !messageDiv) return;

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (!token) {
    messageDiv.textContent = "❌ Ungültiger oder fehlender Token.";
    messageDiv.style.color = "red";
    form.style.display = "none";
    return;
  }

  const newPwInput = document.getElementById("newPassword");
  const submitBtn = form.querySelector('button[type="submit"]');

  const withTimeout = (ms = 10000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return { signal: ctrl.signal, done: () => clearTimeout(t) };
  };

  const show = (txt, color = "inherit") => {
    messageDiv.textContent = txt;
    messageDiv.style.color = color;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPassword = newPwInput?.value || "";
    const minLen = Number(newPwInput?.getAttribute("minlength") || 8);

    if (newPassword.length < minLen) {
      show(`❌ Passwort zu kurz (mind. ${minLen} Zeichen).`, "red");
      return;
    }

    try {
      submitBtn && (submitBtn.disabled = true);
      show("Speichere neues Passwort…");

      const t = withTimeout(10000);
      const res = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: t.signal,
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      t.done();

      if (res.ok) {
        show("✅ Passwort wurde erfolgreich zurückgesetzt.", "green");
        form.reset();
        setTimeout(() => (window.location.href = "login.html"), 1200);
      } else {
        const msg = data?.errors?.[0]?.msg || "❌ Fehler beim Zurücksetzen.";
        show(msg, "red");
      }
    } catch (err) {
      console.error(err);
      show("❌ Netzwerk-/Serverfehler oder Timeout.", "red");
    } finally {
      submitBtn && (submitBtn.disabled = false);
    }
  });
});
