// server/api/upload-cdn.post.ts
// Uploads processed assets to Cloudflare R2 (S3 API) or ImageKit (REST API)
// Supports separate CDN targets for asset vs thumbnail, and custom cdnPath
import { defineEventHandler, readBody } from 'h3'
import { join, extname, basename, resolve, sep } from 'path'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { loadEnvVar } from '../utils/env'
import { getCredentials } from '../utils/db'
import { upsertManifestEntry } from '../utils/manifest'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const {
    name,
    provider,
    thumbProvider,
    cdnPath,
    assetType,
    // Raw upload mode (used by /cdn-upload page)
    filePath,
    remotePath,
    assetName,
    filename,
  } = body as {
    name?: string
    provider?: string
    thumbProvider?: string
    cdnPath?: string
    assetType?: string
    filePath?: string
    remotePath?: string
    assetName?: string
    filename?: string
  }

  if (!provider) {
    return { success: false, error: 'Missing provider' }
  }

  const cwd = process.cwd()

  // ── Mode 1: processed assets from output/ (existing behaviour) ────────────
  if (name) {
    const outputDir = join(cwd, 'output')
    const normalizedPath = normalizeCdnPath(cdnPath || '/')

    const { assetFiles, thumbnailFiles } = collectFiles(outputDir, name, normalizedPath, assetType || 'video')

    const results: string[] = []
    const urls: string[] = []

    // Upload asset files to the asset provider
    for (const f of assetFiles) {
      const result = await uploadFile(f, provider, cwd)
      results.push(result.msg)
      if (result.url) urls.push(result.url)
    }

    // Upload thumbnail files to the thumbnail provider (may be same or different)
    const effectiveThumbProvider = thumbProvider || provider
    for (const f of thumbnailFiles) {
      const result = await uploadFile(f, effectiveThumbProvider, cwd)
      results.push(result.msg)
      if (result.url) urls.push(result.url)
    }

    // Update manifest
    await updateManifest(cwd, name, normalizedPath, assetType || 'video', urls)

    return {
      success: results.some(r => r.startsWith('✅')),
      log: results.join('\n'),
      urls,
      url: urls[0],
    }
  }

  // ── Mode 2: raw file upload from arbitrary path (CDN Upload page) ────────
  if (filePath && remotePath) {
    const results: string[] = []
    const urls: string[] = []

    const normalizedPath = normalizeCdnPath(remotePath || '/')
    const rawDir = join(cwd, 'raw')
    const resolvedLocal = resolve(cwd, filePath)
    const allowedPrefix = rawDir.endsWith(sep) ? rawDir : rawDir + sep
    if (!resolvedLocal.startsWith(allowedPrefix)) {
      return { success: false, error: 'Invalid filePath (must be under raw/)' }
    }
    const localAbsolutePath = resolvedLocal

    const baseName = filename || basename(filePath)
    const ext = extname(baseName)
    const ct = getContentType(ext)

    // Build remote key similar to processed assets:
    // "/" -> "<filename>"
    // "/folder" -> "folder/<filename>"
    const prefix = normalizedPath === '/' ? '' : `${normalizedPath.slice(1)}/`
    const remoteKey = `${prefix}${baseName}`

    const uploadFileDescriptor: UploadFile = {
      local: localAbsolutePath,
      remote: remoteKey,
      ct,
    }

    const result = await uploadFile(uploadFileDescriptor, provider, cwd)
    results.push(result.msg)
    if (result.url) urls.push(result.url)

    return {
      success: results.some(r => r.startsWith('✅')),
      log: results.join('\n'),
      urls,
      url: urls[0],
      // Echo back some context that callers might find useful
      assetName: assetName || baseName,
      remoteKey,
    }
  }

  return {
    success: false,
    error: 'Missing name or filePath/remotePath',
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────

function normalizeCdnPath(p: string): string {
  let clean = p.trim().replace(/\/+/g, '/').replace(/\/$/, '')
  if (!clean.startsWith('/')) clean = '/' + clean
  if (clean === '') clean = '/'
  return clean
}

// loadEnvVar imported from ../utils/env

// ── Collect files to upload ──────────────────────────────────────────────
interface UploadFile {
  local: string
  remote: string
  ct: string
}

function findThumbnail(dir: string): { filename: string, ext: string } | null {
  if (!existsSync(dir)) return null
  try {
    const files = readdirSync(dir)
    const thumb = files.find(f => f.startsWith('thumbnail.'))
    if (thumb) {
      return { filename: thumb, ext: extname(thumb) }
    }
  } catch { /* ignore */ }
  return null
}

function getContentType(ext: string): string {
  const map: Record<string, string> = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
    '.svg': 'image/svg+xml', '.json': 'application/json',
    '.webm': 'video/webm', '.mov': 'video/quicktime',
  }
  return map[ext] || 'application/octet-stream'
}

function collectFiles(
  outputDir: string,
  name: string,
  cdnPath: string,
  assetType: string
): { assetFiles: UploadFile[], thumbnailFiles: UploadFile[] } {
  // cdnPath like "/" or "/room/gifts/vip" — build remote prefix
  const prefix = cdnPath === '/' ? name : `${cdnPath.slice(1)}/${name}`

  const assetFiles: UploadFile[] = []
  const thumbnailFiles: UploadFile[] = []

  if (assetType === 'svga') {
    const svgaDir = join(outputDir, 'svga', name)
    assetFiles.push({
      local: join(svgaDir, `${name}.json`),
      remote: `${prefix}/${name}.json`,
      ct: 'application/json',
    })

    // Check for thumbnail
    const thumb = findThumbnail(svgaDir)
    if (thumb) {
      thumbnailFiles.push({
        local: join(svgaDir, thumb.filename),
        remote: `${prefix}/${thumb.filename}`,
        ct: getContentType(thumb.ext),
      })
    }
  } else {
    // Video (webm)
    const webmDir = join(outputDir, 'webm', name)
    assetFiles.push({
      local: join(webmDir, 'playable.webm'),
      remote: `${prefix}/playable.webm`,
      ct: 'video/webm',
    })

    // Check for thumbnail (any format)
    const thumb = findThumbnail(webmDir)
    if (thumb) {
      thumbnailFiles.push({
        local: join(webmDir, thumb.filename),
        remote: `${prefix}/${thumb.filename}`,
        ct: getContentType(thumb.ext),
      })
    }
  }

  return { assetFiles, thumbnailFiles }
}

// ── Upload a single file ─────────────────────────────────────────────────
async function uploadFile(
  f: UploadFile,
  provider: string,
  cwd: string
): Promise<{ msg: string, url?: string }> {
  if (!existsSync(f.local)) {
    return { msg: `⚠️ Skipped (not found): ${f.remote}` }
  }

  if (provider === 'r2') {
    return await uploadFileToR2(f, cwd)
  } else if (provider === 'imagekit') {
    return await uploadFileToImageKit(f, cwd)
  }

  return { msg: `❌ Unknown provider: ${provider}` }
}

// ── R2 Upload ────────────────────────────────────────────────────────────
async function uploadFileToR2(f: UploadFile, cwd: string): Promise<{ msg: string, url?: string }> {
  const r2Config = getCredentials('r2')
  const accountId = r2Config.accountId || loadEnvVar('CLOUDFLARE_ACCOUNT_ID')
  const apiToken = r2Config.apiToken || loadEnvVar('CLOUDFLARE_API_TOKEN')
  const bucket = r2Config.bucket || loadEnvVar('R2_BUCKET_NAME') || 'flylive-assets'
  const customDomain = r2Config.domain || loadEnvVar('R2_CUSTOM_DOMAIN')

  if (!accountId || !apiToken) {
    return { msg: '❌ Cloudflare Account ID or API Token not configured. Go to Settings.' }
  }

  try {
    const fileBuffer = readFileSync(f.local)
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${f.remote}`

    const resp = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': f.ct,
      },
      body: new Uint8Array(fileBuffer),
    })

    if (resp.ok) {
      const cdnUrl = customDomain ? `${customDomain}/${f.remote}` : f.remote
      return { msg: `✅ R2: ${f.remote}`, url: cdnUrl }
    } else {
      const errText = await resp.text()
      return { msg: `❌ R2 ${f.remote}: ${resp.status} ${resp.statusText} — ${errText}` }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { msg: `❌ R2 ${f.remote}: ${msg}` }
  }
}

// ── ImageKit Upload ──────────────────────────────────────────────────────
async function uploadFileToImageKit(f: UploadFile, cwd: string): Promise<{ msg: string, url?: string }> {
  const imagekitConfig = getCredentials('imagekit')
  const privateKey = imagekitConfig.privateKey || loadEnvVar('IMAGEKIT_PRIVATE_KEY')
  const urlEndpoint = imagekitConfig.endpoint || loadEnvVar('IMAGEKIT_URL_ENDPOINT')

  if (!privateKey) {
    return { msg: '❌ ImageKit private key not configured. Go to Settings.' }
  }

  try {
    const fileBuffer = readFileSync(f.local)
    const base64 = fileBuffer.toString('base64')

    const folder = '/' + f.remote.split('/').slice(0, -1).join('/')
    const fileName = f.remote.split('/').pop() || f.remote

    const formBody = new URLSearchParams()
    formBody.append('file', base64)
    formBody.append('fileName', fileName)
    formBody.append('folder', folder)
    formBody.append('useUniqueFileName', 'false')

    const resp = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(privateKey + ':').toString('base64'),
      },
      body: formBody,
    })

    if (resp.ok) {
      const data = await resp.json() as Record<string, unknown>
      const cdnUrl = (data.url as string) || `${urlEndpoint}/${f.remote}`
      return { msg: `✅ ImageKit: ${f.remote}`, url: cdnUrl }
    } else {
      const errText = await resp.text()
      return { msg: `❌ ImageKit ${f.remote}: ${resp.status} — ${errText}` }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { msg: `❌ ImageKit ${f.remote}: ${msg}` }
  }
}

// ── Manifest ─────────────────────────────────────────────────────────────
// Types and read/write imported from ../utils/manifest and ../utils/types

async function updateManifest(_cwd: string, name: string, cdnPath: string, assetType: string, urls: string[]) {
  const prefix = cdnPath === '/' ? name : `${cdnPath.slice(1)}/${name}`

  const thumbUrl = urls.find(u => u.includes('thumbnail'))

  const formats: Record<string, string> = assetType === 'svga'
    ? { json: `${prefix}/${name}.json` }
    : { webm: `${prefix}/playable.webm` }

  await upsertManifestEntry(name, () => ({
    name,
    cdnPath,
    assetType,
    encoded_at: new Date().toISOString(),
    cdn_urls: urls,
    formats,
    ...(thumbUrl ? { thumbnail: thumbUrl } : {}),
  }))
}
