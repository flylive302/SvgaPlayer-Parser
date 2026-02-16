#!/usr/bin/env bash
set -euo pipefail

# encode-all.sh — Orchestrator: runs WebM + HEVC encoders for a single input
# Part of: FlyLive Asset Pipeline

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
progname=$(basename "$0")

usage() {
  cat <<EOF
Usage: $progname -i INPUT --alpha-side left|right --name NAME [OPTIONS]

Encode a side-by-side alpha-packed MP4 into both WebM (VP9) and HEVC (MOV) formats.
Also generates a thumbnail (PNG) from frame at 1 second.

Output structure:
  output/webm/<NAME>/playable.webm
  output/hevc/<NAME>/playable.mov
  output/webm/<NAME>/thumbnail.png

Required:
  -i, --input        Input packed video (side-by-side MP4)
  --alpha-side       Which half contains alpha: left or right
  --name             Output name (used for directory structure)

Options:
  --invert           Invert the alpha matte
  --crf N            VP9 quality (default: 20)
  --quality N        HEVC alpha quality 0.0-1.0 (default: 0.75)
  --webm-only        Skip HEVC encoding (useful on Linux)
  --hevc-only        Skip WebM encoding
  --output-dir DIR   Base output directory (default: ./output)
  -h, --help         Show this help

Examples:
  $progname -i raw/gift.mp4 --alpha-side right --name oceanic_reverie
  $progname -i raw/gift.mp4 --alpha-side left --name silver_rose --webm-only
EOF
  exit "${1:-1}"
}

# ── Defaults ─────────────────────────────────────────────────────────────────
INPUT=""
ALPHA_SIDE=""
NAME=""
INVERT=""
CRF=20
QUALITY=0.75
WEBM_ONLY=0
HEVC_ONLY=0
OUTPUT_DIR="./output"

# ── Parse args ───────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    -i|--input)      INPUT="$2";      shift 2 ;;
    --alpha-side)    ALPHA_SIDE="$2"; shift 2 ;;
    --name)          NAME="$2";       shift 2 ;;
    --invert)        INVERT="--invert"; shift  ;;
    --crf)           CRF="$2";        shift 2 ;;
    --quality)       QUALITY="$2";    shift 2 ;;
    --webm-only)     WEBM_ONLY=1;     shift   ;;
    --hevc-only)     HEVC_ONLY=1;     shift   ;;
    --output-dir)    OUTPUT_DIR="$2"; shift 2 ;;
    -h|--help)       usage 0                  ;;
    *)               echo "Unknown option: $1"; usage 1 ;;
  esac
done

# ── Validate ─────────────────────────────────────────────────────────────────
if [[ -z "$INPUT" || -z "$ALPHA_SIDE" || -z "$NAME" ]]; then
  echo "Error: Missing required parameters." >&2
  usage 1
fi

if [[ ! -f "$INPUT" ]]; then
  echo "Error: Input file not found: $INPUT" >&2
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  FlyLive Asset Pipeline — Encode All"
echo "  Input : $INPUT"
echo "  Name  : $NAME"
echo "  Alpha : $ALPHA_SIDE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

WEBM_DIR="${OUTPUT_DIR}/webm/${NAME}"
HEVC_DIR="${OUTPUT_DIR}/hevc/${NAME}"
FAILED=0

# ── WebM encoding ────────────────────────────────────────────────────────────
if (( ! HEVC_ONLY )); then
  echo ""
  echo "── Step 1/3: WebM VP9 ─────────────────────────"
  mkdir -p "$WEBM_DIR"
  if "$SCRIPT_DIR/encode-webm.sh" \
       -i "$INPUT" \
       -o "${WEBM_DIR}/playable.webm" \
       --alpha-side "$ALPHA_SIDE" \
       --crf "$CRF" \
       ${INVERT:-}; then
    echo "✅ WebM encoding complete."
  else
    echo "❌ WebM encoding failed!" >&2
    FAILED=1
  fi
fi

# ── HEVC encoding ───────────────────────────────────────────────────────────
if (( ! WEBM_ONLY )); then
  echo ""
  echo "── Step 2/3: HEVC Alpha ───────────────────────"
  mkdir -p "$HEVC_DIR"
  if "$SCRIPT_DIR/encode-hevc.sh" \
       -i "$INPUT" \
       -o "${HEVC_DIR}/playable.mov" \
       --alpha-side "$ALPHA_SIDE" \
       --quality "$QUALITY" \
       ${INVERT:-}; then
    echo "✅ HEVC encoding complete."
  else
    echo "⚠️  HEVC encoding failed (expected on non-macOS)." >&2
  fi
fi

# ── Thumbnail ────────────────────────────────────────────────────────────────
echo ""
echo "── Step 3/3: Thumbnail ────────────────────────"

# Read dimensions for cropping the color half
read -r FULL_W FULL_H < <(
  ffprobe -v error -select_streams v:0 \
    -show_entries stream=width,height \
    -of csv=p=0:s=x "$INPUT" | awk -Fx '{print $1, $2}'
)
HALF_W=$(( FULL_W / 2 ))

if [[ "$ALPHA_SIDE" == "left" ]]; then
  CROP_X=$HALF_W
else
  CROP_X=0
fi

THUMB_DIR="${OUTPUT_DIR}/webm/${NAME}"
mkdir -p "$THUMB_DIR"
if ffmpeg -y -hide_banner -loglevel warning \
  -i "$INPUT" \
  -vf "crop=${HALF_W}:${FULL_H}:${CROP_X}:0,scale=512:512:force_original_aspect_ratio=decrease" \
  -ss 1 -frames:v 1 \
  "${THUMB_DIR}/thumbnail.png"; then
  echo "✅ Thumbnail: ${THUMB_DIR}/thumbnail.png"
else
  echo "⚠️  Thumbnail generation failed (non-critical)." >&2
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if (( FAILED )); then
  echo "  ❌ Encoding finished with errors."
  exit 1
else
  echo "  ✅ All encoding complete for: $NAME"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exit 0
