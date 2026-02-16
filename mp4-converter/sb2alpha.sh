#!/usr/bin/env bash
set -euo pipefail

# sb2alpha.sh - Convert side-by-side packed (color + alpha) video into WebM (VP9) with embedded alpha
# Usage: ./sb2alpha.sh -i input.mp4 -o output.webm --alpha-side left|right [--invert] [--preview]
#
# Requirements: ffmpeg, ffprobe. For preview: mpv or ffplay.
#
# Semantics:
#  --alpha-side left  => alpha is on the LEFT half, color on the RIGHT half
#  --alpha-side right => alpha is on the RIGHT half, color on the LEFT half

progname=$(basename "$0")

usage() {
  cat <<EOF
Usage: $progname -i INPUT -o OUTPUT --alpha-side left|right [--invert] [--preview] [--crf N] [--preview-res HEIGHT]

Options:
  -i, --input        Input packed video (side-by-side)
  -o, --output       Output filename (e.g. output_alpha.webm)
  --alpha-side       Which half contains alpha: left or right
  --invert           Invert the alpha matte (if whites/black are swapped)
  --preview          Generate a low-res preview and play it (requires mpv or ffplay)
  --crf N            VP9 quality (lower = better). Default 28
  --preview-res H    Height for preview scaling (default 720)
  -h, --help         Show this help

Examples:
  # alpha on right, default options
  ./sb2alpha.sh -i packed.mov -o output_alpha.webm --alpha-side right

  # alpha on left, invert matte, preview
  ./sb2alpha.sh -i packed.mov -o output_alpha.webm --alpha-side left --invert --preview

EOF
  exit 1
}

# Default values
CRF=20
PREVIEW_RES=720
DO_PREVIEW=0
INVERT=0
ALPHA_SIDE=""

# Parse args
ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    -i|--input) INPUT="$2"; shift 2;;
    -o|--output) OUTPUT="$2"; shift 2;;
    --alpha-side) ALPHA_SIDE="$2"; shift 2;;
    --invert) INVERT=1; shift;;
    --preview) DO_PREVIEW=1; shift;;
    --crf) CRF="$2"; shift 2;;
    --preview-res) PREVIEW_RES="$2"; shift 2;;
    -h|--help) usage;;
    *) ARGS+=("$1"); shift;;
  esac
done

if [[ -z "${INPUT:-}" || -z "${OUTPUT:-}" || -z "${ALPHA_SIDE:-}" ]]; then
  echo "Missing required parameters."
  usage
fi

if [[ "$ALPHA_SIDE" != "left" && "$ALPHA_SIDE" != "right" ]]; then
  echo "Invalid --alpha-side. Use left or right."
  exit 1
fi

command -v ffmpeg >/dev/null 2>&1 || { echo "ffmpeg not found. Install ffmpeg."; exit 1; }
command -v ffprobe >/dev/null 2>&1 || { echo "ffprobe not found. Install ffprobe."; exit 1; }

# Probe input
read -r WIDTH HEIGHT < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$INPUT" | awk -Fx '{print $1, $2}')
if [[ -z "$WIDTH" || -z "$HEIGHT" ]]; then
  echo "Failed to read input resolution."
  exit 1
fi

# Validate side-by-side assumption
if (( WIDTH % 2 != 0 )); then
  echo "Input width is not divisible by 2. Not a valid side-by-side packed frame."
  exit 1
fi

HALF_W=$(( WIDTH / 2 ))

echo "Input resolution: ${WIDTH}x${HEIGHT}"
echo "Detected half width: ${HALF_W}x${HEIGHT}"
echo "Alpha side: ${ALPHA_SIDE}"
if (( INVERT )); then echo "Alpha invert: yes"; else echo "Alpha invert: no"; fi
echo "Target CRF: ${CRF}"

# Build crop positions
if [[ "$ALPHA_SIDE" == "left" ]]; then
  ALPHA_X=0
  COLOR_X=$HALF_W
else
  COLOR_X=0
  ALPHA_X=$HALF_W
fi

# Build filter complex
# Steps:
#  1) crop color and alpha halves
#  2) alpha: ensure grayscale format; optionally negate
#  3) alphamerge color+alpha -> outv
if (( INVERT )); then
  ALPHA_PROCESS=",format=gray,negate"
else
  ALPHA_PROCESS=",format=gray"
fi

FILTER_COMPLEX="[0:v]crop=${HALF_W}:${HEIGHT}:${COLOR_X}:0[color]; \
[0:v]crop=${HALF_W}:${HEIGHT}:${ALPHA_X}:0${ALPHA_PROCESS}[alpha]; \
[color][alpha]alphamerge[outv]"

# Check for audio stream existence
HAS_AUDIO=0
if ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$INPUT" | grep -q .; then
  HAS_AUDIO=1
fi

# Build final ffmpeg command
# We will re-encode video with libvpx-vp9 and pix_fmt yuva420p (alpha)
# Audio: if present, encode to Opus at 128k; if not present, omit map.
if (( HAS_AUDIO )); then
  AUDIO_MAP="-map 0:a? -c:a libopus -b:a 128k"
else
  AUDIO_MAP=""
fi

# Output temp path during processing
TMP_OUT="$(mktemp --suffix=.webm)"
trap 'rm -f "$TMP_OUT"' EXIT

echo "Starting full-quality encode to temporary file..."
ffmpeg -y -hide_banner -loglevel info \
  -i "$INPUT" \
  -filter_complex "$FILTER_COMPLEX" \
  -map "[outv]" \
  $AUDIO_MAP \
  -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf "$CRF" -row-mt 1 -deadline good \
  "$TMP_OUT"

# Move to final output
mv -f "$TMP_OUT" "$OUTPUT"
trap - EXIT
echo "Final file written: $OUTPUT"

# Preview if requested
if (( DO_PREVIEW )); then
  echo "Generating low-res preview (height=${PREVIEW_RES})..."
  PREVIEW_TMP="$(mktemp --suffix=.webm)"
  # Create low-res preview: scale color+alpha before alphamerge to reduce work
  PREVIEW_FILTER="[0:v]crop=${HALF_W}:${HEIGHT}:${COLOR_X}:0,scale=-2:${PREVIEW_RES}[c]; \
[0:v]crop=${HALF_W}:${HEIGHT}:${ALPHA_X}:0${ALPHA_PROCESS},scale=-2:${PREVIEW_RES}[a]; \
[c][a]alphamerge[vo]"
  ffmpeg -y -hide_banner -loglevel warning -i "$INPUT" \
    -filter_complex "$PREVIEW_FILTER" \
    -map "[vo]" \
    $AUDIO_MAP \
    -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -crf 40 -row-mt 1 -deadline realtime \
    "$PREVIEW_TMP"

  # Play preview
  if command -v mpv >/dev/null 2>&1; then
    mpv --fs "$PREVIEW_TMP" || true
  elif command -v ffplay >/dev/null 2>&1; then
    ffplay -autoexit -noborder -fs "$PREVIEW_TMP" || true
  else
    echo "No mpv or ffplay found to preview. Preview file at: $PREVIEW_TMP"
  fi

  # Offer to delete preview file
  read -r -p "Delete preview file? [Y/n] " resp
  resp=${resp:-Y}
  if [[ "$resp" =~ ^[Yy] ]]; then
    rm -f "$PREVIEW_TMP"
  else
    echo "Preview file kept: $PREVIEW_TMP"
  fi
fi

echo "Done."
exit 0