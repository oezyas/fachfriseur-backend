// secureFetch.js
// Holt das CSRF-Token aus /api/csrf-token (JSON) und cached es.
// Schickt das Token bei jedem Request automatisch im Header "X-CSRF-Token" mit.
// Falls Session oder Token ungültig sind (403), wird der Cache geleert.

let csrfTokenCache = null;

export function resetCsrfToken() {
  csrfTokenCache = null;
}

export async function secureFetch(url, options = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), options.timeout || 10000);

  try {
    // CSRF-Token nur laden, wenn nicht im Cache
    if (!csrfTokenCache) {
      const tokenRes = await fetch("/api/csrf-token", { credentials: "include" });
      if (!tokenRes.ok) throw new Error("CSRF-Token konnte nicht geladen werden");
      const tokenData = await tokenRes.json();
      csrfTokenCache = tokenData.csrfToken;
    }

    const headers = {
      "X-CSRF-Token": csrfTokenCache,
      ...(options.headers || {})
    };

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
      signal: ctrl.signal
    });

    // Falls CSRF ungültig (z. B. Session abgelaufen) → Cache leeren
    if (res.status === 403) {
      resetCsrfToken();
      // 💡 Optional: hier könnte man direkt einen Retry mit neuem Token einbauen
    }

    return res;
  } finally {
    clearTimeout(t);
  }
}
