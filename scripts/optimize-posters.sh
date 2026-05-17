#!/usr/bin/env bash
# Convert public/posters/*.jpg to optimized WebP, in place.
# Requires: cwebp (brew install webp).
# run with `./scripts/optimize-posters.sh`
set -euo pipefail

SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)/public/posters"
QUALITY=92
MAX_WIDTH=600

if ! command -v cwebp >/dev/null 2>&1; then
	echo "cwebp not found. Install with: brew install webp" >&2
	exit 1
fi

count=0
for f in "$SRC_DIR"/*.jpg; do
	[ -e "$f" ] || continue
	out="${f%.jpg}.webp"
	cwebp -quiet -q "$QUALITY" -metadata icc -resize "$MAX_WIDTH" 0 "$f" -o "$out"
	count=$((count + 1))
done

echo "Converted $count posters to WebP at q=$QUALITY, width<=$MAX_WIDTH."
echo "Originals (.jpg) left in place — delete them with:"
echo "  rm $SRC_DIR/*.jpg"
