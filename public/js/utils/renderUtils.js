export function renderMessages(target, messages = [], type = "info") {
  const el = typeof target === "string" ? document.getElementById(target) : target;
  if (!el) return;
  while (el.firstChild) el.removeChild(el.firstChild);
  for (const m of messages) {
    const p = document.createElement("p");
    p.textContent = m;
    el.appendChild(p);
  }
  if (type === "error") el.style.color = "red";
  else if (type === "success") el.style.color = "green";
  else el.style.color = "inherit";
}

export function setSanitizedHTML(target, html) {
  const el = typeof target === "string" ? document.getElementById(target) : target;
  if (!el) return;
  try {
    if (window.DOMPurify && typeof DOMPurify.sanitize === "function") {
      el.innerHTML = DOMPurify.sanitize(html);
    } else {
      el.textContent = html;
    }
  } catch (e) {
    el.textContent = html;
  }
}

export function clearAndAppend(container, nodes) {
  const el = typeof container === "string" ? document.getElementById(container) : container;
  if (!el) return;
  while (el.firstChild) el.removeChild(el.firstChild);
  if (!nodes) return;
  if (Array.isArray(nodes)) {
    for (const n of nodes) el.appendChild(n);
  } else {
    el.appendChild(nodes);
  }
}

export function renderSelectOptions(selectEl, items = [], placeholder = "") {
  const el = typeof selectEl === "string" ? document.getElementById(selectEl) : selectEl;
  if (!el || el.tagName !== "SELECT") return;
  while (el.firstChild) el.removeChild(el.firstChild);
  if (placeholder) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = placeholder;
    el.appendChild(opt);
  }
  for (const it of items) {
    const o = document.createElement("option");
    o.value = it.value ?? it.id ?? String(it);
    o.textContent = it.label ?? it.name ?? String(it);
    el.appendChild(o);
  }
}

export function createProductCard(product = {}, opts = {}) {
  const card = document.createElement("div");
  card.className = opts.cardClass || "produkt-karte";

  const slug = product.slug || "";
  const name = product.name || "Produkt";
  const imgSrc = product.imageUrl ? `/uploads/${encodeURIComponent(product.imageUrl)}` : "/images/placeholder.png";
  const priceNum = Number(product.price);
  const priceText = Number.isFinite(priceNum) ? `${priceNum.toFixed(2)} €` : "";

  const link = document.createElement("a");
  link.className = "product-link";
  link.href = "/produkt.html?slug=" + encodeURIComponent(slug);

  const img = document.createElement("img");
  img.src = imgSrc;
  img.alt = name;
  img.loading = "lazy";
  img.addEventListener("error", () => {
    img.removeEventListener("error", () => {});
    img.src = "/images/placeholder.png";
  });

  const h3 = document.createElement("h3");
  h3.textContent = name;

  link.appendChild(img);
  link.appendChild(h3);

  card.appendChild(link);

  if (priceText) {
    const p = document.createElement("p");
    p.className = "product-price";
    p.textContent = priceText;
    card.appendChild(p);
  }

  return card;
}

export function renderPagination(container, totalPages, current = 1, onClick = null) {
  const el = typeof container === "string" ? document.getElementById(container) : container;
  if (!el) return;
  while (el.firstChild) el.removeChild(el.firstChild);
  if (totalPages <= 1) return;
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = String(i);
    if (i === current) btn.disabled = true;
    btn.addEventListener("click", (e) => {
      if (typeof onClick === "function") onClick(i, e);
    });
    el.appendChild(btn);
  }
}
