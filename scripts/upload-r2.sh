#!/usr/bin/env bash
set -euo pipefail

# upload-r2.sh — Upload processed assets to Cloudflare R2
# Part of: FlyLive Asset Pipeline

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
progname=$(basename "$0")

BUCKET="flylive-assets"

usage() {
  cat <<EOF
Usage: $progname --name NAME --type TYPE [OPTIONS]
       $progname --all [OPTIONS]

Upload encoded assets from output/ to Cloudflare R2 bucket.

Required (single asset):
  --name NAME        Asset name (directory name under output/)
  --type TYPE        Gift type: vip or normal

Batch mode:
  --all              Upload everything in output/, using directory name as asset name

Options:
  --gift-type TYPE   Default type for --all mode (default: normal)
  --bucket NAME      R2 bucket name (default: flylive-assets)
  --output-dir DIR   Base output directory (default: ./output)
  --dry-run          Show what would be uploaded without actually uploading
  -h, --help         Show this help

R2 Upload Structure:
  room/gifts/vip-gifts/{name}/playable.webm
  room/gifts/vip-gifts/{name}/playable.mov
  room/gifts/vip-gifts/{name}/thumbnail.png
  room/gifts/normal/{name}/playable.webm
  room/gifts/normal/{name}/playable.mov
  room/gifts/normal/{name}/thumbnail.png

Prerequisites:
  - wrangler CLI installed: npm install -g wrangler
  - Authenticated: wrangler login  (or set CLOUDFLARE_API_TOKEN env var)

Examples:
  $progname --name oceanic_reverie --type vip
  $progname --all --gift-type normal
  $progname --name fire_gift --type vip --dry-run
EOF
  exit "${1:-1}"
}

# ── Defaults ─────────────────────────────────────────────────────────────────
NAME=""
TYPE=""
UPLOAD_ALL=0
DEFAULT_TYPE="normal"
OUTPUT_DIR="./output"
DRY_RUN=0

# ── Parse args ───────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)        NAME="$2";         shift 2 ;;
    --type)        TYPE="$2";         shift 2 ;;
    --all)         UPLOAD_ALL=1;      shift   ;;
    --gift-type)   DEFAULT_TYPE="$2"; shift 2 ;;
    --bucket)      BUCKET="$2";       shift 2 ;;
    --output-dir)  OUTPUT_DIR="$2";   shift 2 ;;
    --dry-run)     DRY_RUN=1;         shift   ;;
    -h|--help)     usage 0 ;;
    *)             echo "Unknown option: $1"; usage 1 ;;
  esac
done

# ── Validate ─────────────────────────────────────────────────────────────────
if (( ! UPLOAD_ALL )) && [[ -z "$NAME" || -z "$TYPE" ]]; then
  echo "Error: Either use --all or provide --name and --type." >&2
  usage 1
fi

command -v wrangler >/dev/null 2>&1 || {
  echo "Error: wrangler CLI not found. Install: npm install -g wrangler" >&2
  exit 2
}

# ── Helpers ──────────────────────────────────────────────────────────────────
get_content_type() {
  case "${1##*.}" in
    webm) echo "video/webm" ;;
    mov)  echo "video/quicktime" ;;
    png)  echo "image/png" ;;
    jpg|jpeg) echo "image/jpeg" ;;
    json) echo "application/json" ;;
    *)    echo "application/octet-stream" ;;
  esac
}

get_r2_prefix() {
  local type="$1" name="$2"
  if [[ "$type" == "vip" ]]; then
    echo "room/gifts/vip-gifts/${name}"
  else
    echo "room/gifts/normal/${name}"
  fi
}

upload_file() {
  local local_path="$1" r2_key="$2"
  local ct
  ct=$(get_content_type "$local_path")

  if (( DRY_RUN )); then
    echo "  [DRY RUN] $local_path → $r2_key ($ct)"
    return 0
  fi

  echo "  ⬆️  $local_path → $r2_key ($ct)"
  wrangler r2 object put "${BUCKET}/${r2_key}" \
    --file "$local_path" \
    --content-type "$ct" \
    --remote 2>&1 | tail -1
}

UPLOADED=0
ERRORS=0

upload_asset() {
  local name="$1" type="$2"
  local prefix
  prefix=$(get_r2_prefix "$type" "$name")

  echo ""
  echo "── Uploading: $name (${type}) ──"

  # WebM
  local webm="${OUTPUT_DIR}/webm/${name}/playable.webm"
  if [[ -f "$webm" ]]; then
    upload_file "$webm" "${prefix}/playable.webm" && UPLOADED=$((UPLOADED + 1))
  else
    echo "  ⚠️  WebM not found: $webm"
  fi

  # HEVC
  local hevc="${OUTPUT_DIR}/hevc/${name}/playable.mov"
  if [[ -f "$hevc" ]]; then
    upload_file "$hevc" "${prefix}/playable.mov" && UPLOADED=$((UPLOADED + 1))
  else
    echo "  ⚠️  HEVC not found (expected if encoded on Linux): $hevc"
  fi

  # Thumbnail
  local thumb="${OUTPUT_DIR}/webm/${name}/thumbnail.png"
  if [[ -f "$thumb" ]]; then
    upload_file "$thumb" "${prefix}/thumbnail.png" && UPLOADED=$((UPLOADED + 1))
  else
    echo "  ⚠️  Thumbnail not found: $thumb"
  fi
}

# ── Single asset ─────────────────────────────────────────────────────────────
if (( ! UPLOAD_ALL )); then
  upload_asset "$NAME" "$TYPE"
else
  # ── Batch upload ─────────────────────────────────────────────────────────
  shopt -s nullglob
  for dir in "${OUTPUT_DIR}/webm"/*/; do
    name=$(basename "$dir")
    upload_asset "$name" "$DEFAULT_TYPE"
  done
  shopt -u nullglob
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Upload complete: $UPLOADED files uploaded"
if (( DRY_RUN )); then
  echo "  (dry run — nothing was actually uploaded)"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exit 0
