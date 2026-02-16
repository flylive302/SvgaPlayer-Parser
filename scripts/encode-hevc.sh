#!/usr/bin/env bash
set -euo pipefail

# encode-hevc.sh — Convert side-by-side packed (color + alpha) video into HEVC MOV with alpha
# Part of: FlyLive Asset Pipeline
# Requires: macOS with VideoToolbox (hevc_videotoolbox)
#
# Semantics:
#   --alpha-side left   => alpha is on the LEFT half, color on the RIGHT half
#   --alpha-side right  => alpha is on the RIGHT half, color on the LEFT half

progname=$(basename "$0")

usage() {
  cat <<EOF
Usage: $progname -i INPUT -o OUTPUT --alpha-side left|right [OPTIONS]

Encode a side-by-side alpha-packed MP4 into HEVC MOV with embedded alpha (Safari/iOS).

⚠️  Requires macOS with VideoToolbox. Will not work on Linux.

Required:
  -i, --input        Input packed video (side-by-side MP4)
  -o, --output       Output filename (e.g. output.mov)
  --alpha-side       Which half contains the alpha matte: left or right

Options:
  --invert           Invert the alpha matte (swap black/white)
  --quality N        Alpha quality (0.0-1.0). Default: 0.75
  -h, --help         Show this help

Examples:
  $progname -i packed.mp4 -o gift.mov --alpha-side right
  $progname -i packed.mp4 -o gift.mov --alpha-side left --invert --quality 0.9
EOF
  exit "${1:-1}"
}

# ── Defaults ─────────────────────────────────────────────────────────────────
QUALITY=0.75
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
    --quality)       QUALITY="$2";    shift 2 ;;
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

# ── macOS check ──────────────────────────────────────────────────────────────
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Error: HEVC alpha encoding requires macOS with VideoToolbox." >&2
  echo "       This script cannot run on $(uname -s)." >&2
  echo "       Use the GitHub Actions workflow (macos-latest runner) instead." >&2
  exit 2
fi

# ── Check deps ───────────────────────────────────────────────────────────────
command -v ffmpeg  >/dev/null 2>&1 || { echo "Error: ffmpeg not found." >&2;  exit 2; }
command -v ffprobe >/dev/null 2>&1 || { echo "Error: ffprobe not found." >&2; exit 2; }

# ── Check VideoToolbox ───────────────────────────────────────────────────────
if ! ffmpeg -hide_banner -encoders 2>/dev/null | grep -q hevc_videotoolbox; then
  echo "Error: hevc_videotoolbox encoder not available in ffmpeg." >&2
  echo "       Install ffmpeg with VideoToolbox support: brew install ffmpeg" >&2
  exit 2
fi

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
echo "│ FlyLive HEVC Encoder (VideoToolbox + Alpha)"
echo "├─────────────────────────────────────────────"
echo "│ Input      : $INPUT"
echo "│ Output     : $OUTPUT"
echo "│ Resolution : ${WIDTH}×${HEIGHT} → ${HALF_W}×${HEIGHT}"
echo "│ Alpha side : $ALPHA_SIDE"
echo "│ Invert     : $(( INVERT ? 1 : 0 ))"
echo "│ Quality    : $QUALITY"
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
[color][alpha]alphamerge,format=bgra[outv]"

# ── Audio ────────────────────────────────────────────────────────────────────
HAS_AUDIO=0
if ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$INPUT" | grep -q .; then
  HAS_AUDIO=1
fi

AUDIO_ARGS=""
if (( HAS_AUDIO )); then
  AUDIO_ARGS="-map 0:a? -c:a aac -b:a 128k"
fi

# ── Encode ───────────────────────────────────────────────────────────────────
TMP_DIR=$(mktemp -d)
TMP_OUT="${TMP_DIR}/encode.mov"
trap 'rm -rf "$TMP_DIR"' EXIT

echo ""
echo "⏳ Encoding HEVC with alpha via VideoToolbox..."
ffmpeg -y -hide_banner -loglevel info \
  -i "$INPUT" \
  -filter_complex "$FILTER_COMPLEX" \
  -map "[outv]" \
  $AUDIO_ARGS \
  -c:v hevc_videotoolbox \
  -alpha_quality "$QUALITY" \
  -tag:v hvc1 \
  "$TMP_OUT"

# ── Finalize ─────────────────────────────────────────────────────────────────
mkdir -p "$(dirname "$OUTPUT")"
mv -f "$TMP_OUT" "$OUTPUT"
trap - EXIT
rm -rf "$TMP_DIR" 2>/dev/null || true

SIZE=$(du -h "$OUTPUT" | cut -f1)
echo ""
echo "✅ Done: $OUTPUT ($SIZE)"
exit 0
