import { secureFetch } from "./utils/secureFetch.js";
import { withTimeout } from "./utils/withTimeout.js";
import { createProductCard, renderPagination } from "./utils/renderUtils.js";
import { showInfo, showError } from "./utils/ui.js";

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

      container.textContent = "";
      if (produkte.length === 0) {
        showInfo(container, "Keine Produkte gefunden.");
        if (paginationControls) paginationControls.textContent = "";
        return;
      }

      produkte.forEach((p) => {
        const card = createProductCard(p);
        container.appendChild(card);
      });

      totalPages = Math.ceil(totalCount / limit);
      if (paginationControls) {
        renderPagination(paginationControls, totalPages, currentPage, (page) => {
          currentPage = page;
          ladeProdukte(filters);
        });
      }
    } catch (err) {
      console.error("❌", err);
      showError(container, "❌ Produkte konnten nicht geladen werden.");
      if (paginationControls) paginationControls.textContent = "";
    } finally {
      if (t) t.done();
    }
  }

  document.addEventListener("filters:change", (e) => {
    currentPage = 1;
    ladeProdukte(e.detail || getFilters());
  });

  document.addEventListener("filter-ready", () => {
    currentPage = 1;
    ladeProdukte(getFilters());
  });

  ladeProdukte(getFilters());
});
