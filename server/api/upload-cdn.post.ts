// server/api/upload-cdn.post.ts
// Uploads processed assets to Cloudflare R2 or ImageKit
import { execSync } from 'child_process'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { writeFile } from 'fs/promises'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, type, provider, path: cdnPath } = body

  if (!name || !provider) {
    return { success: false, error: 'Missing name or provider' }
  }

  const cwd = process.cwd()
  const outputDir = join(cwd, 'output')

  if (provider === 'r2') {
    return await uploadToR2(name, type || 'normal', cwd, outputDir)
  } else if (provider === 'imagekit') {
    return await uploadToImageKit(name, type || 'normal', cwd, outputDir, cdnPath)
  }

  return { success: false, error: `Unknown provider: ${provider}` }
})

async function uploadToR2(name: string, type: string, cwd: string, outputDir: string) {
  const scriptPath = join(cwd, 'scripts', 'upload-r2.sh')

  if (!existsSync(scriptPath)) {
    return { success: false, error: 'upload-r2.sh not found' }
  }

  try {
    // Check if wrangler is available
    execSync('command -v wrangler', { encoding: 'utf-8' })
  } catch {
    return {
      success: false,
      error: 'wrangler CLI not installed. Run: npm install -g wrangler && wrangler login'
    }
  }

  try {
    const cmd = `bash "${scriptPath}" --name "${name}" --type "${type}" --output-dir "${outputDir}"`
    const log = execSync(cmd, {
      cwd,
      timeout: 120000,
      encoding: 'utf-8',
      env: { ...process.env }
    })

    // Update assets.json manifest
    await updateManifest(cwd, name, type)

    return { success: true, log }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'R2 upload failed',
      log: err.stdout || err.stderr || ''
    }
  }
}

async function uploadToImageKit(name: string, type: string, cwd: string, outputDir: string, cdnPath?: string) {
  // Load ImageKit settings from .env
  const envPath = join(cwd, '.env')
  let privateKey = process.env.IMAGEKIT_PRIVATE_KEY || ''

  if (!privateKey && existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8')
    const match = envContent.match(/IMAGEKIT_PRIVATE_KEY=(.+)/)
    if (match) privateKey = match[1].trim()
  }

  if (!privateKey) {
    return { success: false, error: 'ImageKit private key not configured. Go to Settings.' }
  }

  const files = [
    { local: join(outputDir, 'webm', name, 'playable.webm'), remote: `${cdnPath || name}/playable.webm` },
    { local: join(outputDir, 'webm', name, 'thumbnail.png'), remote: `${cdnPath || name}/thumbnail.png` },
  ]

  const results = []
  for (const f of files) {
    if (!existsSync(f.local)) continue

    try {
      const fileBuffer = readFileSync(f.local)
      const base64 = fileBuffer.toString('base64')

      const resp = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(privateKey + ':').toString('base64'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file: base64,
          fileName: f.remote.split('/').pop(),
          folder: '/' + f.remote.split('/').slice(0, -1).join('/')
        })
      })

      if (resp.ok) {
        results.push(`✅ ${f.remote}`)
      } else {
        results.push(`❌ ${f.remote}: ${resp.statusText}`)
      }
    } catch (err: any) {
      results.push(`❌ ${f.remote}: ${err.message}`)
    }
  }

  await updateManifest(cwd, name, type)

  return { success: true, log: results.join('\n') }
}

async function updateManifest(cwd: string, name: string, type: string) {
  const manifestPath = join(cwd, 'assets.json')
  let manifest = { version: 1, generated_at: '', assets: [] as any[] }

  if (existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    } catch { /* ignore parse errors */ }
  }

  const prefix = type === 'vip' ? 'room/gifts/vip-gifts' : 'room/gifts/normal'

  // Remove existing entry
  manifest.assets = manifest.assets.filter((a: any) => a.name !== name)
  manifest.assets.push({
    name,
    type,
    formats: {
      webm: `${prefix}/${name}/playable.webm`,
      hevc: `${prefix}/${name}/playable.mov`
    },
    thumbnail: `${prefix}/${name}/thumbnail.png`,
    encoded_at: new Date().toISOString()
  })
  manifest.generated_at = new Date().toISOString()

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2))
}
