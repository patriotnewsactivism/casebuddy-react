#!/usr/bin/env bash
set -euo pipefail

echo "Node: $(node -v) | npm: $(npm -v)"
echo "PWD: $(pwd)"
echo "==== Git tracked files (first 200) ===="
git ls-files | sed -n '1,200p'
echo "==== index.html (first 80 lines) ===="
sed -n '1,80p' index.html || true
echo "==== src/main.jsx (first 80 lines) ===="
sed -n '1,80p' src/main.jsx || true
echo "==== vite.config.js ===="
[ -f vite.config.js ] && cat vite.config.js || echo "vite.config.js missing"
echo "==== postcss.config.js ===="
[ -f postcss.config.js ] && cat postcss.config.js || echo "postcss.config.js missing"
echo "==== package.json engines & scripts ===="
node -e "const p=require('./package.json'); console.log({engines:p.engines,scripts:p.scripts});"

echo "==== Running vite build (with --debug) ===="
npx vite build --debug
