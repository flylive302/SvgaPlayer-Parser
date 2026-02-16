// server/api/assets.get.ts
// Returns current asset manifest
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async () => {
  const manifestPath = join(process.cwd(), 'assets.json')

  if (!existsSync(manifestPath)) {
    return { version: 1, generated_at: '', assets: [] }
  }

  try {
    const content = readFileSync(manifestPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return { version: 1, generated_at: '', assets: [] }
  }
})
