// server/api/upload.post.ts
// Handles file upload: saves raw MP4/SVGA to raw/ directory
import { defineEventHandler, readMultipartFormData } from 'h3'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  try {
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      return { success: false, error: 'No file uploaded' }
    }

    // Find the file part (the one with a filename)
    const filePart = formData.find((part) => part.filename)

    if (!filePart || !filePart.data) {
      return { success: false, error: 'No file data received' }
    }

    const rawDir = join(process.cwd(), 'raw')
    await mkdir(rawDir, { recursive: true })

    const originalName = filePart.filename || 'upload.bin'
    const originalExt = extname(originalName)
    const safeExt = originalExt.replace(/[^a-zA-Z0-9.]/g, '') || ''
    const originalBase = originalExt ? originalName.slice(0, -originalExt.length) : originalName

    const safeBase = originalBase
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '') || 'upload'

    // Always generate a unique filename to avoid collisions when uploading
    // multiple files (including folder uploads with repeated basenames).
    const safeName = `${safeBase}_${randomUUID().slice(0, 8)}${safeExt}`

    const destPath = join(rawDir, safeName)

    await writeFile(destPath, filePart.data)

    return {
      success: true,
      filename: safeName,
      originalName,
      size: filePart.data.length,
      path: destPath
    }
  } catch (err: any) {
    console.error('Upload error:', err)
    return { success: false, error: err.message || 'Upload failed' }
  }
})
