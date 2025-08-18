import { secureFetch } from "./utils/secureFetch.js";
import { withTimeout } from "./utils/withTimeout.js";

(() => {
  if (window.__authUiInitialized) return;
  window.__authUiInitialized = true;

  document.addEventListener("DOMContentLoaded", async () => {
    const loginLink = document.getElementById("loginLink");
    const registerLink = document.getElementById("registerLink");

    let avatarCircle = document.getElementById("avatarCircle");
    let profileMenu = document.getElementById("profileMenu");

    if (!avatarCircle) {
      avatarCircle = document.createElement("button");
      avatarCircle.id = "avatarCircle";
      avatarCircle.className = "profile-button";
      avatarCircle.textContent = "?";
      avatarCircle.type = "button";
      avatarCircle.setAttribute("aria-haspopup", "menu");
      avatarCircle.setAttribute("aria-expanded", "false");
      document.body.appendChild(avatarCircle);
    }

    if (!profileMenu) {
      profileMenu = document.createElement("div");
      profileMenu.id = "profileMenu";
      profileMenu.setAttribute("role", "menu");
      profileMenu.setAttribute("aria-hidden", "true");
      profileMenu.style.display = "none";

      const usernameDisplay = document.createElement("p");
      usernameDisplay.id = "usernameDisplay";
      usernameDisplay.textContent = "Nutzer";

      const accountSettings = document.createElement("button");
      accountSettings.id = "accountSettings";
      accountSettings.type = "button";
      accountSettings.setAttribute("role", "menuitem");
      accountSettings.textContent = "Kontoeinstellungen";

      const logoutBtn = document.createElement("button");
      logoutBtn.id = "logoutBtn";
      logoutBtn.type = "button";
      logoutBtn.setAttribute("role", "menuitem");
      logoutBtn.textContent = "Abmelden";

      profileMenu.append(usernameDisplay, accountSettings, logoutBtn);
      document.body.appendChild(profileMenu);
    }

    const usernameDisplay = document.getElementById("usernameDisplay");

    const showLoggedOutUI = () => {
      if (loginLink) loginLink.style.display = "inline";
      if (registerLink) registerLink.style.display = "inline";
      avatarCircle.style.display = "none";
      profileMenu.style.display = "none";
      avatarCircle.setAttribute("aria-expanded", "false");
      profileMenu.setAttribute("aria-hidden", "true");
    };

    const showLoggedInUI = (email) => {
      if (loginLink) loginLink.remove?.();
      if (registerLink) registerLink.remove?.();
      avatarCircle.style.display = "flex";
      if (usernameDisplay) usernameDisplay.textContent = email || "Benutzer";
      avatarCircle.textContent = (email?.charAt(0) || "?").toUpperCase();
    };

    let t;
    try {
      t = withTimeout(8000);
      const res = await secureFetch("/api/protected", { signal: t.signal });
      if (!res.ok) return showLoggedOutUI();

      const data = await res.json().catch(() => ({}));
      const email = data?.user?.email;
      showLoggedInUI(email);
    } catch (err) {
      console.error("Auth-Check-Fehler:", err);
      showLoggedOutUI();
    } finally {
      if (t) t.done();
    }

    const toggleMenu = () => {
      const open = profileMenu.style.display === "block";
      profileMenu.style.display = open ? "none" : "block";
      avatarCircle.setAttribute("aria-expanded", String(!open));
      profileMenu.setAttribute("aria-hidden", String(open));
    };

    avatarCircle.addEventListener("click", toggleMenu);
    avatarCircle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleMenu();
      }
    });

    document.addEventListener("click", (e) => {
      if (!avatarCircle.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.style.display = "none";
        avatarCircle.setAttribute("aria-expanded", "false");
        profileMenu.setAttribute("aria-hidden", "true");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        profileMenu.style.display = "none";
        avatarCircle.setAttribute("aria-expanded", "false");
        profileMenu.setAttribute("aria-hidden", "true");
        avatarCircle.focus();
      }
    });

    const accountSettingsLink = document.getElementById("accountSettings");
    accountSettingsLink?.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "/profile.html";
    });

    const logoutBtn = document.getElementById("logoutBtn");
    logoutBtn?.addEventListener("click", async () => {
      let t;
      try {
        t = withTimeout(8000);
        await secureFetch("/api/auth/logout", {
          method: "POST",
          signal: t.signal,
        });
      } catch (err) {
        console.error("Logout-Fehler:", err);
      } finally {
        if (t) t.done();
        localStorage.clear();
        window.location.href = "/login.html";
      }
    });
  });
})();
