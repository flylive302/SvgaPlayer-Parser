#!/usr/bin/env bash
set -euo pipefail

# batch-encode.sh — Process all MP4s in raw/ or from a batch.csv
# Part of: FlyLive Asset Pipeline

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
progname=$(basename "$0")

usage() {
  cat <<EOF
Usage: $progname [OPTIONS]

Batch encode all MP4 files in the raw/ directory or from a CSV manifest.

Options:
  --csv FILE         Read from CSV file instead of scanning raw/
                     CSV format: filename,alpha_side,invert,name
  --raw-dir DIR      Directory to scan for MP4s (default: ./raw)
  --alpha-side S     Default alpha side for all files: left or right (default: right)
  --parallel N       Max parallel jobs (default: 1)
  --webm-only        Skip HEVC encoding
  --output-dir DIR   Base output directory (default: ./output)
  -h, --help         Show this help

Examples:
  # Process all MP4s in raw/ with alpha on the right
  $progname --alpha-side right

  # Process from CSV
  $progname --csv batch.csv --parallel 2

  # CSV format (batch.csv):
  # filename,alpha_side,invert,name
  # gift_fire.mp4,right,no,fire_gift
  # gift_rose.mp4,left,yes,rose_gift
EOF
  exit "${1:-1}"
}

# ── Defaults ─────────────────────────────────────────────────────────────────
CSV_FILE=""
RAW_DIR="./raw"
DEFAULT_ALPHA="right"
PARALLEL=1
WEBM_ONLY=""
OUTPUT_DIR="./output"

# ── Parse args ───────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --csv)           CSV_FILE="$2";       shift 2 ;;
    --raw-dir)       RAW_DIR="$2";        shift 2 ;;
    --alpha-side)    DEFAULT_ALPHA="$2";  shift 2 ;;
    --parallel)      PARALLEL="$2";       shift 2 ;;
    --webm-only)     WEBM_ONLY="--webm-only"; shift ;;
    --output-dir)    OUTPUT_DIR="$2";     shift 2 ;;
    -h|--help)       usage 0 ;;
    *)               echo "Unknown option: $1"; usage 1 ;;
  esac
done

TOTAL=0
DONE=0
ERRORS=0

encode_one() {
  local file="$1" alpha="$2" invert_flag="$3" name="$4"

  echo ""
  echo "════════════════════════════════════════════════"
  echo "  Processing: $name ($(basename "$file"))"
  echo "════════════════════════════════════════════════"

  local extra_args=""
  if [[ "$invert_flag" == "yes" || "$invert_flag" == "1" || "$invert_flag" == "true" ]]; then
    extra_args="--invert"
  fi

  if "$SCRIPT_DIR/encode-all.sh" \
       -i "$file" \
       --alpha-side "$alpha" \
       --name "$name" \
       --output-dir "$OUTPUT_DIR" \
       ${WEBM_ONLY:-} \
       ${extra_args:-}; then
    DONE=$((DONE + 1))
  else
    ERRORS=$((ERRORS + 1))
    echo "❌ Failed: $name" >&2
  fi
}

# ── Process from CSV ─────────────────────────────────────────────────────────
if [[ -n "$CSV_FILE" ]]; then
  if [[ ! -f "$CSV_FILE" ]]; then
    echo "Error: CSV file not found: $CSV_FILE" >&2
    exit 1
  fi

  while IFS=, read -r filename alpha_side invert name; do
    # Skip header
    [[ "$filename" == "filename" ]] && continue
    [[ -z "$filename" ]] && continue

    filepath="${RAW_DIR}/${filename}"
    if [[ ! -f "$filepath" ]]; then
      echo "⚠️  File not found, skipping: $filepath" >&2
      ERRORS=$((ERRORS + 1))
      continue
    fi

    TOTAL=$((TOTAL + 1))
    encode_one "$filepath" "$alpha_side" "$invert" "$name"
  done < "$CSV_FILE"

# ── Process all MP4s in directory ────────────────────────────────────────────
else
  if [[ ! -d "$RAW_DIR" ]]; then
    echo "Error: Raw directory not found: $RAW_DIR" >&2
    exit 1
  fi

  shopt -s nullglob
  files=("$RAW_DIR"/*.mp4 "$RAW_DIR"/*.MP4)
  shopt -u nullglob

  if [[ ${#files[@]} -eq 0 ]]; then
    echo "No MP4 files found in $RAW_DIR"
    exit 0
  fi

  TOTAL=${#files[@]}
  echo "Found $TOTAL MP4 file(s) in $RAW_DIR"

  for f in "${files[@]}"; do
    base=$(basename "$f" .mp4)
    base=$(basename "$base" .MP4)
    # Convert to snake_case
    name=$(echo "$base" | tr '[:upper:] ' '[:lower:]_' | tr -cd 'a-z0-9_')
    encode_one "$f" "$DEFAULT_ALPHA" "no" "$name"
  done
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Batch complete: $DONE/$TOTAL succeeded, $ERRORS errors"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if (( ERRORS > 0 )); then exit 1; fi
exit 0
