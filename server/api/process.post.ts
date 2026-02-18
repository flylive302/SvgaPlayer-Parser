// server/api/process.post.ts
// Triggers video encoding via shell scripts (encode-webm.sh)
import { defineEventHandler, readBody } from 'h3'
import { exec } from 'child_process'
import { join } from 'path'
import { access } from 'fs/promises'

function execAsync(cmd: string, options: { cwd: string; timeout: number }): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { ...options, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        const err = error as any
        err.stdout = stdout
        err.stderr = stderr
        reject(err)
      } else {
        resolve(stdout)
      }
    })
  })
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { filename, outputName, alphaSide, invert } = body

  if (!filename || !outputName) {
    return { success: false, error: 'Missing filename or outputName' }
  }

  const cwd = process.cwd()
  const rawPath = join(cwd, 'raw', filename)

  try {
    await access(rawPath)
  } catch {
    return { success: false, error: `File not found: ${rawPath}` }
  }

  // MP4: Run WebM encoder
  const scriptPath = join(cwd, 'scripts', 'encode-webm.sh')
  const outputDir = join(cwd, 'output')
  const webmDir = join(outputDir, 'webm', outputName)
  const webmOutput = join(webmDir, 'playable.webm')
  const thumbOutput = join(webmDir, 'thumbnail.png')

  const invertFlag = invert ? '--invert' : ''

  try {
    // Encode WebM (async — does not block the server)
    const cmd = `bash "${scriptPath}" -i "${rawPath}" -o "${webmOutput}" --alpha-side "${alphaSide || 'right'}" ${invertFlag}`

    console.log('Running:', cmd)
    const log = await execAsync(cmd, { cwd, timeout: 300000 })

    // Generate thumbnail
    let thumbLog = ''
    try {
      const fullWidth = (await execAsync(
        `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "${rawPath}"`,
        { cwd, timeout: 30000 }
      )).trim()

      const [w, h] = fullWidth.split('x').map(Number)
      const halfW = Math.floor(w / 2)
      const cropX = alphaSide === 'left' ? halfW : 0

      await execAsync(
        `ffmpeg -y -hide_banner -loglevel warning -i "${rawPath}" ` +
        `-vf "crop=${halfW}:${h}:${cropX}:0,scale=512:512:force_original_aspect_ratio=decrease" ` +
        `-ss 1 -frames:v 1 "${thumbOutput}"`,
        { cwd, timeout: 30000 }
      )
      thumbLog = '\n✅ Thumbnail generated'
    } catch {
      thumbLog = '\n⚠️ Thumbnail generation failed (non-critical)'
    }

    let hasThumb = false
    try { await access(thumbOutput); hasThumb = true } catch {}

    return {
      success: true,
      log: log + thumbLog,
      webm: webmOutput,
      thumbnail: hasThumb ? thumbOutput : null
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Encoding failed',
      log: err.stdout || err.stderr || err.message
    }
  }
})

