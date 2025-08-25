export function showMessage(target, text, color = "inherit") {
  const el = typeof target === "string" ? document.getElementById(target) : target;
  if (!el) return false;
  el.textContent = text;
  el.style.color = color;
  return true;
}

export const showError = (target, text = "❌ Fehler") => showMessage(target, text, "red");
export const showSuccess = (target, text) => showMessage(target, text, "green");
export const showInfo = (target, text) => showMessage(target, text, "inherit");
export function setButtonDisabled(btn, disabled = true, loadingText = null) {
  if (!btn) return;
  btn.disabled = disabled;
  if (loadingText !== null) {
    if (disabled) {
      btn.dataset.oldText = btn.textContent;
      btn.textContent = loadingText;
    } else if (btn.dataset.oldText) {
      btn.textContent = btn.dataset.oldText;
      delete btn.dataset.oldText;
    }
  }
}