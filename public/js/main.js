// public/js/main.js
import { createFilterBlock } from "./filterBlock.js";
import "./index.js";     // Produktanzeige & Pagination
import "./auth-ui.js";   // Loginstatus & UI-Anpassung

async function init() {
  try {
    // Filterblock initialisieren (erstellt Selects + feuert filter-ready)
    await createFilterBlock();

    console.log("Main initialisiert ✅");
  } catch (err) {
    console.error("❌ Main-Init-Fehler:", err);
  }
}

init();
