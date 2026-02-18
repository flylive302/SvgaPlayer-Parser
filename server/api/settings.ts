// server/api/settings.ts
// GET: Load settings from SQLite, POST: Save settings to SQLite
import { defineEventHandler, getMethod, readBody } from 'h3'
import { getAllCredentials, saveCredentials, getCredentials } from '../utils/db'

const PROVIDER_KEYS: Record<string, string[]> = {
  r2: ['accountId', 'apiToken', 'bucket', 'domain'],
  imagekit: ['endpoint', 'publicKey', 'privateKey'],
  github: ['pat', 'repo'],
}

// Sensitive fields that should be masked in GET responses
const SENSITIVE_FIELDS = ['apiToken', 'privateKey', 'pat']

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    const all = getAllCredentials()
    const result: Record<string, Record<string, string>> = {}

    for (const [provider, keys] of Object.entries(PROVIDER_KEYS)) {
      const config = all[provider] || {}
      result[provider] = {}
      for (const key of keys) {
        let val = config[key] || ''
        // Mask sensitive fields
        if (val && SENSITIVE_FIELDS.includes(key)) {
          val = '••••' + val.slice(-4)
        }
        result[provider][key] = val
      }
    }

    return result
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const { provider, config } = body

    if (!provider || !config || !PROVIDER_KEYS[provider]) {
      return { success: false, error: 'Invalid provider or config' }
    }

    // Don't overwrite with masked values — merge with existing
    const existing = getCredentials(provider)
    const merged: Record<string, string> = { ...existing }

    for (const key of PROVIDER_KEYS[provider]) {
      const val = config[key]
      if (val && !val.startsWith('••••')) {
        merged[key] = val
      }
    }

    saveCredentials(provider, merged)

    return { success: true, message: `${provider} settings saved` }
  }
})
