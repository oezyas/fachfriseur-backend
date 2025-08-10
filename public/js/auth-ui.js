// public/js/auth-ui.js
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
      profileMenu.innerHTML = `
        <p id="usernameDisplay">Nutzer</p>
        <button id="accountSettings" role="menuitem" type="button">Kontoeinstellungen</button>
        <button id="logoutBtn" role="menuitem" type="button">Abmelden</button>
      `;
      document.body.appendChild(profileMenu);
    }

    const usernameDisplay = document.getElementById("usernameDisplay");

    const withTimeout = (ms = 8000) => {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), ms);
      return { signal: ctrl.signal, done: () => clearTimeout(t) };
    };

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

    // Admin/Protected Check
    try {
      const t = withTimeout(8000);
      const res = await fetch("/api/protected", { credentials: "include", signal: t.signal });
      t.done();
      if (!res.ok) return showLoggedOutUI();

      const data = await res.json().catch(() => ({}));
      const email = data?.user?.email;
      showLoggedInUI(email);
    } catch {
      showLoggedOutUI();
    }

    // Menü toggeln (Click + Enter)
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

    // Kontoeinstellungen
    const accountSettingsLink = document.getElementById("accountSettings");
    accountSettingsLink?.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "/profile.html";
    });

    // Logout
    const logoutBtn = document.getElementById("logoutBtn");
    logoutBtn?.addEventListener("click", async () => {
      try {
        const t = withTimeout(8000);
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
          signal: t.signal,
        });
        t.done();
      } catch {}
      localStorage.clear();
      window.location.href = "/login.html";
    });
  });
})();
