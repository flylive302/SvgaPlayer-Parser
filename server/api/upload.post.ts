// server/api/upload.post.ts
// Handles file upload: saves raw MP4/SVGA to raw/ directory
import { defineEventHandler, readMultipartFormData } from 'h3'
import { writeFile, mkdir } from 'fs/promises'
import { join, extname } from 'path'

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

    const safeName = (filePart.filename || 'upload.mp4')
      .replace(/[^a-zA-Z0-9._-]/g, '_')

    const destPath = join(rawDir, safeName)

    await writeFile(destPath, filePart.data)

    return {
      success: true,
      filename: safeName,
      size: filePart.data.length,
      path: destPath
    }
  } catch (err: any) {
    console.error('Upload error:', err)
    return { success: false, error: err.message || 'Upload failed' }
  }
})
