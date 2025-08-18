// public/js/utils/withTimeout.js
export function withTimeout(ms = 10000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return {
    signal: ctrl.signal,
    done: () => clearTimeout(t)
  };
}
