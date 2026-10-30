#!/usr/bin/env bash
# Baut die PDFs. Node, poppler, zbar, qrencode und fontTools kommen über Nix (werkzeuge/mit-nix.sh).
# Beispiele:  ./baue.sh          ./baue.sh --nur 03 --png
set -euo pipefail
cd "$(dirname "$0")"
exec werkzeuge/mit-nix.sh sh -c '[ -d node_modules ] || npm install --no-audit --no-fund; node build.mjs "$@"' sh "$@"
