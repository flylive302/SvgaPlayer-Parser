// composables/useFormatters.ts
// Shared formatting utilities — replaces 4x formatDate, 2x formatSize, 2x statusBadge

export interface Asset {
  name: string
  assetType: string
  encoded_at: string
  cdn_urls: string[]
  formats: Record<string, string>
  thumbnail?: string
  cdnPath?: string
}

export const formatDate = (iso: string): string => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

export const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export const statusBadge = (status: string): string => {
  const map: Record<string, string> = {
    queued: 'badge-blue',
    uploading: 'badge-amber',
    processing: 'badge-violet',
    done: 'badge-emerald',
    error: 'badge-rose',
  }
  return map[status] || 'badge-blue'
}
