#!/usr/bin/env bash
set -euo pipefail

# encode-webm.sh — Convert side-by-side packed (color + alpha) video into WebM (VP9) with embedded alpha
# Part of: FlyLive Asset Pipeline
# Works on: Linux, macOS
#
# Semantics:
#   --alpha-side left   => alpha is on the LEFT half, color on the RIGHT half
#   --alpha-side right  => alpha is on the RIGHT half, color on the LEFT half

progname=$(basename "$0")

usage() {
  cat <<EOF
Usage: $progname -i INPUT -o OUTPUT --alpha-side left|right [OPTIONS]

Encode a side-by-side alpha-packed MP4 into WebM VP9 with embedded alpha.

Required:
  -i, --input        Input packed video (side-by-side MP4)
  -o, --output       Output filename (e.g. output.webm)
  --alpha-side       Which half contains the alpha matte: left or right

Options:
  --invert           Invert the alpha matte (swap black/white)
  --crf N            VP9 quality (0-63, lower = better). Default: 20
  -h, --help         Show this help

Examples:
  $progname -i packed.mp4 -o gift.webm --alpha-side right
  $progname -i packed.mp4 -o gift.webm --alpha-side left --invert --crf 18
EOF
  exit "${1:-1}"
}

# ── Defaults ─────────────────────────────────────────────────────────────────
CRF=20
INVERT=0
ALPHA_SIDE=""
INPUT=""
OUTPUT=""

# ── Parse args ───────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    -i|--input)      INPUT="$2";      shift 2 ;;
    -o|--output)     OUTPUT="$2";     shift 2 ;;
    --alpha-side)    ALPHA_SIDE="$2"; shift 2 ;;
    --invert)        INVERT=1;        shift   ;;
    --crf)           CRF="$2";        shift 2 ;;
    -h|--help)       usage 0                  ;;
    *)               echo "Unknown option: $1"; usage 1 ;;
  esac
done

# ── Validate ─────────────────────────────────────────────────────────────────
if [[ -z "$INPUT" || -z "$OUTPUT" || -z "$ALPHA_SIDE" ]]; then
  echo "Error: Missing required parameters." >&2
  usage 1
fi

if [[ "$ALPHA_SIDE" != "left" && "$ALPHA_SIDE" != "right" ]]; then
  echo "Error: --alpha-side must be 'left' or 'right'." >&2
  exit 1
fi

if [[ ! -f "$INPUT" ]]; then
  echo "Error: Input file not found: $INPUT" >&2
  exit 1
fi

# ── Check deps ───────────────────────────────────────────────────────────────
command -v ffmpeg  >/dev/null 2>&1 || { echo "Error: ffmpeg not found." >&2;  exit 2; }
command -v ffprobe >/dev/null 2>&1 || { echo "Error: ffprobe not found." >&2; exit 2; }

# ── Probe input ──────────────────────────────────────────────────────────────
read -r WIDTH HEIGHT < <(
  ffprobe -v error -select_streams v:0 \
    -show_entries stream=width,height \
    -of csv=p=0:s=x "$INPUT" | awk -Fx '{print $1, $2}'
)

if [[ -z "$WIDTH" || -z "$HEIGHT" ]]; then
  echo "Error: Failed to read input resolution." >&2
  exit 1
fi

if (( WIDTH % 2 != 0 )); then
  echo "Error: Input width ($WIDTH) is not even — not a valid side-by-side frame." >&2
  exit 1
fi

HALF_W=$(( WIDTH / 2 ))

echo "┌─────────────────────────────────────────────"
echo "│ FlyLive WebM Encoder (VP9 + Alpha)"
echo "├─────────────────────────────────────────────"
echo "│ Input      : $INPUT"
echo "│ Output     : $OUTPUT"
echo "│ Resolution : ${WIDTH}×${HEIGHT} → ${HALF_W}×${HEIGHT}"
echo "│ Alpha side : $ALPHA_SIDE"
echo "│ Invert     : $(( INVERT ? 1 : 0 ))"
echo "│ CRF        : $CRF"
echo "└─────────────────────────────────────────────"

# ── Crop positions ───────────────────────────────────────────────────────────
if [[ "$ALPHA_SIDE" == "left" ]]; then
  ALPHA_X=0;       COLOR_X=$HALF_W
else
  COLOR_X=0;       ALPHA_X=$HALF_W
fi

# ── Filter complex ──────────────────────────────────────────────────────────
if (( INVERT )); then
  ALPHA_PROC=",format=gray,negate"
else
  ALPHA_PROC=",format=gray"
fi

FILTER_COMPLEX="[0:v]crop=${HALF_W}:${HEIGHT}:${COLOR_X}:0[color];\
[0:v]crop=${HALF_W}:${HEIGHT}:${ALPHA_X}:0${ALPHA_PROC}[alpha];\
[color][alpha]alphamerge[outv]"

# ── Audio ────────────────────────────────────────────────────────────────────
HAS_AUDIO=0
if ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$INPUT" | grep -q .; then
  HAS_AUDIO=1
fi

AUDIO_ARGS=""
if (( HAS_AUDIO )); then
  AUDIO_ARGS="-map 0:a? -c:a libopus -b:a 128k"
fi

# ── Encode ───────────────────────────────────────────────────────────────────
# Portable mktemp (macOS doesn't support --suffix)
TMP_DIR=$(mktemp -d)
TMP_OUT="${TMP_DIR}/encode.webm"
trap 'rm -rf "$TMP_DIR"' EXIT

echo ""
echo "⏳ Encoding WebM VP9 with alpha..."
ffmpeg -y -hide_banner -loglevel info \
  -i "$INPUT" \
  -filter_complex "$FILTER_COMPLEX" \
  -map "[outv]" \
  $AUDIO_ARGS \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf "$CRF" -row-mt 1 -deadline good \
  "$TMP_OUT"

# Ensure output directory exists
mkdir -p "$(dirname "$OUTPUT")"
mv -f "$TMP_OUT" "$OUTPUT"
trap - EXIT
rm -rf "$TMP_DIR" 2>/dev/null || true

SIZE=$(du -h "$OUTPUT" | cut -f1)
echo ""
echo "✅ Done: $OUTPUT ($SIZE)"
exit 0
