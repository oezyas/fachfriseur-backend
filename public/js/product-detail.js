import { withTimeout } from "./utils/withTimeout.js";
import { secureFetch } from "./utils/secureFetch.js";
import { renderProductDetail } from "./renderProductDetail.js";
import { showError } from "./utils/ui.js";

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("product-detail");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  if (!slug) {
    showError(container, "❌ Kein Produkt angegeben.");
    return;
  }

  let t;
  try {
    t = withTimeout(12000);
    const res = await secureFetch(`/api/produkte?slug=${encodeURIComponent(slug)}`, {
      method: "GET",
      credentials: "include",
      signal: t.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const payload = await res.json().catch(() => ({}));
    const product =
      (Array.isArray(payload) && payload[0]) ||
      payload.product ||
      (Array.isArray(payload.products) && payload.products[0]) ||
      (payload._id ? payload : null);

    if (!product) {
      showError(container, "❌ Produkt nicht gefunden.");
      return;
    }

    renderProductDetail(product, container);

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
    const safeMsg = String(err?.message || "Fehler").slice(0, 200);
    showError(container, `❌ Fehler beim Laden des Produkts (${safeMsg}).`);
  } finally {
    if (t) t.done();
  }
});
