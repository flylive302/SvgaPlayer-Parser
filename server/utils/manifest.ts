// server/utils/manifest.ts
// Shared async manifest read/write — replaces raw fs calls across 5+ files
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import type { Manifest, ManifestEntry } from './types'

const MANIFEST_PATH = () => join(process.cwd(), 'assets.json')

/**
 * Read the asset manifest. Returns empty manifest if file doesn't exist.
 */
export async function readManifest(): Promise<Manifest> {
  try {
    const raw = await readFile(MANIFEST_PATH(), 'utf-8')
    return JSON.parse(raw) as Manifest
  } catch {
    return { assets: [] }
  }
}

/**
 * Write the full manifest to disk.
 */
export async function writeManifest(manifest: Manifest): Promise<void> {
  await writeFile(MANIFEST_PATH(), JSON.stringify(manifest, null, 2), 'utf-8')
}

/**
 * Find, update, and save a single manifest entry by name.
 * If the entry doesn't exist, it is created with defaults.
 */
export async function upsertManifestEntry(
  name: string,
  updater: (entry: ManifestEntry) => ManifestEntry
): Promise<ManifestEntry> {
  const manifest = await readManifest()
  const idx = manifest.assets.findIndex(a => a.name === name)

  const existing: ManifestEntry = idx >= 0
    ? manifest.assets[idx]
    : { name, assetType: '', encoded_at: new Date().toISOString(), cdn_urls: [], formats: {} }

  const updated = updater(existing)

  if (idx >= 0) {
    manifest.assets[idx] = updated
  } else {
    manifest.assets.push(updated)
  }

  await writeManifest(manifest)
  return updated
}

/**
 * Remove a manifest entry by name.
 */
export async function removeManifestEntry(name: string): Promise<void> {
  const manifest = await readManifest()
  manifest.assets = manifest.assets.filter(a => a.name !== name)
  await writeManifest(manifest)
}
