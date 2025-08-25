#!/usr/bin/env bash
set -euo pipefail

echo "== Scan: $(pwd) =="
echo

check() {
  local file="$1"
  local label="$2"
  if [ -e "$file" ]; then
    echo "FOUND: $label -> $file"
  fi
}

check "package.json" "Node.js / npm (package.json)"
check "yarn.lock" "Yarn lockfile"
check "pnpm-lock.yaml" "pnpm lockfile"
check "requirements.txt" "Python requirements.txt"
check "pyproject.toml" "Python pyproject.toml (Poetry/PEP517)"
check "Pipfile" "pipenv (Pipfile)"
check "composer.json" "PHP / Composer"
check "Gemfile" "Ruby / Bundler (Gemfile)"
check "go.mod" "Go (go.mod)"
check "pom.xml" "Java (Maven pom.xml)"
check "build.gradle" "Java (Gradle)"
check "server.js" "Likely Node server (server.js)"
check "app.js" "Likely Node app (app.js)"
check "app.py" "Likely Python app (app.py)"
check "index.php" "PHP entrypoint (index.php)"
check "Dockerfile" "Dockerfile (containerized app)"
check "Procfile" "Procfile (heroku-like)"

echo
# counts using find (safe, portable)
html_count=$(find . -maxdepth 4 -type f -name '*.html' 2>/dev/null | wc -l)
js_count=$(find . -maxdepth 4 -type f -name '*.js' 2>/dev/null | wc -l)
php_count=$(find . -maxdepth 4 -type f -name '*.php' 2>/dev/null | wc -l)
py_count=$(find . -maxdepth 4 -type f -name '*.py' 2>/dev/null | wc -l)

echo "Top-level file counts (searched depth 4):"
echo "  .html files: ${html_count}"
echo "  .js files:   ${js_count}"
echo "  .php files:  ${php_count}"
echo "  .py files:   ${py_count}"
echo

echo "== Tips =="
if [ -f package.json ]; then
  echo " - Öffne package.json: 'cat package.json' oder 'jq .scripts package.json' um Start-Script zu sehen."
fi
if [ -f requirements.txt ] || [ -f pyproject.toml ]; then
  echo " - Python-Projekt erkannt: prüfe .venv oder erstelle mit 'python3 -m venv .venv' & 'source .venv/bin/activate'."
fi
if [ -f composer.json ]; then
  echo " - PHP-Projekt: 'composer install' bringt vendor/."
fi
if [ -f package.json ] && [ -d node_modules ]; then
  echo " - Node: lokale Abhängigkeiten vorhanden (node_modules). Nutze 'npm run <script>' zum Starten."
fi

echo
echo "Scan fertig."
