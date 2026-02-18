// server/api/assets.get.ts
// Returns current asset manifest
import { defineEventHandler } from 'h3'
import { readManifest } from '../utils/manifest'

export default defineEventHandler(async () => {
  return await readManifest()
})

