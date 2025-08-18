// public/js/product-gallery.js
import { secureFetch } from "./utils/secureFetch.js";
import { withTimeout } from "./utils/withTimeout.js";

document.addEventListener("DOMContentLoaded", async () => {
  const gallery = document.getElementById("produkte-galerie");
  const categoryFilter = document.getElementById("categoryFilter");
  const productLineFilter = document.getElementById("productLineFilter");
  const brandFilter = document.getElementById("brandFilter");
  const sortBy = document.getElementById("sortBy");

  if (!gallery) return;

  let allProducts = [];

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => (
      { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]
    ));

  const fmtPrice = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? `${n.toFixed(2)} €` : "";
  };

  function renderGallery(products) {
    gallery.innerHTML = "";
    if (!products.length) {
      gallery.innerHTML = "<p>Keine Produkte gefunden.</p>";
      return;
    }

    const frag = document.createDocumentFragment();
    products.forEach((p) => {
      if (p.status !== "active") return; 

      const card = document.createElement("div");
      card.className = "produkt-karte";

      const imgSrc = p.imageUrl ? `/uploads/${encodeURIComponent(p.imageUrl)}` : "/images/placeholder.png";
      const slug = esc(p.slug || "");
      const name = esc(p.name || "Produkt");

      card.innerHTML = `
        <a href="/produkt.html?slug=${slug}" class="product-link">
          <img src="${imgSrc}" alt="${name}" />
          <h3>${name}</h3>
          <p>${fmtPrice(p.price)}</p>
        </a>
      `;
      frag.appendChild(card);
    });

    gallery.appendChild(frag);
  }

  function applyFiltersAndSort() {
    const selectedCategory = categoryFilter?.value || "";
    const selectedProductLine = productLineFilter?.value || "";
    const selectedBrand = brandFilter?.value || "";
    const sortOption = sortBy?.value || "";

    let filtered = allProducts.filter((p) =>
      (!selectedCategory || p.category === selectedCategory) &&
      (!selectedProductLine || p.productLine === selectedProductLine) &&
      (!selectedBrand || p.brand === selectedBrand)
    );

    switch (sortOption) {
      case "name":
        filtered.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        break;
      case "priceAsc":
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "priceDesc":
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }

    renderGallery(filtered);
  }

  function fillSelect(selectEl, items, placeholderText) {
    if (!selectEl) return;
    selectEl.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = placeholderText;
    selectEl.appendChild(opt);
    [...new Set(items.filter(Boolean))].sort().forEach((val) => {
      const o = document.createElement("option");
      o.value = val;
      o.textContent = val;
      selectEl.appendChild(o);
    });
  }

  // --- Produkte laden ---
  let t;
  try {
    gallery.innerHTML = "🔄 Produkte werden geladen…";
    t = withTimeout(12000);

    const res = await secureFetch("/api/produkte", { signal: t.signal });
    const payload = await res.json().catch(() => ({}));

    allProducts = Array.isArray(payload) ? payload : (payload.products || []);
    if (!Array.isArray(allProducts)) allProducts = [];

    fillSelect(categoryFilter, allProducts.map((p) => p.category), "Alle Kategorien");
    fillSelect(productLineFilter, allProducts.map((p) => p.productLine), "Alle Produktlinien");
    fillSelect(brandFilter, allProducts.map((p) => p.brand), "Alle Marken");

    applyFiltersAndSort();
  } catch (err) {
    console.error("❌ Fehler beim Laden der Produkte:", err);
    gallery.innerHTML = "<p>❌ Produkte konnten nicht geladen werden.</p>";
  } finally {
    if (t) t.done();
  }

  // --- Filter Events ---
  categoryFilter?.addEventListener("change", applyFiltersAndSort);
  productLineFilter?.addEventListener("change", applyFiltersAndSort);
  brandFilter?.addEventListener("change", applyFiltersAndSort);
  sortBy?.addEventListener("change", applyFiltersAndSort);

  document.addEventListener("filters:change", (e) => {
    const f = e.detail || {};
    if (categoryFilter) categoryFilter.value = f.category || "";
    if (productLineFilter) productLineFilter.value = f.productLine || "";
    if (brandFilter) brandFilter.value = f.brand || "";
    if (sortBy) sortBy.value = f.sortBy || "";
    applyFiltersAndSort();
  });
});
