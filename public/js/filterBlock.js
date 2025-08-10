// public/js/filterBlock.js

const LS_KEY = "productFilters.v1";

const DEFAULTS = {
  metadataUrl: "/api/produkte/filters", // optionaler Endpoint: { brands:[], categories:[], productLines:[] }
  brands: [""],          // Fallbacks, falls es keinen Endpoint gibt
  categories: [""],
  productLines: ["", "Coloration", "feines Haar"],
  sortOptions: [
    ["", "Sortieren"],
    ["name", "Name A–Z"],
    ["priceAsc", "Preis aufsteigend"],
    ["priceDesc", "Preis absteigend"],
    ["newest", "Neueste"],
  ],
};

/** Utility: debounce */
const debounce = (fn, ms = 150) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

/** Utility: Dropdown + Label */
function createLabeledSelect({ id, label, options = [] }) {
  const wrap = document.createElement("div");
  wrap.className = "filter-field";

  const lab = document.createElement("label");
  lab.setAttribute("for", id);
  lab.textContent = label;

  const sel = document.createElement("select");
  sel.id = id;
  sel.name = id;
  sel.setAttribute("aria-label", label);

  options.forEach((opt) => {
    const [value, text] = Array.isArray(opt) ? opt : [opt, opt || "—"];
    const o = document.createElement("option");
    o.value = value;
    o.textContent = text;
    sel.appendChild(o);
  });

  wrap.appendChild(lab);
  wrap.appendChild(sel);
  return { wrap, select: sel };
}

/** State helpers */
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch {
    return {};
  }
}
function saveState(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {}
}

/** Apply state to selects */
function applyState({ selects, state }) {
  Object.entries(selects).forEach(([key, el]) => {
    if (!el) return;
    if (state[key] != null) {
      el.value = String(state[key]);
    }
  });
}

/** Push to URL (no reload) */
function setQueryParam(key, val) {
  const url = new URL(window.location.href);
  if (val === "" || val == null) url.searchParams.delete(key);
  else url.searchParams.set(key, val);
  history.replaceState({}, "", url);
}

/** Public: aktuelle Filter lesen */
export function getCurrentFilters() {
  const brand = document.getElementById("brandFilter")?.value || "";
  const category = document.getElementById("categoryFilter")?.value || "";
  const productLine = document.getElementById("productLineFilter")?.value || "";
  const sortBy = document.getElementById("sortBy")?.value || "";
  return { brand, category, productLine, sortBy };
}

/** Public: Listener bequem registrieren */
export function onFiltersChange(cb) {
  document.addEventListener("filters:change", (e) => cb(e.detail));
}

/** Hauptfunktion */
export async function createFilterBlock(opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };
  const container = document.getElementById("filterPlaceholder");
  if (!container || container.__filterBlockInit) return;
  container.__filterBlockInit = true;

  // Wrapper
  const wrapper = document.createElement("div");
  wrapper.className = "filter-bar";
  wrapper.setAttribute("role", "region");
  wrapper.setAttribute("aria-label", "Produktfilter");

  // Datenquelle vorbereiten
  let brands = cfg.brands;
  let categories = cfg.categories;
  let productLines = cfg.productLines;

  // optional: Metadaten vom Server holen
  try {
    const res = await fetch(cfg.metadataUrl, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.brands)) brands = ["", ...data.brands];
      if (Array.isArray(data?.categories)) categories = ["", ...data.categories];
      if (Array.isArray(data?.productLines)) productLines = ["", ...data.productLines];
    }
  } catch {
    // still okay: wir bleiben bei Defaults
  }

  // Selects erzeugen
  const brand = createLabeledSelect({
    id: "brandFilter",
    label: "Marke",
    options: brands.map((b) => [b, b || "Alle Marken"]),
  });
  const category = createLabeledSelect({
    id: "categoryFilter",
    label: "Kategorie",
    options: categories.map((c) => [c, c || "Alle Kategorien"]),
  });
  const line = createLabeledSelect({
    id: "productLineFilter",
    label: "Produktlinie",
    options: productLines.map((p) => [p, p || "Alle Produktlinien"]),
  });
  const sort = createLabeledSelect({
    id: "sortBy",
    label: "Sortierung",
    options: cfg.sortOptions,
  });

  // Reset-Button
  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.className = "filter-reset";
  resetBtn.textContent = "Zurücksetzen";
  resetBtn.setAttribute("aria-label", "Filter zurücksetzen");

  // In UI einsetzen
  [brand, category, line, sort].forEach((x) => wrapper.appendChild(x.wrap));
  wrapper.appendChild(resetBtn);
  container.appendChild(wrapper);

  // State anwenden (localStorage + URL)
  const state = loadState();
  // URL hat Vorrang, falls vorhanden
  const url = new URL(window.location.href);
  const overrides = {
    brandFilter: url.searchParams.get("brand") ?? undefined,
    categoryFilter: url.searchParams.get("category") ?? undefined,
    productLineFilter: url.searchParams.get("productLine") ?? undefined,
    sortBy: url.searchParams.get("sortBy") ?? undefined,
  };
  const mergedState = { ...state, ...overrides };
  applyState({
    selects: {
      brandFilter: brand.select,
      categoryFilter: category.select,
      productLineFilter: line.select,
      sortBy: sort.select,
    },
    state: mergedState,
  });

  // Change-Handler (debounced): speichert, setzt URL, feuert Event
  const fire = debounce(() => {
    const filters = getCurrentFilters();

    saveState({
      brandFilter: filters.brand,
      categoryFilter: filters.category,
      productLineFilter: filters.productLine,
      sortBy: filters.sortBy,
    });

    setQueryParam("brand", filters.brand);
    setQueryParam("category", filters.category);
    setQueryParam("productLine", filters.productLine);
    setQueryParam("sortBy", filters.sortBy);

    document.dispatchEvent(new CustomEvent("filters:change", { detail: filters }));
  });

  [brand.select, category.select, line.select, sort.select].forEach((el) =>
    el.addEventListener("change", fire)
  );

  // Reset
  resetBtn.addEventListener("click", () => {
    brand.select.value = "";
    category.select.value = "";
    line.select.value = "";
    sort.select.value = "";
    fire();
  });

  // Beim Initialisieren einmal Event feuern, damit Listen sich laden
  fire();
}
