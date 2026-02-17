// server/api/trigger-hevc.post.ts
// Triggers GitHub Actions workflow to encode HEVC from an already-uploaded WebM
import { defineEventHandler, readBody, createError } from 'h3'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

function loadEnvVar(key: string): string {
  // Check process.env first, then .env file
  if (process.env[key]) return process.env[key]!

  const envPath = join(process.cwd(), '.env')
  if (!existsSync(envPath)) return ''

  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0) {
      const k = trimmed.substring(0, eqIdx).trim()
      if (k === key) {
        let val = trimmed.substring(eqIdx + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        return val
      }
    }
  }
  return ''
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { assetName, cdnProvider, cdnPath } = body

  if (!assetName) {
    throw createError({ statusCode: 400, statusMessage: 'assetName is required' })
  }

  // Load GitHub settings
  const githubPat = loadEnvVar('GITHUB_PAT')
  const githubRepo = loadEnvVar('GITHUB_REPO') // format: owner/repo
  if (!githubPat || !githubRepo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'GitHub PAT and repo not configured. Go to Settings to set them up.'
    })
  }

  // Find the WebM CDN URL from assets.json
  const assetsPath = join(process.cwd(), 'assets.json')
  if (!existsSync(assetsPath)) {
    throw createError({ statusCode: 404, statusMessage: 'assets.json not found' })
  }

  const manifest = JSON.parse(readFileSync(assetsPath, 'utf-8'))
  const asset = (manifest.assets || []).find((a: any) => a.name === assetName)
  if (!asset) {
    throw createError({ statusCode: 404, statusMessage: `Asset "${assetName}" not found in manifest` })
  }

  // Find the WebM CDN URL
  const webmCdnUrl = (asset.cdn_urls || []).find((url: string) =>
    url.endsWith('.webm')
  )
  if (!webmCdnUrl) {
    throw createError({
      statusCode: 400,
      statusMessage: 'WebM not uploaded to CDN yet. Upload to CDN first, then trigger HEVC encoding.'
    })
  }

  // Trigger GitHub Actions workflow
  const [owner, repo] = githubRepo.split('/')
  const workflowFile = 'encode-hevc.yml'
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${githubPat}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ref: 'master',
      inputs: {
        asset_name: assetName,
        webm_url: webmCdnUrl,
        cdn_provider: cdnProvider || 'r2',
        cdn_path: cdnPath || '/',
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: `GitHub API error: ${response.statusText}. ${errorText}`
    })
  }

  // Get the link to the Actions tab
  const actionsUrl = `https://github.com/${owner}/${repo}/actions`

  return {
    success: true,
    message: `HEVC encoding triggered! The macOS runner will download the WebM, encode to HEVC, and upload the .mov to ${cdnProvider || 'r2'}.`,
    actionsUrl,
    webmUrl: webmCdnUrl,
  }
})
