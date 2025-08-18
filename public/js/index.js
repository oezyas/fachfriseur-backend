// public/js/index.js
import { secureFetch } from "./utils/secureFetch.js";
import { withTimeout } from "./utils/withTimeout.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Test erfolgreich");

  const categoryFilter = document.getElementById("categoryFilter");
  const productLineFilter = document.getElementById("productLineFilter");
  const brandFilter = document.getElementById("brandFilter");
  const sortBy = document.getElementById("sortBy");
  const container = document.getElementById("produkte-galerie");
  const paginationControls = document.getElementById("paginationControls");

  if (!container) return;

  let currentPage = 1;
  let totalPages = 1;
  const limit = 20;

  function getFilters() {
    return {
      category: categoryFilter?.value || "",
      productLine: productLineFilter?.value || "",
      brand: brandFilter?.value || "",
      sortBy: sortBy?.value || "",
    };
  }

  async function ladeProdukte(filters = getFilters()) {
    let t;
    try {
      t = withTimeout(12000);

      const params = new URLSearchParams({ limit, page: currentPage });
      if (filters.category) params.set("category", filters.category);
      if (filters.productLine) params.set("productLine", filters.productLine);
      if (filters.brand) params.set("brand", filters.brand);
      if (filters.sortBy) params.set("sortBy", filters.sortBy);

      const res = await secureFetch(`/api/produkte?${params.toString()}`, {
        method: "GET",
        signal: t.signal,
      });

      if (!res.ok) throw new Error("Fehler beim Laden der Produkte");

      const data = await res.json();
      const produkte = Array.isArray(data) ? data : data.products || [];
      const totalCount = data.totalCount ?? produkte.length;

      container.innerHTML = "";
      if (produkte.length === 0) {
        container.innerHTML = "<p>Keine Produkte gefunden.</p>";
        if (paginationControls) paginationControls.innerHTML = "";
        return;
      }

      produkte.forEach((p) => {
        const priceNum = Number(p.price);
        const priceTxt = Number.isFinite(priceNum) ? `${priceNum.toFixed(2)} €` : "";
        const img = p.imageUrl ? `/uploads/${encodeURIComponent(p.imageUrl)}` : "/images/placeholder.png";
        const name = p.name || "Produkt";

        const card = document.createElement("div");
        card.className = "produkt-karte";
        card.innerHTML = `
          <a href="/produkt.html?slug=${encodeURIComponent(p.slug || "")}">
            <img src="${img}" alt="${name}" />
            <h3>${name}</h3>
            <p>${priceTxt}</p>
          </a>
        `;
        container.appendChild(card);
      });

      totalPages = Math.ceil(totalCount / limit);
      renderPagination(currentPage, totalPages, filters);
    } catch (err) {
      console.error("❌", err);
      container.innerHTML = "<p>❌ Produkte konnten nicht geladen werden.</p>";
      if (paginationControls) paginationControls.innerHTML = "";
    } finally {
      if (t) t.done();
    }
  }

  function renderPagination(current, total, filters) {
    if (!paginationControls) return;
    paginationControls.innerHTML = "";
    if (total <= 1) return;

    const btn = (page, label = page, active = false) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.className = active ? "active" : "";
      b.disabled = active;
      b.addEventListener("click", () => {
        if (page !== currentPage) {
          currentPage = page;
          ladeProdukte(filters);
        }
      });
      return b;
    };

    const prev = document.createElement("button");
    prev.textContent = "‹";
    prev.disabled = current === 1;
    prev.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        ladeProdukte(filters);
      }
    });
    paginationControls.appendChild(prev);

    let start = Math.max(1, current - 1);
    let end = Math.min(total, current + 1);

    if (start > 2) {
      paginationControls.appendChild(btn(1));
      paginationControls.appendChild(document.createTextNode(" ... "));
    }
    for (let i = start; i <= end; i++) {
      paginationControls.appendChild(btn(i, i, i === current));
    }
    if (end < total - 1) {
      paginationControls.appendChild(document.createTextNode(" ... "));
      paginationControls.appendChild(btn(total));
    }

    const next = document.createElement("button");
    next.textContent = "›";
    next.disabled = current === total;
    next.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        ladeProdukte(filters);
      }
    });
    paginationControls.appendChild(next);
  }

  // Filter-Events
  document.addEventListener("filters:change", (e) => {
    currentPage = 1;
    ladeProdukte(e.detail || getFilters());
  });

  document.addEventListener("filter-ready", () => {
    currentPage = 1;
    ladeProdukte(getFilters());
  });

  // Initial
  ladeProdukte(getFilters());
});
