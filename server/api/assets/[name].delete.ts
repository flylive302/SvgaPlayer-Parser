// server/api/assets/[name].delete.ts
// Deletes an asset: removes files from output/, removes CDN assets, and removes entry from assets.json
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { join } from 'path'
import { existsSync, readFileSync, rmSync } from 'fs'
import { writeFile } from 'fs/promises'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Missing asset name' })
  }

  const cwd = process.cwd()
  const manifestPath = join(cwd, 'assets.json')

  // Read existing manifest to get CDN URLs before deleting
  let cdnUrls: string[] = []
  let assetEntry: any = null
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
      assetEntry = (manifest.assets || []).find((a: any) => a.name === name)
      if (assetEntry) {
        cdnUrls = assetEntry.cdn_urls || []
      }
    } catch { /* ignore */ }
  }

  // 1. Delete from CDN
  const cdnResults: string[] = []
  if (cdnUrls.length > 0) {
    for (const url of cdnUrls) {
      const result = await deleteCdnAsset(url, cwd)
      cdnResults.push(result)
    }
  }

  // 2. Remove local output directories
  const webmDir = join(cwd, 'output', 'webm', name)
  const hevcDir = join(cwd, 'output', 'hevc', name)
  const svgaDir = join(cwd, 'output', 'svga', name)
  const rawFiles = [join(cwd, 'raw', `${name}.mp4`), join(cwd, 'raw', `${name}.svga`)]

  let deletedPaths: string[] = []

  for (const dir of [webmDir, hevcDir, svgaDir]) {
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true })
      deletedPaths.push(dir)
    }
  }

  for (const f of rawFiles) {
    if (existsSync(f)) {
      rmSync(f, { force: true })
      deletedPaths.push(f)
    }
  }

  // 3. Remove from manifest
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
      manifest.assets = (manifest.assets || []).filter((a: any) => a.name !== name)
      manifest.generated_at = new Date().toISOString()
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
    } catch { /* ignore */ }
  }

  return {
    success: true,
    deleted: deletedPaths,
    cdnDeleted: cdnResults,
    message: `Asset "${name}" deleted`,
  }
})

// ── CDN Delete Helpers ──────────────────────────────────────────────────

function loadEnvVar(cwd: string, key: string): string {
  if (process.env[key]) return process.env[key] as string

  const envPath = join(cwd, '.env')
  if (!existsSync(envPath)) return ''

  const content = readFileSync(envPath, 'utf-8')
  const regex = new RegExp(key + '="?([^"\\n]+)"?')
  const match = content.match(regex)
  return match ? match[1].trim() : ''
}

/**
 * Delete a CDN asset by its URL.
 * Detects the CDN provider from the URL and calls the appropriate delete API.
 */
async function deleteCdnAsset(url: string, cwd: string): Promise<string> {
  try {
    if (url.includes('imagekit.io')) {
      return await deleteFromImageKit(url, cwd)
    } else {
      // Assume R2 (custom domain or direct)
      return await deleteFromR2(url, cwd)
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return `❌ CDN delete failed for ${url}: ${msg}`
  }
}

/**
 * Delete an object from Cloudflare R2 via S3-compatible API.
 * Extracts the object key from the URL.
 */
async function deleteFromR2(url: string, cwd: string): Promise<string> {
  const accountId = loadEnvVar(cwd, 'CLOUDFLARE_ACCOUNT_ID')
  const apiToken = loadEnvVar(cwd, 'CLOUDFLARE_API_TOKEN')
  const bucket = loadEnvVar(cwd, 'R2_BUCKET_NAME') || 'flylive-assets'
  const customDomain = loadEnvVar(cwd, 'R2_CUSTOM_DOMAIN') || ''

  if (!accountId || !apiToken) {
    return `⚠️ R2 credentials not configured, skipping CDN delete for: ${url}`
  }

  // Extract the object key from the URL
  let objectKey = ''
  if (customDomain && url.startsWith(customDomain)) {
    objectKey = url.replace(customDomain + '/', '')
  } else {
    // Try extracting path
    try {
      const parsed = new URL(url)
      objectKey = parsed.pathname.replace(/^\//, '')
    } catch {
      objectKey = url
    }
  }

  if (!objectKey) {
    return `⚠️ Could not determine R2 key for: ${url}`
  }

  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${objectKey}`

  const resp = await fetch(apiUrl, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
    },
  })

  if (resp.ok) {
    return `✅ R2 deleted: ${objectKey}`
  } else {
    const errText = await resp.text()
    return `❌ R2 delete failed (${resp.status}): ${objectKey} — ${errText}`
  }
}

/**
 * Delete a file from ImageKit.
 * First lists files to find the fileId, then deletes by fileId.
 */
async function deleteFromImageKit(url: string, cwd: string): Promise<string> {
  const privateKey = loadEnvVar(cwd, 'IMAGEKIT_PRIVATE_KEY')

  if (!privateKey) {
    return `⚠️ ImageKit credentials not configured, skipping CDN delete for: ${url}`
  }

  const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64')

  // Extract the file path from the URL (e.g., /room/gifts/king/playable.webm)
  let filePath = ''
  try {
    const parsed = new URL(url)
    filePath = parsed.pathname // e.g., /room/gifts/king/playable.webm
  } catch {
    filePath = url
  }

  // Search for the file by path to get the fileId
  const searchUrl = `https://api.imagekit.io/v1/files?searchQuery=${encodeURIComponent(`filePath="${filePath}"`)}`

  const searchResp = await fetch(searchUrl, {
    method: 'GET',
    headers: { 'Authorization': authHeader },
  })

  if (!searchResp.ok) {
    const errText = await searchResp.text()
    return `❌ ImageKit search failed (${searchResp.status}): ${errText}`
  }

  const files = await searchResp.json() as Array<{ fileId: string; filePath: string }>

  if (!files || files.length === 0) {
    return `⚠️ ImageKit: file not found on CDN: ${filePath}`
  }

  // Delete by fileId
  const fileId = files[0].fileId
  const deleteResp = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
    method: 'DELETE',
    headers: { 'Authorization': authHeader },
  })

  if (deleteResp.ok || deleteResp.status === 204) {
    return `✅ ImageKit deleted: ${filePath}`
  } else {
    const errText = await deleteResp.text()
    return `❌ ImageKit delete failed (${deleteResp.status}): ${filePath} — ${errText}`
  }
}
