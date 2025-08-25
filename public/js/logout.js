import { secureFetch } from "./utils/secureFetch.js";
import { withTimeout } from "./utils/withTimeout.js";
import { setButtonDisabled } from "./utils/ui.js";

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (btn.disabled) return;

    const originalText = btn.textContent;
    setButtonDisabled(btn, true, "Abmelden…");

    let t;
    try {
      t = withTimeout(8000);

      await secureFetch("/api/auth/logout", {
        method: "POST",
        signal: t.signal,
      });
    } catch (err) {
      console.error("❌ Logout-Fehler:", err);
      setButtonDisabled(btn, false);
      return;
    } finally {
      if (t) t.done();
      localStorage.clear();
      window.location.href = "/login.html";
    }
  });
});
