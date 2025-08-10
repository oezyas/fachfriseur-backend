// public/js/profile.js
document.addEventListener("DOMContentLoaded", () => {
  const profilDiv = document.getElementById("profilInfo");
  if (!profilDiv) return;

  const withTimeout = (ms = 8000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return { signal: ctrl.signal, done: () => clearTimeout(t) };
  };

  (async () => {
    const t = withTimeout();
    try {
      const res = await fetch("/api/protected", {
        method: "GET",
        credentials: "include",
        signal: t.signal,
      });
      if (!res.ok) throw new Error("Nicht autorisiert oder Serverfehler");
      const data = await res.json().catch(() => ({}));

      const user = data?.user;
      if (!user) throw new Error("Kein Benutzerobjekt");

      const email = user.email || "";
      const role = user.role || "user";
      const displayName = user.username || (email ? email.split("@")[0] : "User");

      // XSS-sicheres Rendering
      profilDiv.innerHTML = "";
      const p1 = document.createElement("p");
      const p2 = document.createElement("p");
      const p3 = document.createElement("p");
      p1.innerHTML = "<strong>Willkommen:</strong> ";
      p1.append(document.createTextNode(displayName));
      p2.innerHTML = "<strong>E-Mail:</strong> ";
      p2.append(document.createTextNode(email));
      p3.innerHTML = "<strong>Rolle:</strong> ";
      p3.append(document.createTextNode(role));
      profilDiv.append(p1, p2, p3);
    } catch (err) {
      console.error("Fehler beim Abrufen:", err);
      profilDiv.textContent = "Nicht eingeloggt oder Netzwerkfehler.";
    } finally {
      t.done();
    }
  })();
});
