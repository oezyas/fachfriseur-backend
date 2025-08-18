import { withTimeout } from "./utils/withTimeout.js";
import { secureFetch } from "./utils/secureFetch.js";   // ✅ einheitlich nutzen

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("product-admin-list");
  const statusFilter = document.getElementById("statusFilter");
  const searchInput = document.getElementById("searchInput");
  const viewSelect = document.getElementById("viewSelect");

  if (!container) return;

  let allProducts = [];
  let currentView = viewSelect?.value || "list";

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));

  const fmtPrice = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? `${n.toFixed(2)} €` : "-";
  };

  async function loadProducts() {
    let t;
    try {
      container.innerHTML = "🔄 Lädt…";
      t = withTimeout(12000);

      const res = await secureFetch("/api/produkte", { signal: t.signal });  // ✅
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const payload = await res.json();
      allProducts = Array.isArray(payload) ? payload : payload.products || [];

      renderFilteredList();
    } catch (err) {
      console.error("❌ Fehler beim Laden:", err);
      container.innerHTML = "<p>❌ Fehler beim Laden der Produkte.</p>";
    } finally {
      if (t) t.done();
    }
  }

  function activateDeleteButtons() {
    container.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!id) return;
        if (!confirm("❗ Produkt wirklich löschen?")) return;

        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Lösche…";

        let t;
        try {
          t = withTimeout(10000);
          const res = await secureFetch(`/api/produkte/${encodeURIComponent(id)}`, {
            method: "DELETE",    // ✅ kein CSRF-Header mehr nötig
            signal: t.signal,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          allProducts = allProducts.filter((p) => String(p._id) !== String(id));
          renderFilteredList();
        } catch (err) {
          console.error("❌ Löschen fehlgeschlagen:", err);
          btn.disabled = false;
          btn.textContent = originalText;
          alert("❌ Produkt konnte nicht gelöscht werden.");
        } finally {
          if (t) t.done();
        }
      });
    });
  }

  statusFilter?.addEventListener("change", renderFilteredList);
  searchInput?.addEventListener("input", renderFilteredList);
  viewSelect?.addEventListener("change", () => {
    currentView = viewSelect.value;
    renderFilteredList();
  });

  (async () => {
    await loadProducts();  // ✅ fetchCsrfToken raus
  })();
});
