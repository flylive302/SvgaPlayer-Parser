// server/utils/cdn-types.ts
// Shared types and helpers for CDN object listings (R2, ImageKit, etc.)

export type CdnProvider = 'r2' | 'imagekit'

export interface CdnObjectItem {
  name: string
  path: string
  url: string
  size?: number
  lastModified?: string
  isImageOrVideo?: boolean
  thumbnailUrl?: string
  provider: CdnProvider
}

export interface CdnListResponse {
  success: boolean
  items: CdnObjectItem[]
  nextCursor?: string
  error?: string
}

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg'])
const VIDEO_EXTS = new Set(['.webm', '.mov', '.mp4'])

export function inferIsImageOrVideo(key: string): boolean {
  const lower = key.toLowerCase()
  const dot = lower.lastIndexOf('.')
  if (dot === -1) return false
  const ext = lower.slice(dot)
  return IMAGE_EXTS.has(ext) || VIDEO_EXTS.has(ext)
}

export function inferThumbnailKey(key: string): string | undefined {
  // Simple heuristic:
  // - If key already includes "thumbnail", assume it's a thumbnail.
  // - Otherwise, for common patterns like "folder/playable.webm",
  //   suggest "folder/thumbnail.png".
  const lower = key.toLowerCase()
  if (lower.includes('thumbnail')) return key

  const parts = key.split('/')
  if (!parts.length) return undefined

  const filename = parts[parts.length - 1]
  const dot = filename.lastIndexOf('.')
  const base = dot === -1 ? filename : filename.slice(0, dot)

  if (base === 'playable' || base === 'video') {
    parts[parts.length - 1] = 'thumbnail.png'
    return parts.join('/')
  }

  return undefined
}

