// server/utils/env.ts
// Shared environment variable loader — replaces 3 copy-pasted implementations
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'

/**
 * Load an environment variable, falling back to reading from .env file.
 */
export function loadEnvVar(key: string): string {
  if (process.env[key]) return process.env[key] as string

  const envPath = join(process.cwd(), '.env')
  if (!existsSync(envPath)) return ''

  const content = readFileSync(envPath, 'utf-8')
  const regex = new RegExp(key + '="?([^"\\n]+)"?')
  const match = content.match(regex)
  return match ? match[1].trim() : ''
}
