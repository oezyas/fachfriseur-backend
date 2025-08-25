import { setSanitizedHTML } from "./utils/renderUtils.js";

export function renderProductDetail(product, container) {
  if (!product || !container) return;

  const name = product.name || "Produkt";
  const desc = product.description || "";
  const priceNum = Number(product.price);
  const priceText = Number.isFinite(priceNum) ? `${priceNum.toFixed(2)} €` : "";
  const imgSrc = product.imageUrl
    ? `/uploads/${encodeURIComponent(product.imageUrl)}`
    : "/images/placeholder.png";

  container.innerHTML = "";

  const box = document.createElement("div");
  box.className = "product-detail-box";

  const img = document.createElement("img");
  img.src = imgSrc;
  img.alt = name;
  img.loading = "lazy";
  img.onerror = () => {
    img.onerror = null;
    img.src = "/images/placeholder.png";
  };

  const h1 = document.createElement("h1");
  h1.textContent = name;

  const p = document.createElement("p");
  if (typeof desc === "string" && desc.includes("<")) {
    setSanitizedHTML(p, desc);
  } else {
    p.textContent = desc;
  }

  const strong = document.createElement("strong");
  strong.textContent = priceText;

  box.append(img, h1, p, strong);
  container.appendChild(box);
}
