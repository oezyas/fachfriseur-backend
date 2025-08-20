let csrfTokenCache = null;

export function resetCsrfToken() {
  csrfTokenCache = null;
}

export async function secureFetch(url, options = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), options.timeout || 10000);

  try {
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

    if (res.status === 403) {
      resetCsrfToken();
    }

    return res;
  } finally {
    clearTimeout(t);
  }
}
