#!/usr/bin/env bash
# Führt einen Befehl in einer Umgebung mit allen Werkzeugen aus (über Nix, nichts global installiert):
# Node 22, poppler, zbar, qrencode, librsvg und Python mit fontTools + brotli.
#   werkzeuge/mit-nix.sh node build.mjs --nur 02
set -euo pipefail
cd "$(dirname "$0")/.."
UMGEBUNG='let pkgs = (builtins.getFlake "nixpkgs").legacyPackages.${builtins.currentSystem}; in
  pkgs.buildEnv { name = "denk-werkstatt"; ignoreCollisions = true; paths = [
    pkgs.nodejs_22 pkgs.poppler-utils pkgs.zbar pkgs.qrencode pkgs.librsvg
    (pkgs.python3.withPackages (p: [ p.fonttools p.brotli ])) ]; }'
exec nix shell --impure --expr "$UMGEBUNG" -c "$@"
