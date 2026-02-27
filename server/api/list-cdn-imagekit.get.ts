// server/api/list-cdn-imagekit.get.ts
// Lists existing files from ImageKit using their Files API.

import { defineEventHandler, getQuery } from 'h3'
import { loadEnvVar } from '../utils/env'
import { getCredentials } from '../utils/db'
import type { CdnListResponse, CdnObjectItem } from '../utils/cdn-types'
import { inferIsImageOrVideo } from '../utils/cdn-types'

interface ImageKitFile {
  name: string
  filePath: string
  url: string
  size?: number
  createdAt?: string
  thumbnail?: string
  type?: string
  mime?: string
}

interface ImageKitListResponse {
  success?: boolean
  message?: string
  // In practice ImageKit returns an array; keep this flexible.
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const prefix = typeof query.prefix === 'string' ? query.prefix : '/'
  const cursor = typeof query.cursor === 'string' ? query.cursor : undefined
  const search = typeof query.search === 'string' ? query.search : undefined

  const imagekitConfig = getCredentials('imagekit')
  const privateKey = imagekitConfig.privateKey || loadEnvVar('IMAGEKIT_PRIVATE_KEY')
  const urlEndpoint = imagekitConfig.endpoint || loadEnvVar('IMAGEKIT_URL_ENDPOINT')

  if (!privateKey || !urlEndpoint) {
    const res: CdnListResponse = {
      success: false,
      items: [],
      error: 'ImageKit credentials are not configured. Please set IMAGEKIT_PRIVATE_KEY and IMAGEKIT_URL_ENDPOINT.',
    }
    return res
  }

  try {
    const normalizedPrefix = normalizePrefix(prefix)

    // ImageKit List Files API: https://docs.imagekit.io/api-reference/media-api/list-and-search-files
    const searchParams = new URLSearchParams()
    searchParams.set('path', normalizedPrefix === '/' ? '/' : normalizedPrefix)
    if (cursor) {
      searchParams.set('skip', cursor)
    }
    // Limit page size to keep responses reasonable
    searchParams.set('limit', '50')

    if (search) {
      // Basic contains search on name or path using ImageKit search syntax
      const safe = search.replace(/"/g, '\\"')
      const queryParts = [
        `name:*${safe}*`,
        ` OR `,
        `path:*${safe}*`,
      ]
      searchParams.set('searchQuery', queryParts.join(''))
    }

    const authHeader = 'Basic ' + Buffer.from(privateKey + ':').toString('base64')
    const url = `https://api.imagekit.io/v1/files?${searchParams.toString()}`

    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
      },
    })

    if (!resp.ok) {
      const text = await resp.text()
      const res: CdnListResponse = {
        success: false,
        items: [],
        error: `ImageKit list failed: ${resp.status} ${resp.statusText} — ${text}`,
      }
      return res
    }

    const data = await resp.json() as ImageKitListResponse | ImageKitFile[]

    const files: ImageKitFile[] = Array.isArray(data) ? data : []

    const items: CdnObjectItem[] = files.map((f) => ({
      name: f.name,
      path: f.filePath,
      url: f.url,
      size: f.size,
      lastModified: f.createdAt,
      isImageOrVideo: inferIsImageOrVideo(f.filePath || f.url),
      thumbnailUrl: f.thumbnail,
      provider: 'imagekit',
    }))

    // ImageKit pagination: we used `skip` — since the API returns total count,
    // for simplicity we treat cursor as "next skip" (current skip + items.length).
    const currentSkip = cursor ? Number(cursor) || 0 : 0
    const nextCursor = items.length === 50 ? String(currentSkip + items.length) : undefined

    const res: CdnListResponse = {
      success: true,
      items,
      nextCursor,
    }

    return res
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const res: CdnListResponse = {
      success: false,
      items: [],
      error: `ImageKit list error: ${msg}`,
    }
    return res
  }
})

function normalizePrefix(p: string): string {
  let clean = (p || '/').trim().replace(/\/+/g, '/')
  if (!clean.startsWith('/')) clean = '/' + clean
  if (clean !== '/' && clean.endsWith('/')) clean = clean.slice(0, -1)
  return clean
}

