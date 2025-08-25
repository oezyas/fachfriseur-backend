import { secureFetch } from "./utils/secureFetch.js";

document.addEventListener("DOMContentLoaded", () => {
  const profilDiv = document.getElementById("profilInfo");
  if (!profilDiv) return;

  (async () => {
    try {
      const res = await secureFetch("/api/protected", {
        method: "GET",
      });

      if (!res.ok) throw new Error("Nicht autorisiert oder Serverfehler");
      const data = await res.json().catch(() => ({}));

      const user = data?.user;
      if (!user) throw new Error("Kein Benutzerobjekt");

      const email = user.email || "";
      const role = user.role || "user";
      const displayName = user.username || (email ? email.split("@")[0] : "User");

      profilDiv.innerHTML = "";

      const p1 = document.createElement("p");
      const strong1 = document.createElement("strong");
      strong1.textContent = "Willkommen:";
      p1.appendChild(strong1);
      p1.append(" ");
      p1.append(document.createTextNode(displayName));

      const p2 = document.createElement("p");
      const strong2 = document.createElement("strong");
      strong2.textContent = "E-Mail:";
      p2.appendChild(strong2);
      p2.append(" ");
      p2.append(document.createTextNode(email));

      const p3 = document.createElement("p");
      const strong3 = document.createElement("strong");
      strong3.textContent = "Rolle:";
      p3.appendChild(strong3);
      p3.append(" ");
      p3.append(document.createTextNode(role));

      profilDiv.append(p1, p2, p3);
    } catch (err) {
      console.error("Fehler beim Abrufen:", err);
      profilDiv.textContent = "Nicht eingeloggt oder Netzwerkfehler.";
    }
  })();
});
