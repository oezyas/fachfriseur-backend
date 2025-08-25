cat > /tmp/generate_frontend_csv_fixed.sh <<'BASH'
#!/usr/bin/env bash
set -euo pipefail
JS_DIR="./public/js"
OUT="/tmp/frontend-utils-adoption-fixed.csv"
echo "file,lines,uses_secureFetch,uses_fetch,uses_withTimeout,submit_handlers,has_message_el,defines_innerHTML_or_textContent,json_headers,json_stringify,uses_URLSearchParams,uses_FormData,uses_AbortController,passes_signal,recommended_utils" > "$OUT"
find "$JS_DIR" -type f -name '*.js' | sort | while IFS= read -r file; do
  rel="${file#./}"
  # read counts / flags, coerce to single-line and default to 0
  LINES=$(wc -l < "$file" 2>/dev/null || echo 0); LINES=$(printf '%s' "$LINES" | tr -d '\r\n')
  u_secure=$(grep -E -c "secureFetch" "$file" 2>/dev/null || echo 0); u_secure=$(printf '%s' "$u_secure" | tr -d '\r\n')
  u_fetch=$(grep -E -c "\bfetch\s*\(" "$file" 2>/dev/null || echo 0); u_fetch=$(printf '%s' "$u_fetch" | tr -d '\r\n')
  u_timeout=$(grep -E -c "withTimeout" "$file" 2>/dev/null || echo 0); u_timeout=$(printf '%s' "$u_timeout" | tr -d '\r\n')
  submit_handlers=$(grep -E -c "addEventListener\([[:space:]]*['\"]submit['\"]" "$file" 2>/dev/null || echo 0); submit_handlers=$(printf '%s' "$submit_handlers" | tr -d '\r\n')
  has_message=$(( (grep -E -q "getElementById\(['\"]message['\"]\)|querySelector\([^\)]*#message" "$file" 2>/dev/null) && echo 1) || echo 0)
  has_message=$(printf '%s' "$has_message" | tr -d '\r\n')
  inner_text=$(( (grep -E -q "\.innerHTML|\.textContent" "$file" 2>/dev/null) && echo 1) || echo 0); inner_text=$(printf '%s' "$inner_text" | tr -d '\r\n')
  json_h=$(( (grep -E -q "Content-Type.*application/json" "$file" 2>/dev/null) && echo 1) || echo 0); json_h=$(printf '%s' "$json_h" | tr -d '\r\n')
  json_s=$(( (grep -E -q "JSON\.stringify" "$file" 2>/dev/null) && echo 1) || echo 0); json_s=$(printf '%s' "$json_s" | tr -d '\r\n')
  urlp=$(( (grep -E -q "URLSearchParams|location\.search" "$file" 2>/dev/null) && echo 1) || echo 0); urlp=$(printf '%s' "$urlp" | tr -d '\r\n')
  formd=$(( (grep -E -q "new[[:space:]]+FormData" "$file" 2>/dev/null) && echo 1) || echo 0); formd=$(printf '%s' "$formd" | tr -d '\r\n')
  abortc=$(( (grep -E -q "AbortController" "$file" 2>/dev/null) && echo 1) || echo 0); abortc=$(printf '%s' "$abortc" | tr -d '\r\n')
  passsig=$(( (grep -E -q "signal[[:space:]]*:" "$file" 2>/dev/null) && echo 1) || echo 0); passsig=$(printf '%s' "$passsig" | tr -d '\r\n')

  RECS=""
  [ "${u_secure:-0}" -gt 0 ] || [ "${u_fetch:-0}" -gt 0 ] || [ "${json_h:-0}" -gt 0 ] || [ "${json_s:-0}" -gt 0 ] && RECS="${RECS}apiClient,"
  [ "${submit_handlers:-0}" -gt 0 ] && RECS="${RECS}forms,"
  [ "${has_message:-0}" -gt 0 ] && RECS="${RECS}notify,"
  [ "${urlp:-0}" -gt 0 ] && RECS="${RECS}urlState,"
  [ "${formd:-0}" -gt 0 ] && RECS="${RECS}uploadClient,"
  RECS=$(printf '%s' "$RECS" | sed 's/,$//')

  # Print everything as strings to avoid printf integer errors
  # Quote CSV field for safety
  printf '%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,"%s"\n' \
    "$rel" "$LINES" "$u_secure" "$u_fetch" "$u_timeout" "$submit_handlers" "$has_message" "$inner_text" "$json_h" "$json_s" "$urlp" "$formd" "$abortc" "$passsig" "$RECS" >> "$OUT"
done
echo "Wrote $OUT"
wc -l "$OUT"
BASH

