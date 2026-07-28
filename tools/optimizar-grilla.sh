#!/bin/sh
# ============================================================
#  Fotos del hero — de originales a versiones para web
#
#  src/assets/grilla      = originales, tal como los subís (no se tocan).
#  src/assets/grilla-web  = lo que consume el hero (HeroPase.jsx).
#
#  Tiraste una foto nueva en grilla/? Corré `npm run fotos` y listo.
#  Las columnas del hero miden 300px de ancho como máximo, así que 900px de
#  lado mayor ya cubre pantallas retina; el resto es peso al pedo.
# ============================================================
set -e
cd "$(dirname "$0")/.."

ORIG=src/assets/grilla
WEB=src/assets/grilla-web

mkdir -p "$WEB"
rm -f "$WEB"/*

sips -s format jpeg -s formatOptions 50 --resampleHeightWidthMax 900 \
  "$ORIG"/*.jpg "$ORIG"/*.jpeg --out "$WEB"/ >/dev/null 2>&1 || true

# avif y webp ya vienen comprimidos: se copian tal cual.
cp "$ORIG"/*.avif "$ORIG"/*.webp "$WEB"/ 2>/dev/null || true

echo "grilla-web listo: $(ls "$WEB" | wc -l | tr -d ' ') archivos, $(du -sh "$WEB" | cut -f1)"
