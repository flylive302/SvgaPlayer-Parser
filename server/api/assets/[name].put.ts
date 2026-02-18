// server/api/assets/[name].put.ts
// Rename or relocate an asset
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { join } from 'path'
import { existsSync, renameSync, mkdirSync } from 'fs'
import { readManifest, writeManifest } from '../../utils/manifest'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  const body = await readBody(event)
  const { newName, newType, cdnPath } = body

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Missing asset name' })
  }

  const cwd = process.cwd()
  const results: string[] = []

  // Rename directories if newName provided
  if (newName && newName !== name) {
    const dirs = [
      { from: join(cwd, 'output', 'webm', name), to: join(cwd, 'output', 'webm', newName) },
      { from: join(cwd, 'output', 'hevc', name), to: join(cwd, 'output', 'hevc', newName) },
      { from: join(cwd, 'output', 'svga', name), to: join(cwd, 'output', 'svga', newName) },
    ]

    for (const { from, to } of dirs) {
      if (existsSync(from)) {
        mkdirSync(join(to, '..'), { recursive: true })
        renameSync(from, to)
        results.push(`Renamed: ${from} → ${to}`)

        // Rename the JSON file inside svga folder if it exists
        const oldJson = join(to, `${name}.json`)
        const newJson = join(to, `${newName}.json`)
        if (existsSync(oldJson)) {
          renameSync(oldJson, newJson)
        }
      }
    }
  }

  // Update manifest
  try {
    const manifest = await readManifest()
    const asset = manifest.assets.find(a => a.name === name)

    if (asset) {
      const updatedName = newName || name
      const updatedType = newType || asset.assetType
      const prefix = cdnPath || asset.cdnPath || `/${updatedName}`

      asset.name = updatedName
      asset.assetType = updatedType

      if (asset.assetType === 'svga') {
        asset.formats = { json: `${prefix}/${updatedName}/${updatedName}.json` }
      } else {
        asset.formats = {
          webm: `${prefix}/${updatedName}/playable.webm`,
          hevc: `${prefix}/${updatedName}/playable.mov`,
        }
        asset.thumbnail = `${prefix}/${updatedName}/thumbnail.png`
      }

      if (cdnPath) {
        asset.cdnPath = cdnPath
      }
    }

    await writeManifest(manifest)
    results.push('Manifest updated')
  } catch (err: any) {
    results.push(`Manifest update failed: ${err.message}`)
  }

  return {
    success: true,
    results,
    message: `Asset "${name}" updated`,
  }
})

