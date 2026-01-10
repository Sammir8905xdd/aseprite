#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
ZIP=aseprite-web-trial.zip
rm -f "$ZIP"
zip -r "$ZIP" index.html style.css app.js ase_exporter.js plugin.wasm || true
echo "Created $ZIP"
