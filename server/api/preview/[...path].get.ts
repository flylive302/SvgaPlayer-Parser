// server/api/preview/[...path].get.ts
// Serves files from output/ directory for preview in the browser
import { defineEventHandler, getRouterParam, createError, setResponseHeader } from 'h3'
import { join } from 'path'
import { existsSync, readFileSync, statSync } from 'fs'

const MIME_TYPES: Record<string, string> = {
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.json': 'application/json',
}

export default defineEventHandler(async (event) => {
  const pathParam = getRouterParam(event, 'path')
  if (!pathParam) {
    throw createError({ statusCode: 400, statusMessage: 'Missing path' })
  }

  // Sanitize: prevent directory traversal
  const safePath = pathParam.replace(/\.\./g, '').replace(/^\/+/, '')
  const filePath = join(process.cwd(), 'output', safePath)

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, statusMessage: `File not found: ${safePath}` })
  }

  const stat = statSync(filePath)
  if (stat.isDirectory()) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot serve directory' })
  }

  const ext = '.' + filePath.split('.').pop()?.toLowerCase()
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'

  setResponseHeader(event, 'Content-Type', contentType)
  setResponseHeader(event, 'Content-Length', stat.size)
  setResponseHeader(event, 'Cache-Control', 'no-cache')

  return readFileSync(filePath)
})
