// server/api/upload-thumbnail.post.ts
// Handles custom thumbnail upload — saves to output/{assetType}/{name}/thumbnail.{ext}
import { defineEventHandler, readMultipartFormData } from 'h3'
import { join, extname } from 'path'
import { writeFile, mkdir } from 'fs/promises'

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  if (!formData) {
    return { success: false, error: 'No form data received' }
  }

  let fileData: Buffer | null = null
  let fileName = ''
  let name = ''
  let assetType = 'video'

  for (const field of formData) {
    if (field.name === 'file' && field.data) {
      fileData = field.data
      fileName = field.filename || 'thumbnail.png'
    } else if (field.name === 'name') {
      name = field.data.toString('utf-8')
    } else if (field.name === 'assetType') {
      assetType = field.data.toString('utf-8')
    }
  }

  if (!fileData || !name) {
    return { success: false, error: 'Missing file or name' }
  }

  // Determine extension from uploaded file
  const ext = extname(fileName).toLowerCase() || '.png'
  const validExts = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.svg']
  if (!validExts.includes(ext)) {
    return { success: false, error: `Unsupported image format: ${ext}. Accepted: ${validExts.join(', ')}` }
  }

  const cwd = process.cwd()
  const subDir = assetType === 'svga' ? 'svga' : 'webm'
  const outDir = join(cwd, 'output', subDir, name)

  try {
    await mkdir(outDir, { recursive: true })

    const thumbFilename = `thumbnail${ext}`
    const thumbPath = join(outDir, thumbFilename)
    await writeFile(thumbPath, fileData)

    // Return the relative path from output/ for preview
    const relativePath = `${subDir}/${name}/${thumbFilename}`

    return {
      success: true,
      path: relativePath,
      filename: thumbFilename,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
})
