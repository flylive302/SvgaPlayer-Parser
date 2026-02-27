// server/api/hevc-download-url.get.ts
// Polling endpoint to check when an encoded HEVC .mov is available on CDN and
// return a direct download URL.
import { defineEventHandler, getQuery, createError } from 'h3'
import { getCredentials } from '../utils/db'
import { loadEnvVar } from '../utils/env'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const assetName = String(query.assetName || '').trim()
  const cdnProvider = String(query.cdnProvider || 'r2').trim() || 'r2'
  let cdnPath = (query.cdnPath as string | undefined) ?? '/'

  if (!assetName) {
    throw createError({ statusCode: 400, statusMessage: 'assetName is required' })
  }

  if (cdnProvider !== 'r2') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only r2 provider is supported for HEVC download checks at the moment.',
    })
  }

  // Normalise cdnPath similar to the encode-hevc.yml workflow
  cdnPath = cdnPath.trim()
  if (cdnPath === '') cdnPath = '/'

  let normalizedPath = cdnPath.replace(/\/+$/g, '').replace(/^\/+/g, '')
  const hasPath = normalizedPath.length > 0

  const remoteKey = hasPath ? `${normalizedPath}/${assetName}/playable.mov` : `${assetName}/playable.mov`

  // Build the public URL for the HEVC file on R2.
  const r2Config = getCredentials('r2')
  const accountId = r2Config.accountId || loadEnvVar('CLOUDFLARE_ACCOUNT_ID')
  const bucket = r2Config.bucket || loadEnvVar('R2_BUCKET_NAME') || 'flylive-assets'
  const customDomain = r2Config.domain || loadEnvVar('R2_CUSTOM_DOMAIN')

  if (!accountId || !bucket) {
    throw createError({
      statusCode: 500,
      statusMessage: 'R2 credentials not configured for HEVC download check',
    })
  }

  const baseUrl = (customDomain || `https://${accountId}.r2.cloudflarestorage.com/${bucket}`).replace(/\/+$/g, '')
  const hevcUrl = `${baseUrl}/${remoteKey}`

  try {
    const resp = await fetch(hevcUrl, { method: 'HEAD' })

    if (resp.ok) {
      return { ready: true, url: hevcUrl }
    }

    if (resp.status === 404) {
      return { ready: false }
    }

    return {
      ready: false,
      error: `Unexpected status from CDN: ${resp.status} ${resp.statusText}`,
    }
  } catch (err: any) {
    return {
      ready: false,
      error: err?.message || 'Failed to check HEVC URL',
    }
  }
}

