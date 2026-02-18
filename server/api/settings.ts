// server/api/settings.ts
// GET: Load settings from .env, POST: Save settings to .env
import { defineEventHandler, getMethod, readBody } from 'h3'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const ENV_KEYS = {
  r2AccountId: 'CLOUDFLARE_ACCOUNT_ID',
  r2ApiToken: 'CLOUDFLARE_API_TOKEN',
  r2Bucket: 'R2_BUCKET_NAME',
  r2Domain: 'R2_CUSTOM_DOMAIN',
  imagekitEndpoint: 'IMAGEKIT_URL_ENDPOINT',
  imagekitPublicKey: 'IMAGEKIT_PUBLIC_KEY',
  imagekitPrivateKey: 'IMAGEKIT_PRIVATE_KEY',
  githubPat: 'GITHUB_PAT',
  githubRepo: 'GITHUB_REPO'
} as Record<string, string>

function getEnvPath() {
  return join(process.cwd(), '.env')
}

async function loadEnv(): Promise<Record<string, string>> {
  const envPath = getEnvPath()
  const pairs: Record<string, string> = {}

  try {
    const content = await readFile(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim()
        let val = trimmed.substring(eqIdx + 1).trim()
        // Remove quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        pairs[key] = val
      }
    }
  } catch {
    // File doesn't exist yet
  }

  return pairs
}

async function saveEnv(pairs: Record<string, string>) {
  const existing = await loadEnv()

  const merged = { ...existing, ...pairs }
  const lines = Object.entries(merged)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}="${v}"`)

  await writeFile(getEnvPath(), lines.join('\n') + '\n')
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    // Load settings
    const env = await loadEnv()
    const result: Record<string, string> = {}

    for (const [settingsKey, envKey] of Object.entries(ENV_KEYS)) {
      result[settingsKey] = env[envKey] || ''
    }

    // Mask sensitive fields
    if (result.r2ApiToken) {
      result.r2ApiToken = '••••' + result.r2ApiToken.slice(-4)
    }
    if (result.imagekitPrivateKey) {
      result.imagekitPrivateKey = '••••' + result.imagekitPrivateKey.slice(-4)
    }
    if (result.githubPat) {
      result.githubPat = '••••' + result.githubPat.slice(-4)
    }

    return result
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const envPairs: Record<string, string> = {}

    for (const [settingsKey, envKey] of Object.entries(ENV_KEYS)) {
      const val = body[settingsKey]
      // Don't overwrite with masked values
      if (val && !val.startsWith('••••')) {
        envPairs[envKey] = val
      }
    }

    await saveEnv(envPairs)

    return { success: true, message: 'Settings saved to .env' }
  }
})

