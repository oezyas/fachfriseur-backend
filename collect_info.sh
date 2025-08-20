#!/usr/bin/env bash
set -euo pipefail

OUTDIR="audit_report_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$OUTDIR"

echo "1) Projektstruktur" > "$OUTDIR/README.txt"
echo "==================" >> "$OUTDIR/README.txt"
echo "" >> "$OUTDIR/README.txt"
tree -I 'node_modules|.git|logs|__pycache__' -L 2 . >> "$OUTDIR/struktur.txt"

echo "2) Abhängigkeiten" >> "$OUTDIR/README.txt"
echo "------------------" >> "$OUTDIR/README.txt"
if [ -f package.json ]; then
  echo "- Node.js (npm)" >> "$OUTDIR/README.txt"
  npm ls --depth=0 > "$OUTDIR/npm_dependencies.txt" 2>&1 || true
fi
if [ -f requirements.txt ]; then
  echo "- Python (pip)" >> "$OUTDIR/README.txt"
  pip freeze > "$OUTDIR/pip_dependencies.txt" 2>&1 || true
fi
if [ -f composer.json ]; then
  echo "- PHP (Composer)" >> "$OUTDIR/README.txt"
  composer show --no-ansi > "$OUTDIR/composer_dependencies.txt" 2>&1 || true
fi

echo "3) Konfigurationsdateien & Umgebungsvariablen" >> "$OUTDIR/README.txt"
echo "---------------------------------------------" >> "$OUTDIR/README.txt"
grep -R "DATABASE_" -n . > "$OUTDIR/database_config_references.txt" || true
if [ -f .env ]; then
  sed -e 's/=.*/=****/g' .env > "$OUTDIR/env_variables.txt"
fi

echo "4) Logik-Punkte (Endpoints, Routen, Tasks)" >> "$OUTDIR/README.txt"
echo "-------------------------------------------" >> "$OUTDIR/README.txt"
grep -R "app\.get" -n . > "$OUTDIR/node_routes.txt" 2>/dev/null || true
grep -R "@Route" -n . > "$OUTDIR/php_routes.txt" 2>/dev/null || true
grep -R "urlpatterns" -n . > "$OUTDIR/django_urls.txt" 2>/dev/null || true

echo "5) Sicherheits-Checks" >> "$OUTDIR/README.txt"
echo "----------------------" >> "$OUTDIR/README.txt"
if command -v npm >/dev/null && [ -f package.json ]; then
  npm audit --json > "$OUTDIR/npm_audit.json" || true
fi
if command -v bandit >/dev/null && [ -f requirements.txt ]; then
  bandit -r . -f json -o "$OUTDIR/bandit_report.json" || true
fi
if command -v trufflehog >/dev/null; then
  trufflehog filesystem . --json > "$OUTDIR/secret_scan.json" || true
fi

echo "6) Webserver- & SSL-Einstellungen" >> "$OUTDIR/README.txt"
echo "--------------------------------" >> "$OUTDIR/README.txt"
if [ -f nginx.conf ]; then
  grep -E "ssl_certificate|listen" nginx.conf > "$OUTDIR/nginx_ssl_settings.txt"
fi
if [ -f apache2.conf ] || [ -f httpd.conf ]; then
  grep -E "SSLEngine|DocumentRoot" *.conf > "$OUTDIR/apache_ssl_settings.txt" || true
fi

echo "Fertig! Alle Ergebnisse liegen in $OUTDIR/" >> "$OUTDIR/README.txt"

