// public/js/product-create.js
document.addEventListener("DOMContentLoaded", () => {
  // Accordion
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

  const withTimeout = (ms = 12000) => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    return { signal: ctrl.signal, done: () => clearTimeout(t) };
  };

  async function loadBySlug(slug) {
    const t = withTimeout();
    try {
      const res = await fetch(`/api/produkte?slug=${encodeURIComponent(slug)}`, {
        credentials: "include",
        signal: t.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      // akzeptiere {product}, [product], oder product-Objekt
      const product = Array.isArray(result)
        ? result[0]
        : result?.product || result;
      return product && product._id ? product : null;
    } finally {
      withTimeout().done?.(); // fallback clear
      t.done();
    }
  }

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

      // Felder befüllen
      form.name.value = product.name || "";
      form.brand.value = product.brand || "";
      form.price.value = product.price ?? "";
      form.description.value = product.description || "";
      form.category.value = product.category || "";
      form.productLine.value = product.productLine || "";
      form.seoTitle.value = product.seoTitle || "";
      form.seoDescription.value = product.seoDescription || "";
      form.purchasePrice.value = product.purchasePrice ?? "";
      // Checkbox 'neu' (statt Text)
      if (form.neu && form.neu.type === "checkbox") {
        form.neu.checked = Boolean(product.neu);
      } else if (form.neu) {
        // Falls noch ein Textfeld existiert – kompatibel bleiben
        form.neu.value = product.neu ? "true" : "";
      }
      form.status.value = product.status || "active";

      // Bild im Edit-Modus nicht erzwingen
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

    // Checkbox 'neu': wenn nicht angehakt, Wert explizit auf "false" setzen
    if (form.neu && form.neu.type === "checkbox") {
      if (!form.neu.checked) formData.set("neu", "false");
      else formData.set("neu", "true");
    }

    // Im Edit-Modus: wenn kein neues Bild gewählt, Feld entfernen (Backend behält altes)
    const fileInput = document.getElementById("image");
    if (isEditMode && fileInput && !fileInput.files?.length) {
      formData.delete("imageUrl"); // Feldname wie in HTML
    }

    try {
      const url = isEditMode ? `/api/produkte/${encodeURIComponent(productId)}` : "/api/produkte";
      const method = isEditMode ? "PUT" : "POST";

      const t = withTimeout();
      const response = await fetch(url, {
        method,
        body: formData,
        credentials: "include",
        signal: t.signal,
      });
      const data = await response.json().catch(() => ({}));
      t.done();

      if (response.ok) {
        alert(`✅ Produkt ${isEditMode ? "aktualisiert" : "gespeichert"}!`);
        if (!isEditMode) form.reset();
        // Optional: zurück zur Übersicht
        // window.location.href = "/admin/produkte-verwalten.html";
      } else {
        const msg = data?.message || data?.errors?.[0]?.msg || "Ein Fehler ist aufgetreten.";
        alert("❌ Fehler: " + msg);
      }
    } catch (err) {
      console.error("Fehler beim Senden:", err);
      alert("❌ Netzwerk- oder Serverfehler.");
    }
  });
});
