// server/api/preview/[...path].get.ts
// Serves files from output/ directory for preview in the browser
import { defineEventHandler, getRouterParam, createError, setResponseHeader } from 'h3'
import { resolve } from 'path'
import { readFile, stat } from 'fs/promises'

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

  // Secure path resolution: resolve and verify it stays within output/
  const outputDir = resolve(process.cwd(), 'output')
  const filePath = resolve(outputDir, pathParam)

  if (!filePath.startsWith(outputDir + '/')) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  let fileStat
  try {
    fileStat = await stat(filePath)
  } catch {
    throw createError({ statusCode: 404, statusMessage: `File not found` })
  }

  if (fileStat.isDirectory()) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot serve directory' })
  }

  const ext = '.' + filePath.split('.').pop()?.toLowerCase()
  const contentType = MIME_TYPES[ext] || 'application/octet-stream'

  setResponseHeader(event, 'Content-Type', contentType)
  setResponseHeader(event, 'Content-Length', fileStat.size)
  setResponseHeader(event, 'Cache-Control', 'no-cache')

  return await readFile(filePath)
})
