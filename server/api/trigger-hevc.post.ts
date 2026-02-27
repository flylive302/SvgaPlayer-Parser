// server/api/trigger-hevc.post.ts
// Triggers GitHub Actions workflow to encode HEVC from a WebM source.
// Supports two modes:
// 1) Manifest mode (existing): look up the WebM CDN URL from assets.json by assetName.
// 2) Direct mode (new): accept an explicit webmUrl and skip manifest lookup.
import { defineEventHandler, readBody, createError } from 'h3'
import { loadEnvVar } from '../utils/env'
import { readManifest } from '../utils/manifest'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { assetName, cdnProvider, cdnPath, webmUrl } = body as {
    assetName?: string
    cdnProvider?: string
    cdnPath?: string
    webmUrl?: string
  }

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

  // Resolve the WebM CDN URL to use for encoding.
  // Prefer an explicit webmUrl if provided; otherwise fall back to manifest lookup.
  let webmCdnUrl: string | undefined

  if (webmUrl) {
    webmCdnUrl = webmUrl
  } else {
    // Manifest mode (existing behaviour)
    const manifest = await readManifest()
    const asset = manifest.assets.find((a) => a.name === assetName)
    if (!asset) {
      throw createError({ statusCode: 404, statusMessage: `Asset "${assetName}" not found in manifest` })
    }

    webmCdnUrl = (asset.cdn_urls || []).find((url: string) => url.endsWith('.webm'))
    if (!webmCdnUrl) {
      throw createError({
        statusCode: 400,
        statusMessage: 'WebM not uploaded to CDN yet. Upload to CDN first, then trigger HEVC encoding.',
      })
    }
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

