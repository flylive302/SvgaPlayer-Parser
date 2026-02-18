// server/utils/types.ts
// Shared type definitions for the asset manifest

export interface ManifestEntry {
  name: string
  cdnPath?: string
  assetType: string
  encoded_at: string
  cdn_urls: string[]
  formats: Record<string, string>
  thumbnail?: string
}

export interface Manifest {
  assets: ManifestEntry[]
}
