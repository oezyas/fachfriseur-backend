// public/js/renderProductDetail.js
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

  const h1 = document.createElement("h1");
  h1.textContent = name;

  const p = document.createElement("p");
  p.textContent = desc;

  const strong = document.createElement("strong");
  strong.textContent = priceText;

  box.append(img, h1, p, strong);
  container.appendChild(box);
}
