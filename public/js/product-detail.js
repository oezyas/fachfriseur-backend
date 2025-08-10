// public/js/product-detail.js
import { renderProductDetail } from "./renderProductDetail.js";

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("product-detail");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  if (!slug) {
    container.innerHTML = "<p>❌ Kein Produkt angegeben.</p>";
    return;
  }

  const withTimeout = (ms = 10000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return { signal: ctrl.signal, done: () => clearTimeout(t) };
  };

  try {
    const t = withTimeout();
    const res = await fetch(`/api/produkte?slug=${encodeURIComponent(slug)}`, { signal: t.signal });
    t.done();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const payload = await res.json().catch(() => ({}));
    // Erlaube mehrere Antwortformen: [product] | {product} | {products:[...]} | product
    const product =
      (Array.isArray(payload) && payload[0]) ||
      payload.product ||
      (Array.isArray(payload.products) && payload.products[0]) ||
      (payload._id ? payload : null);

    if (!product) {
      container.innerHTML = "<p>❌ Produkt nicht gefunden.</p>";
      return;
    }

    // Render
    renderProductDetail(product, container);

    // SEO: Title + Description setzen (Description erzeugen, falls Tag fehlt)
    document.title = product.seoTitle || product.name || "Produkt";
    const descText = product.seoDescription || String(product.description || "").slice(0, 160);
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", descText);
  } catch (err) {
    console.error("❌ Fehler beim Laden:", err);
    container.innerHTML = "<p>❌ Fehler beim Laden des Produkts.</p>";
  }
});
