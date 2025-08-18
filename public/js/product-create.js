// public/js/product-create.js
import { withTimeout } from "./utils/withTimeout.js";
import { secureFetch } from "./utils/secureFetch.js";   // ✅ CSRF-sicheres Fetch

document.addEventListener("DOMContentLoaded", () => {
  // Accordion-UI
  document.querySelectorAll(".accordion-header").forEach((btn) => {
    btn.addEventListener("click", () => {
      btn.classList.toggle("active");
      const content = btn.nextElementSibling;
      content.style.display = content.style.display === "block" ? "none" : "block";
    });
  });

  const form = document.getElementById("product-form");
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const slugParam = params.get("slug");
  let isEditMode = false;
  let productId = null;

  // Produktdaten per Slug laden (GET → kein CSRF nötig)
  async function loadBySlug(slug) {
    let t;
    try {
      t = withTimeout(12000);
      const res = await secureFetch(`/api/produkte?slug=${encodeURIComponent(slug)}`, {
        method: "GET",
        signal: t.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      const product = Array.isArray(result)
        ? result[0]
        : result?.product || result;
      return product && product._id ? product : null;
    } finally {
      if (t) t.done();
    }
  }


  // Falls Editieren → Felder füllen
  (async () => {
    if (!slugParam) return;
    try {
      const product = await loadBySlug(slugParam);
      if (!product) {
        alert("❌ Produktdaten ungültig oder nicht gefunden.");
        return;
      }

      isEditMode = true;
      productId = product._id;

      form.name.value = product.name || "";
      form.brand.value = product.brand || "";
      form.price.value = product.price ?? "";
      form.description.value = product.description || "";
      form.category.value = product.category || "";
      form.productLine.value = product.productLine || "";
      form.seoTitle.value = product.seoTitle || "";
      form.seoDescription.value = product.seoDescription || "";
      form.purchasePrice.value = product.purchasePrice ?? "";

      if (form.neu && form.neu.type === "checkbox") {
        form.neu.checked = Boolean(product.neu);
      } else if (form.neu) {
        form.neu.value = product.neu ? "true" : "";
      }
      form.status.value = product.status || "active";

      const imageInput = document.getElementById("image");
      if (imageInput) imageInput.required = false;

      document.getElementById("submit-btn").textContent = "Änderungen speichern";
    } catch (err) {
      console.error("Fehler beim Laden:", err);
      alert("❌ Fehler beim Laden der Produktdaten.");
    }
  })();

 
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);

    // Checkbox "neu" sauber setzen
    if (form.neu && form.neu.type === "checkbox") {
      formData.set("neu", form.neu.checked ? "true" : "false");
    }

    // Bild-Handling: im Edit-Mode optional
    const fileInput = document.getElementById("image");
    if (isEditMode && fileInput && !fileInput.files?.length) {
      formData.delete("imageUrl");
    }

    const url = isEditMode
      ? `/api/produkte/${encodeURIComponent(productId)}`
      : "/api/produkte";
    const method = isEditMode ? "PUT" : "POST";

    let t;
    try {
      t = withTimeout(12000);

      
      const response = await secureFetch(url, {
        method,
        body: formData,
        signal: t.signal,
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        alert(`✅ Produkt ${isEditMode ? "aktualisiert" : "gespeichert"}!`);
        if (!isEditMode) form.reset();
      } else {
        const msg =
          data?.message ||
          data?.errors?.[0]?.msg ||
          "Ein Fehler ist aufgetreten.";
        alert("❌ Fehler: " + msg);
      }
    } catch (err) {
      console.error("Fehler beim Senden:", err);
      alert("❌ Netzwerk- oder Serverfehler.");
    } finally {
      if (t) t.done();
    }
  });
});
