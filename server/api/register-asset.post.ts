// server/api/register-asset.post.ts
// Auto-registers a newly converted/parsed asset in assets.json
import { defineEventHandler, readBody } from 'h3'
import { upsertManifestEntry } from '../utils/manifest'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, assetType } = body

  if (!name || !assetType) {
    return { success: false, error: 'Missing name or assetType' }
  }

  const formats: Record<string, string> = assetType === 'svga'
    ? { json: `${name}/${name}.json` }
    : { webm: `${name}/playable.webm` }

  await upsertManifestEntry(name, (existing) => ({
    ...existing,
    name,
    assetType,
    encoded_at: new Date().toISOString(),
    formats: existing.cdn_urls.length > 0 ? existing.formats : formats,
  }))

  return { success: true }
})

