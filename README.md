# FlyLive Asset Pipeline

> Convert raw alpha-packed MP4s into browser-ready **WebM** + **HEVC** video assets and upload them to **Cloudflare R2** or **ImageKit CDN**.

## Architecture

```
Designer provides raw MP4 (side-by-side: color + alpha matte)
       │
       ▼
┌──────────────────────────────────────┐
│     FlyLive Asset Pipeline           │
│                                      │
│  GUI: Upload → Configure → Process   │
│  CLI: Shell scripts for automation   │
│  CI:  GitHub Actions (HEVC on macOS) │
│                                      │
│  Outputs:                            │
│  1. WebM VP9+alpha  (Chrome/Android) │
│  2. MOV HEVC+alpha  (Safari/iOS)     │
│  3. Thumbnail PNG                    │
│  4. Upload to R2 / ImageKit          │
└──────────────────────────────────────┘
       │
       ▼
   R2 Bucket: flylive-assets
   Domain: https://assets.flyliveapp.com
```

## Quick Start

### Prerequisites

- **Node.js** 18+
- **ffmpeg** + **ffprobe** (for video encoding)
- **wrangler** (for R2 uploads): `npm install -g wrangler`

### Install & Run GUI

```bash
npm install
npm run dev
```

Open **http://localhost:3000** — you'll see the dashboard.

### GUI Workflow

1. Go to **Upload & Process**
2. Drag & drop your MP4 files
3. Configure each asset:
   - **Output Name** — rename the output
   - **Alpha Side** — left or right (which half is the alpha matte)
   - **Gift Type** — vip or normal
   - **CDN Target** — R2, ImageKit, or None
4. Click **⚡ Process All**
5. Assets are encoded and optionally uploaded to CDN

### CDN Settings

Go to **Settings** to configure:

- **Cloudflare R2**: Account ID, API Token, Bucket name, Custom domain
- **ImageKit**: URL Endpoint, Public/Private keys

## CLI Scripts

All scripts are in `scripts/` and support `--help`.

### Encode a single video

```bash
# WebM VP9 + alpha (works on Linux & macOS)
./scripts/encode-webm.sh -i raw/gift.mp4 -o output/webm/gift/playable.webm --alpha-side right

# HEVC + alpha (macOS only)
./scripts/encode-hevc.sh -i raw/gift.mp4 -o output/hevc/gift/playable.mov --alpha-side right

# Both formats + thumbnail
./scripts/encode-all.sh -i raw/gift.mp4 --alpha-side right --name my_gift
```

### Batch processing

```bash
# Process all MP4s in raw/
./scripts/batch-encode.sh --alpha-side right

# Process from CSV manifest
./scripts/batch-encode.sh --csv batch.csv
```

**CSV format** (`batch.csv`):

```csv
filename,alpha_side,invert,name
gift_fire.mp4,right,no,fire_gift
gift_rose.mp4,left,yes,rose_gift
```

### Upload to R2

```bash
# Single asset
./scripts/upload-r2.sh --name my_gift --type vip

# All assets
./scripts/upload-r2.sh --all --gift-type normal

# Dry run
./scripts/upload-r2.sh --name my_gift --type vip --dry-run
```

## GitHub Actions (HEVC Encoding)

HEVC alpha encoding requires macOS with VideoToolbox. Use the GitHub Actions workflow:

1. Go to **Actions** → **Encode & Upload Assets**
2. Click **Run workflow**
3. Fill in: video_name, alpha_side, invert, gift_type
4. The `macos-latest` runner encodes both WebM + HEVC and uploads to R2

### Required Secrets

| Secret                  | Description                   |
| ----------------------- | ----------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Wrangler auth (R2 read/write) |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID    |

## R2 Bucket Structure

```
flylive-assets/
├── room/gifts/vip-gifts/
│   └── {name}/
│       ├── playable.webm    (Chrome/Android)
│       ├── playable.mov     (Safari/iOS)
│       └── thumbnail.png
└── room/gifts/normal/
    └── {name}/
        ├── playable.webm
        ├── playable.mov
        └── thumbnail.png
```

**CDN URL**: `https://assets.flyliveapp.com/room/gifts/vip-gifts/{name}/playable.webm`

## Frontend Integration

The Nuxt 4 frontend uses `resolveAssetUrl()`:

```typescript
// Browser detection → serve correct format
const url = resolveAssetUrl(`room/gifts/vip-gifts/${name}/playable`);
// Chrome: .webm  |  Safari: .mov
```

## Adding a New Gift

1. Get the raw side-by-side MP4 from the designer
2. Open the GUI at `http://localhost:3000/upload`
3. Drop the MP4, configure name + alpha side + type
4. Click Process All
5. Verify the output plays correctly (green background = alpha working)
6. Upload to R2 via the GUI or `./scripts/upload-r2.sh`

## Asset Manifest

`assets.json` tracks all processed assets:

```json
{
  "version": 1,
  "generated_at": "2026-02-16T10:00:00Z",
  "assets": [
    {
      "name": "oceanic_reverie",
      "type": "vip",
      "formats": {
        "webm": "room/gifts/vip-gifts/oceanic_reverie/playable.webm",
        "hevc": "room/gifts/vip-gifts/oceanic_reverie/playable.mov"
      },
      "thumbnail": "room/gifts/vip-gifts/oceanic_reverie/thumbnail.png",
      "encoded_at": "2026-02-16T10:00:00Z"
    }
  ]
}
```

## Tech Stack

- **GUI**: Nuxt 3 (Vue 3)
- **Encoding**: ffmpeg (libvpx-vp9, hevc_videotoolbox)
- **CDN**: Cloudflare R2 (wrangler), ImageKit (REST API)
- **CI**: GitHub Actions (macos-latest for HEVC)
