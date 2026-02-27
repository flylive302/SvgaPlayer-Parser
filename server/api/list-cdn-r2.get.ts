// server/api/list-cdn-r2.get.ts
// Lists existing objects from a Cloudflare R2 bucket using the R2 Objects API.

import { defineEventHandler, getQuery } from 'h3'
import { loadEnvVar } from '../utils/env'
import { getCredentials } from '../utils/db'
import type { CdnListResponse, CdnObjectItem } from '../utils/cdn-types'
import { inferIsImageOrVideo, inferThumbnailKey } from '../utils/cdn-types'

interface R2ApiObject {
  key: string
  size?: number
  uploaded?: string
}

interface R2ApiResult {
  objects?: R2ApiObject[]
  cursor?: string
}

interface R2ApiResponse {
  success: boolean
  result?: R2ApiResult
  errors?: unknown[]
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const prefix = typeof query.prefix === 'string' ? query.prefix : '/'
  const cursor = typeof query.cursor === 'string' ? query.cursor : undefined

  const r2Config = getCredentials('r2')
  const accountId = r2Config.accountId || loadEnvVar('CLOUDFLARE_ACCOUNT_ID')
  const apiToken = r2Config.apiToken || loadEnvVar('CLOUDFLARE_API_TOKEN')
  const bucket = r2Config.bucket || loadEnvVar('R2_BUCKET_NAME') || 'flylive-assets'
  const customDomain = r2Config.domain || loadEnvVar('R2_CUSTOM_DOMAIN')

  if (!accountId || !apiToken) {
    const res: CdnListResponse = {
      success: false,
      items: [],
      error: 'Cloudflare R2 credentials are not configured. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.',
    }
    return res
  }

  try {
    const searchParams = new URLSearchParams()
    const normalizedPrefix = normalizePrefix(prefix)
    if (normalizedPrefix && normalizedPrefix !== '/') {
      // R2 Objects API expects a key prefix without leading slash
      searchParams.set('prefix', normalizedPrefix.slice(1))
    }
    if (cursor) {
      searchParams.set('cursor', cursor)
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${encodeURIComponent(bucket)}/objects?${searchParams.toString()}`

    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    })

    if (!resp.ok) {
      const text = await resp.text()
      const res: CdnListResponse = {
        success: false,
        items: [],
        error: `R2 list failed: ${resp.status} ${resp.statusText} — ${text}`,
      }
      return res
    }

    const data = await resp.json() as R2ApiResponse
    if (!data.success) {
      const res: CdnListResponse = {
        success: false,
        items: [],
        error: 'R2 list failed: API returned success=false',
      }
      return res
    }

    const result = data.result
    const objects = result?.objects || []

    const items: CdnObjectItem[] = objects
      .filter(obj => !!obj.key)
      .map((obj) => {
        const key = obj.key
        const urlPath = key
        const cdnUrl = customDomain ? `${customDomain.replace(/\/+$/, '')}/${urlPath}` : urlPath

        const thumbKey = inferThumbnailKey(key)
        const thumbUrl = thumbKey
          ? (customDomain ? `${customDomain.replace(/\/+$/, '')}/${thumbKey}` : thumbKey)
          : undefined

        return {
          name: key.split('/').pop() || key,
          path: `/${key}`,
          url: cdnUrl,
          size: obj.size,
          lastModified: obj.uploaded,
          isImageOrVideo: inferIsImageOrVideo(key),
          thumbnailUrl: thumbUrl,
          provider: 'r2',
        }
      })

    const res: CdnListResponse = {
      success: true,
      items,
      nextCursor: result?.cursor,
    }

    return res
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const res: CdnListResponse = {
      success: false,
      items: [],
      error: `R2 list error: ${msg}`,
    }
    return res
  }
})

function normalizePrefix(p: string): string {
  let clean = (p || '/').trim().replace(/\/+/g, '/')
  if (!clean.startsWith('/')) clean = '/' + clean
  return clean
}

