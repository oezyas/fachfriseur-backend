// public/js/logout.js
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;

  const withTimeout = (ms = 8000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return { signal: ctrl.signal, done: () => clearTimeout(t) };
  };

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (btn.disabled) return;
    btn.disabled = true;

    const t = withTimeout();
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        signal: t.signal,
      });
    } catch (err) {
      console.error("Logout-Fehler:", err);
    } finally {
      t.done();
      localStorage.clear();       // nur UI-Zustand – httpOnly-Cookie löscht der Server
      window.location.href = "/login.html";
    }
  });
});
