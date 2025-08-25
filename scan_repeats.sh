#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="${1:-.}"
TS="$(date +"%Y%m%d_%H%M%S")"
OUT_TXT="${ROOT_DIR}/recurring_patterns_report_${TS}.txt"
OUT_JSON="${ROOT_DIR}/recurring_patterns_${TS}.json"

echo "Recurring patterns scan" > "$OUT_TXT"
echo "Project root: $(cd "$ROOT_DIR" && pwd)" >> "$OUT_TXT"
echo "Timestamp: $(date +"%Y-%m-%d %H:%M:%S %z")" >> "$OUT_TXT"
echo >> "$OUT_TXT"

JS_DIR="${ROOT_DIR}/public/js"
if [ ! -d "$JS_DIR" ]; then
  echo "Warnung: $JS_DIR nicht gefunden. Passe das Script-Argument an, z.B. ./scan_repeats_macos.sh /pfad/zum/repo" >> "$OUT_TXT"
fi

# Patterns to check (POSIX-style regexes)
PATTERNS=(
  "secureFetch"
  "withTimeout"
  "addEventListener\(.*submit"
  "getElementById\(.*message"
  "\.innerHTML"
  "\.textContent"
  "Content-Type.*application/json"
  "JSON\.stringify"
  "URLSearchParams"
  "location\.search"
  "new[[:space:]]+FormData"
  "AbortController"
  "signal[[:space:]]*:"
  "window\.location\.href"
)

echo "Scanning JS files for patterns..." >> "$OUT_TXT"
echo >> "$OUT_TXT"

# For each pattern get list of files that contain it (using grep -l)
echo "=== Wiederkehrende Patterns (nur >=2 Dateien) ===" >> "$OUT_TXT"
printf "%-40s %6s %s\n" "Pattern" "Files" "Files list" >> "$OUT_TXT"
for pat in "${PATTERNS[@]}"; do
  # grep -E returns exit 0 if found; -l prints filenames; redirect stderr to /dev/null
  files_found=$(grep -E -l -- "$pat" "$JS_DIR" -R 2>/dev/null || true)
  if [ -n "$files_found" ]; then
    # deduplicate & count
    uniq_files=$(printf "%s\n" "$files_found" | sort -u)
    cnt=$(printf "%s\n" "$uniq_files" | sed '/^$/d' | wc -l | tr -d ' ')
    if [ "$cnt" -ge 2 ]; then
      filelist=$(printf "%s," $(printf "%s\n" "$uniq_files" | tr '\n' ' ' ) | sed 's/,$//')
      printf "%-40s %6d %s\n" "$pat" "$cnt" "$filelist" >> "$OUT_TXT"
    fi
  fi
done

echo >> "$OUT_TXT"
echo "=== Pattern-Detail: Dateien pro Pattern (vollständige Liste) ===" >> "$OUT_TXT"
for pat in "${PATTERNS[@]}"; do
  files_found=$(grep -E -l -- "$pat" "$JS_DIR" -R 2>/dev/null || true)
  if [ -n "$files_found" ]; then
    printf -- "\n-- Pattern: %s --\n" "$pat" >> "$OUT_TXT"
    printf "%s\n" "$files_found" | sed 's|^|  - |' >> "$OUT_TXT"
  fi
done

echo >> "$OUT_TXT"
echo "Running deeper duplicate-block scan (sliding window = 6 lines)." >> "$OUT_TXT"
echo "This finds identical normalized 6-line snippets that appear in multiple files." >> "$OUT_TXT"
echo >> "$OUT_TXT"

# Use Python to find repeated N-line blocks across JS files (portable)
python3 - <<PY >> "$OUT_TXT"
import os, hashlib, json, sys
root = os.path.abspath("$ROOT_DIR")
js_root = os.path.join(root, "public", "js")
window = 6
blocks = {}
for dirpath, _, files in os.walk(js_root):
    for fn in files:
        if not fn.endswith(".js"):
            continue
        path = os.path.join(dirpath, fn)
        rel = os.path.relpath(path, root)
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                lines = [l.rstrip() for l in f]
        except Exception as e:
            continue
        norm_lines = [ln.strip() for ln in lines]
        for i in range(0, max(0, len(norm_lines)-window+1)):
            snippet = "\n".join(norm_lines[i:i+window])
            if len(snippet.strip()) == 0:
                continue
            h = hashlib.sha1(snippet.encode('utf-8')).hexdigest()
            blocks.setdefault(h, {"snippet": snippet, "occurrences": []})
            blocks[h]["occurrences"].append({"file": rel, "line": i+1})
multi = {h:b for h,b in blocks.items() if len({o['file'] for o in b['occurrences']})>=2}
if not multi:
    print("No repeated code blocks (window=%d) found across files." % window)
else:
    items = sorted(multi.items(), key=lambda kv: -len(kv[1]['occurrences']))[:30]
    for h,b in items:
        files = sorted({o['file'] for o in b['occurrences']})
        print("== Block hash: %s  (in %d files, %d total occurrences) ==" % (h, len(files), len(b['occurrences'])))
        print("Files: %s\n" % ", ".join(files))
        print("Snippet:\n-----\n%s\n-----\n" % b['snippet'])
PY

echo >> "$OUT_TXT"
echo "Report generated: $OUT_TXT" >> "$OUT_TXT"
echo "JSON (placeholder): $OUT_JSON" >> "$OUT_TXT"
echo "Done. Open $OUT_TXT to review recurring patterns and repeated code snippets."
