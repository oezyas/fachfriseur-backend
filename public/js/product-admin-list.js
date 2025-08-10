// public/js/product-admin-list.js
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("product-admin-list");
  const statusFilter = document.getElementById("statusFilter");
  const searchInput = document.getElementById("searchInput");
  const viewSelect = document.getElementById("viewSelect");

  if (!container) return;

  let allProducts = [];
  let currentView = viewSelect?.value || "list"; // "list" | "grid"

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

  const fmtPrice = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? `${n.toFixed(2)} €` : "-";
  };

  const withTimeout = (ms = 10000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return { signal: ctrl.signal, done: () => clearTimeout(t) };
  };

  async function loadProducts() {
    const t = withTimeout(12000);
    try {
      container.innerHTML = "🔄 Lädt…";
      const res = await fetch("/api/produkte", { credentials: "include", signal: t.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      const products = Array.isArray(payload) ? payload : payload.products || [];
      allProducts = products;
      renderFilteredList();
    } catch (err) {
      console.error("Fehler beim Laden:", err);
      container.innerHTML = "<p>❌ Fehler beim Laden der Produkte.</p>";
    } finally {
      t.done();
    }
  }

  function renderFilteredList() {
    const status = statusFilter?.value || "active";
    const search = (searchInput?.value || "").trim().toLowerCase();

    const filtered = allProducts.filter((p) => {
      const matchesStatus = status === "all" || String(p.status) === status;
      const name = String(p.name || "").toLowerCase();
      const matchesSearch = !search || name.includes(search);
      return matchesStatus && matchesSearch;
    });

    if (!filtered.length) {
      container.innerHTML = "<p>❗ Keine passenden Produkte gefunden.</p>";
      return;
    }

    if (currentView === "grid") renderGridView(filtered);
    else renderListView(filtered);
  }

  function renderListView(products) {
    const table = document.createElement("table");
    table.className = "admin-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
          <th>Preis</th>
          <th>Kategorie</th>
          <th>Status</th>
          <th>Aktion</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");

    products.forEach((p) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><a href="/produkt.html?slug=${encodeURIComponent(p.slug || "")}" target="_blank">${esc(p.name || "—")}</a></td>
        <td>${fmtPrice(p.price)}</td>
        <td>${esc(p.category || "—")}</td>
        <td>${esc(p.status || "—")}</td>
        <td>
          <a href="/admin/produkt-erstellen.html?slug=${encodeURIComponent(p.slug || "")}">Bearbeiten</a> |
          <button data-id="${esc(p._id || "")}" class="delete-btn">Löschen</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    container.innerHTML = "";
    container.appendChild(table);
    activateDeleteButtons();
  }

  function renderGridView(products) {
    container.innerHTML = products
      .map((p) => {
        return `
        <div class="product-card">
          <h3><a href="/produkt.html?slug=${encodeURIComponent(p.slug || "")}" target="_blank">${esc(p.name || "—")}</a></h3>
          <p>Preis: ${fmtPrice(p.price)}</p>
          <p>Kategorie: ${esc(p.category || "—")}</p>
          <p>Status: ${esc(p.status || "—")}</p>
          <p>
            <a href="/admin/produkt-erstellen.html?slug=${encodeURIComponent(p.slug || "")}">Bearbeiten</a> |
            <button data-id="${esc(p._id || "")}" class="delete-btn">Löschen</button>
          </p>
        </div>
      `;
      })
      .join("");

    activateDeleteButtons();
  }

  function activateDeleteButtons() {
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!id) return;
        if (!confirm("❗ Produkt wirklich löschen?")) return;

        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Lösche…";

        const t = withTimeout(10000);
        try {
          const res = await fetch(`/api/produkte/${encodeURIComponent(id)}`, {
            method: "DELETE",
            credentials: "include",
            signal: t.signal,
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          // Optimistisch: aus localer Liste entfernen und neu rendern
          allProducts = allProducts.filter((p) => String(p._id) !== String(id));
          renderFilteredList();
        } catch (err) {
          alert("❌ Löschen fehlgeschlagen.");
          console.error(err);
          btn.disabled = false;
          btn.textContent = originalText;
        } finally {
          t.done();
        }
      });
    });
  }

  // Events
  statusFilter?.addEventListener("change", renderFilteredList);
  searchInput?.addEventListener("input", renderFilteredList);
  viewSelect?.addEventListener("change", () => {
    currentView = viewSelect.value;
    renderFilteredList();
  });

  // Initial
  loadProducts();
});
