#!/usr/bin/env bash
set -euo pipefail

# Usage: ./collect_info.sh [ROOT_DIR] [--diff BASE_REF TARGET_REF]
MODE="full"
BASE_REF=""
TARGET_REF=""
ROOT_DIR="."

while [[ $# -gt 0 ]]; do
  case "$1" in
    --diff)
      MODE="diff"
      BASE_REF="${2:-}"
      TARGET_REF="${3:-}"
      shift 3
      ;;
    *)
      ROOT_DIR="$1"
      shift
      ;;
  esac
done

TS="$(date +"%Y%m%d_%H%M%S")"
OUTDIR="${ROOT_DIR}/audit_report_${MODE}_${TS}"
mkdir -p "$OUTDIR"

echo "Audit Report ($MODE) – $(date)" > "$OUTDIR/README.txt"

if git -C "$ROOT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  VCS=true
else
  VCS=false
fi

if [[ "$MODE" == "diff" ]]; then
  git -C "$ROOT_DIR" diff --name-only "$BASE_REF" "$TARGET_REF" | tee "$OUTDIR/changed_files.txt"
  CHANGED_FILES="$(cat "$OUTDIR/changed_files.txt")"
else
  CHANGED_FILES=""
fi

run_if_changed () {
  local path="$1"; shift
  if [[ "$MODE" == "full" ]] || grep -qxE "(^|.*/)$path$" <<< "$CHANGED_FILES"; then
    "$@"
  fi
}

# 1) Projektstruktur
{
  echo "1) Projektstruktur"
  echo "=================="
  echo
} >> "$OUTDIR/README.txt"
if [[ "$MODE" == "full" ]]; then
  if command -v tree >/dev/null 2>&1; then
    tree -I 'node_modules|.git|logs|__pycache__' -L 2 "$ROOT_DIR" > "$OUTDIR/struktur.txt" 2>/dev/null || find "$ROOT_DIR" -maxdepth 2 -print > "$OUTDIR/struktur.txt"
  else
    find "$ROOT_DIR" -maxdepth 2 -print > "$OUTDIR/struktur.txt"
  fi
else
  printf "%s\n" "$CHANGED_FILES" | sed 's|/.*||' | sort -u > "$OUTDIR/struktur_diff.txt"
fi

# 2) Abhängigkeiten
{
  echo "2) Abhängigkeiten"
  echo "------------------"
} >> "$OUTDIR/README.txt"

if [[ -f "$ROOT_DIR/package.json" ]]; then
  (cd "$ROOT_DIR" && npm ls --depth=0 > "$OUTDIR/npm_dependencies.txt" 2>&1 || true)
  echo "- Node.js (npm) → npm_dependencies.txt" >> "$OUTDIR/README.txt"
fi
if [[ -f "$ROOT_DIR/requirements.txt" ]]; then
  (cd "$ROOT_DIR" && pip freeze > "$OUTDIR/pip_dependencies.txt" 2>&1 || true)
  echo "- Python (pip) → pip_dependencies.txt" >> "$OUTDIR/README.txt"
fi
if [[ -f "$ROOT_DIR/composer.json" ]]; then
  (cd "$ROOT_DIR" && composer show --no-ansi > "$OUTDIR/composer_dependencies.txt" 2>&1 || true)
  echo "- PHP (Composer) → composer_dependencies.txt" >> "$OUTDIR/README.txt"
fi

# 3) Konfigurationsdateien & Umgebungsvariablen
{
  echo
  echo "3) Konfigurationsdateien & Umgebungsvariablen"
  echo "---------------------------------------------"
} >> "$OUTDIR/README.txt"
grep -R "DATABASE_" -n "$ROOT_DIR" > "$OUTDIR/database_config_references.txt" || true
if [[ -f "$ROOT_DIR/.env" ]]; then
  sed -e 's/=.*/=****/g' "$ROOT_DIR/.env" > "$OUTDIR/env_variables.txt"
  echo "- .env maskiert → env_variables.txt" >> "$OUTDIR/README.txt"
fi

# 4) Logik-Punkte (Endpoints, Routen, Tasks)
{
  echo
  echo "4) Logik-Punkte (Endpoints, Routen, Tasks)"
  echo "-------------------------------------------"
} >> "$OUTDIR/README.txt"
grep -R "app\.get" -n "$ROOT_DIR" > "$OUTDIR/node_routes.txt" 2>/dev/null || true
grep -R "@Route" -n "$ROOT_DIR" > "$OUTDIR/php_routes.txt" 2>/dev/null || true
grep -R "urlpatterns" -n "$ROOT_DIR" > "$OUTDIR/django_urls.txt" 2>/dev/null || true

# 5) Sicherheits-Checks
{
  echo
  echo "5) Sicherheits-Checks"
  echo "----------------------"
} >> "$OUTDIR/README.txt"
if command -v npm >/dev/null 2>&1 && [[ -f "$ROOT_DIR/package.json" ]]; then
  (cd "$ROOT_DIR" && npm audit --json > "$OUTDIR/npm_audit.json" || true)
  echo "- npm audit → npm_audit.json" >> "$OUTDIR/README.txt"
fi
if command -v bandit >/dev/null 2>&1 && [[ -f "$ROOT_DIR/requirements.txt" ]]; then
  bandit -r "$ROOT_DIR" -f json -o "$OUTDIR/bandit_report.json" || true
  echo "- bandit (Python) → bandit_report.json" >> "$OUTDIR/README.txt"
fi
if command -v trufflehog >/dev/null 2>&1; then
  trufflehog filesystem "$ROOT_DIR" --json > "$OUTDIR/secret_scan.json" || true
  echo "- trufflehog → secret_scan.json" >> "$OUTDIR/README.txt"
fi

# 6) Webserver- & SSL-Einstellungen
{
  echo
  echo "6) Webserver- & SSL-Einstellungen"
  echo "--------------------------------"
} >> "$OUTDIR/README.txt"
[[ -f "$ROOT_DIR/nginx.conf" ]] && grep -E "ssl_certificate|listen" "$ROOT_DIR/nginx.conf" > "$OUTDIR/nginx_ssl_settings.txt" || true
if [[ -f "$ROOT_DIR/apache2.conf" ]] || [[ -f "$ROOT_DIR/httpd.conf" ]]; then
  grep -E "SSLEngine|DocumentRoot" "$ROOT_DIR"/*.conf > "$OUTDIR/apache_ssl_settings.txt" || true
fi

# 7) Frontend-Utils Adoption
{
  echo
  echo "7) Frontend Utils Adoption"
  echo "=========================="
} >> "$OUTDIR/README.txt"

JS_DIR="${ROOT_DIR}/public/js"
CSV_OUT="${OUTDIR}/frontend-utils-adoption_${TS}.csv"
echo "file,lines,uses_secureFetch,uses_fetch,uses_withTimeout,submit_handlers,has_message_el,defines_innerHTML_or_textContent,json_headers,json_stringify,uses_URLSearchParams,uses_FormData,uses_AbortController,passes_signal,recommended_utils" > "$CSV_OUT"

if [[ -d "$JS_DIR" ]]; then
  find "$JS_DIR" -type f -name '*.js' | sort | while IFS= read -r file; do
    rel="${file#${ROOT_DIR}/}"
    LINES=$(wc -l < "$file" 2>/dev/null || echo 0)
    grep -Eq "secureFetch" "$file" && uses_secureFetch=1 || uses_secureFetch=0
    grep -Eq "\bfetch\s*\(" "$file" && uses_fetch=1 || uses_fetch=0
    grep -Eq "withTimeout" "$file" && uses_withTimeout=1 || uses_withTimeout=0
    submit_handlers=$(grep -En "addEventListener\([[:space:]]*['\"]submit['\"]" "$file" | wc -l | tr -d ' ')
    grep -Eq "getElementById\(['\"]message['\"]\)|querySelector\([^\)]*#message" "$file" && has_message_el=1 || has_message_el=0
    grep -Eq "\.innerHTML|\.textContent" "$file" && defines_innerHTML_or_textContent=1 || defines_innerHTML_or_textContent=0
    grep -Eq "Content-Type.*application/json" "$file" && json_headers=1 || json_headers=0
    grep -Eq "JSON\.stringify" "$file" && json_stringify=1 || json_stringify=0
    grep -Eq "URLSearchParams|location\.search" "$file" && uses_URLSearchParams=1 || uses_URLSearchParams=0
    grep -Eq "new[[:space:]]+FormData" "$file" && uses_FormData=1 || uses_FormData=0
    grep -Eq "AbortController" "$file" && uses_AbortController=1 || uses_AbortController=0
    grep -Eq "signal[[:space:]]*:" "$file" && passes_signal=1 || passes_signal=0

    RECS=""
    if [[ $uses_secureFetch -eq 1 || $json_headers -eq 1 || $json_stringify -eq 1 || $uses_fetch -eq 1 ]]; then RECS="${RECS}apiClient,"; fi
    if [[ $submit_handlers -gt 0 ]]; then RECS="${RECS}forms,"; fi
    if [[ $has_message_el -eq 1 ]] || grep -Eq "const[[:space:]]+(show|showMsg|showMessage)[[:space:]]*=" "$file"; then RECS="${RECS}notify,"; fi
    if [[ $uses_URLSearchParams -eq 1 ]]; then RECS="${RECS}urlState,"; fi
    if [[ $uses_FormData -eq 1 ]]; then RECS="${RECS}uploadClient,"; fi
    RECS="${RECS%,}"

    echo "\"$rel\",$LINES,$uses_secureFetch,$uses_fetch,$uses_withTimeout,$submit_handlers,$has_message_el,$defines_innerHTML_or_textContent,$json_headers,$json_stringify,$uses_URLSearchParams,$uses_FormData,$uses_AbortController,$passes_signal,\"$RECS\"" >> "$CSV_OUT"
  done
  echo "Frontend utils adoption CSV: $(basename "$CSV_OUT")" >> "$OUTDIR/README.txt"
else
  echo "Kein public/js Verzeichnis gefunden, überspringe Frontend-Analyse." >> "$OUTDIR/README.txt"
fi

# 8) Recurring patterns / duplicate block scan
RP_OUT="${OUTDIR}/recurring_patterns_report_${TS}.txt"
{
  echo "Recurring patterns scan"
  echo "Project root: $(cd "$ROOT_DIR" && pwd)"
  echo "Timestamp: $(date +"%Y-%m-%d %H:%M:%S %z")"
  echo
} > "$RP_OUT"

if [[ -d "$JS_DIR" ]]; then
  PATTERNS=(
    "secureFetch"
    "withTimeout"
    "addEventListener\\(.*submit"
    "getElementById\\(.*message"
    "\\.innerHTML"
    "\\.textContent"
    "Content-Type.*application/json"
    "JSON\\.stringify"
    "URLSearchParams"
    "location\\.search"
    "new[[:space:]]+FormData"
    "AbortController"
    "signal[[:space:]]*:"
    "window\\.location\\.href"
  )

  {
    echo "=== Wiederkehrende Patterns (nur >=2 Dateien) ==="
    printf "%-40s %6s %s\n" "Pattern" "Files" "Files list"
  } >> "$RP_OUT"

  for pat in "${PATTERNS[@]}"; do
    files_found=$(grep -E -l -- "$pat" "$JS_DIR" -R 2>/dev/null || true)
    if [[ -n "${files_found:-}" ]]; then
      uniq_files=$(printf "%s\n" "$files_found" | sort -u)
      cnt=$(printf "%s\n" "$uniq_files" | sed '/^$/d' | wc -l | tr -d ' ')
      if [[ "$cnt" -ge 2 ]]; then
        filelist=$(printf "%s," $(printf "%s\n" "$uniq_files" | tr '\n' ' ') | sed 's/,$//')
        printf "%-40s %6d %s\n" "$pat" "$cnt" "$filelist" >> "$RP_OUT"
      fi
    fi
  done

  {
    echo
    echo "=== Pattern-Detail: Dateien pro Pattern (vollständige Liste) ==="
  } >> "$RP_OUT"

  for pat in "${PATTERNS[@]}"; do
    files_found=$(grep -E -l -- "$pat" "$JS_DIR" -R 2>/dev/null || true)
    if [[ -n "${files_found:-}" ]]; then
      printf -- "\n-- Pattern: %s --\n" "$pat" >> "$RP_OUT"
      printf "%s\n" "$files_found" | sed 's|^|  - |' >> "$RP_OUT"
    fi
  done

  {
    echo
    echo "Running deeper duplicate-block scan (sliding window = 6 lines)."
    echo "This finds identical normalized 6-line snippets that appear in multiple files."
    echo
  } >> "$RP_OUT"

  python3 - <<PY >> "$RP_OUT"
import os, hashlib
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
        except Exception:
            continue
        norm_lines = [ln.strip() for ln in lines]
        for i in range(0, max(0, len(norm_lines)-window+1)):
            snippet = "\\n".join(norm_lines[i:i+window])
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
        print("Files: %s\\n" % ", ".join(files))
        print("Snippet:\\n-----\\n%s\\n-----\\n" % b['snippet'])
PY
else
  echo "No public/js directory found; skipping recurring patterns scan." >> "$RP_OUT"
fi

# 9) VCS & Git-Info
if [[ "$VCS" == true ]]; then
  {
    echo
    echo "9) Git Info"
    echo "-----------"
  } >> "$OUTDIR/README.txt"
  git -C "$ROOT_DIR" rev-parse --abbrev-ref HEAD > "$OUTDIR/git_branch.txt" || true
  git -C "$ROOT_DIR" status --short > "$OUTDIR/git_status.txt" || true
  git -C "$ROOT_DIR" log -n 10 --pretty=format:'%h %ad %s' --date=short > "$OUTDIR/git_recent_commits.txt" || true
fi

# 10) CI/CD & Container
{
  echo
  echo "10) CI/CD & Container"
  echo "---------------------"
} >> "$OUTDIR/README.txt"
for file in "$ROOT_DIR"/.github/workflows/*.yml "$ROOT_DIR"/.travis.yml "$ROOT_DIR"/.gitlab-ci.yml; do
  [[ -f "$file" ]] && echo "Found $file" >> "$OUTDIR/ci_configs.txt"
done
if [[ -f "$ROOT_DIR/Dockerfile" ]]; then
  grep -E "FROM|EXPOSE|VOLUME" "$ROOT_DIR/Dockerfile" > "$OUTDIR/docker_summary.txt" || true
fi

echo "Fertig! Alle Ergebnisse liegen in: $OUTDIR"
echo "Wichtige Dateien:"
echo " - README.txt"
echo " - struktur*.txt"
echo " - npm_dependencies.txt / pip_dependencies.txt / composer_dependencies.txt"
echo " - env_variables.txt"
echo " - npm_audit.json / bandit_report.json / secret_scan.json"
echo " - frontend-utils-adoption_*.csv"
echo " - recurring_patterns_report_*.txt"
