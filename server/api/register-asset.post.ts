// server/api/register-asset.post.ts
// Auto-registers a newly converted/parsed asset in assets.json
import { defineEventHandler, readBody } from 'h3'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { writeFile } from 'fs/promises'

interface ManifestEntry {
  name: string
  assetType: string
  encoded_at: string
  cdn_urls: string[]
  formats: Record<string, string>
  thumbnail?: string
  cdnPath?: string
}

interface Manifest {
  version: number
  generated_at: string
  assets: ManifestEntry[]
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, assetType } = body

  if (!name || !assetType) {
    return { success: false, error: 'Missing name or assetType' }
  }

  const cwd = process.cwd()
  const manifestPath = join(cwd, 'assets.json')
  let manifest: Manifest = { version: 1, generated_at: '', assets: [] }

  if (existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as Manifest
    } catch { /* ignore */ }
  }

  // Check if already registered
  const existing = manifest.assets.find(a => a.name === name)
  if (existing) {
    // Update timestamp
    existing.encoded_at = new Date().toISOString()
    existing.assetType = assetType
  } else {
    // Add new entry
    const entry: ManifestEntry = {
      name,
      assetType,
      encoded_at: new Date().toISOString(),
      cdn_urls: [],
      formats: {},
    }

    if (assetType === 'svga') {
      entry.formats = { json: `${name}/${name}.json` }
    } else {
      entry.formats = { webm: `${name}/playable.webm` }
    }

    manifest.assets.push(entry)
  }

  manifest.generated_at = new Date().toISOString()
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2))

  return { success: true }
})
