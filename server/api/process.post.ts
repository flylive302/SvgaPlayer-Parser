// server/api/process.post.ts
// Triggers encoding via shell scripts (encode-webm.sh) or SVGA parsing
import { execSync } from 'child_process'
import { join } from 'path'
import { existsSync } from 'fs'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { filename, outputName, alphaSide, invert, type } = body

  if (!filename || !outputName) {
    return { success: false, error: 'Missing filename or outputName' }
  }

  const cwd = process.cwd()
  const rawPath = join(cwd, 'raw', filename)

  if (!existsSync(rawPath)) {
    return { success: false, error: `File not found: ${rawPath}` }
  }

  // Handle SVGA files differently
  if (type === 'svga') {
    return {
      success: true,
      log: 'SVGA files are parsed client-side and saved as JSON. No server encoding needed.',
      type: 'svga'
    }
  }

  // MP4: Run WebM encoder
  const scriptPath = join(cwd, 'scripts', 'encode-webm.sh')
  const outputDir = join(cwd, 'output')
  const webmDir = join(outputDir, 'webm', outputName)
  const webmOutput = join(webmDir, 'playable.webm')
  const thumbOutput = join(webmDir, 'thumbnail.png')

  const invertFlag = invert ? '--invert' : ''

  try {
    // Encode WebM
    const cmd = `bash "${scriptPath}" -i "${rawPath}" -o "${webmOutput}" --alpha-side "${alphaSide || 'right'}" ${invertFlag}`

    console.log('Running:', cmd)
    const log = execSync(cmd, {
      cwd,
      timeout: 300000, // 5 min timeout
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    })

    // Generate thumbnail
    let thumbLog = ''
    try {
      const fullWidth = execSync(
        `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "${rawPath}"`,
        { encoding: 'utf-8' }
      ).trim()

      const [w, h] = fullWidth.split('x').map(Number)
      const halfW = Math.floor(w / 2)
      const cropX = alphaSide === 'left' ? halfW : 0

      execSync(
        `ffmpeg -y -hide_banner -loglevel warning -i "${rawPath}" ` +
        `-vf "crop=${halfW}:${h}:${cropX}:0,scale=512:512:force_original_aspect_ratio=decrease" ` +
        `-ss 1 -frames:v 1 "${thumbOutput}"`,
        { cwd, encoding: 'utf-8' }
      )
      thumbLog = '\n✅ Thumbnail generated'
    } catch (e) {
      thumbLog = '\n⚠️ Thumbnail generation failed (non-critical)'
    }

    return {
      success: true,
      log: log + thumbLog,
      webm: webmOutput,
      thumbnail: existsSync(thumbOutput) ? thumbOutput : null
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Encoding failed',
      log: err.stdout || err.stderr || err.message
    }
  }
})
