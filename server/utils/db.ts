// server/utils/db.ts
// SQLite database initialization and access
import Database from 'better-sqlite3'
import { join } from 'path'

let _db: Database.Database | null = null

/**
 * Get the SQLite database instance (singleton).
 */
export function getDb(): Database.Database {
  if (_db) return _db

  const dbPath = join(process.cwd(), 'alphaconvert.db')
  _db = new Database(dbPath)

  // Enable WAL for better concurrent read performance
  _db.pragma('journal_mode = WAL')

  // Create tables if they don't exist
  _db.exec(`
    CREATE TABLE IF NOT EXISTS credentials (
      id INTEGER PRIMARY KEY,
      provider TEXT NOT NULL UNIQUE,
      config TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      asset_type TEXT NOT NULL,
      source_filename TEXT,
      formats TEXT DEFAULT '{}',
      cdn_urls TEXT DEFAULT '[]',
      thumbnail_url TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  return _db
}

// ── Credentials helpers ──────────────────────────────────────────────────

export interface CdnCredentials {
  provider: string
  config: Record<string, string>
}

export function getCredentials(provider: string): Record<string, string> {
  const db = getDb()
  const row = db.prepare('SELECT config FROM credentials WHERE provider = ?').get(provider) as { config: string } | undefined
  if (!row) return {}
  try {
    return JSON.parse(row.config)
  } catch {
    return {}
  }
}

export function getAllCredentials(): Record<string, Record<string, string>> {
  const db = getDb()
  const rows = db.prepare('SELECT provider, config FROM credentials').all() as Array<{ provider: string; config: string }>
  const result: Record<string, Record<string, string>> = {}
  for (const row of rows) {
    try {
      result[row.provider] = JSON.parse(row.config)
    } catch {
      result[row.provider] = {}
    }
  }
  return result
}

export function saveCredentials(provider: string, config: Record<string, string>): void {
  const db = getDb()
  db.prepare(`
    INSERT INTO credentials (provider, config, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(provider) DO UPDATE SET config = excluded.config, updated_at = excluded.updated_at
  `).run(provider, JSON.stringify(config))
}

// ── History helpers ──────────────────────────────────────────────────────

export interface HistoryEntry {
  id: number
  name: string
  asset_type: string
  source_filename: string | null
  formats: Record<string, boolean>
  cdn_urls: string[]
  thumbnail_url: string | null
  created_at: string
}

export function addHistoryEntry(entry: Omit<HistoryEntry, 'id' | 'created_at'>): number {
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO history (name, asset_type, source_filename, formats, cdn_urls, thumbnail_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    entry.name,
    entry.asset_type,
    entry.source_filename || null,
    JSON.stringify(entry.formats),
    JSON.stringify(entry.cdn_urls),
    entry.thumbnail_url || null
  )
  return Number(result.lastInsertRowid)
}

export function getHistory(): HistoryEntry[] {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM history ORDER BY created_at DESC').all() as Array<Record<string, any>>
  return rows.map(row => ({
    ...row,
    formats: JSON.parse(row.formats || '{}'),
    cdn_urls: JSON.parse(row.cdn_urls || '[]'),
  })) as HistoryEntry[]
}

export function updateHistoryEntry(id: number, updates: Partial<Pick<HistoryEntry, 'cdn_urls' | 'formats' | 'thumbnail_url'>>): void {
  const db = getDb()
  const sets: string[] = []
  const values: any[] = []

  if (updates.cdn_urls !== undefined) {
    sets.push('cdn_urls = ?')
    values.push(JSON.stringify(updates.cdn_urls))
  }
  if (updates.formats !== undefined) {
    sets.push('formats = ?')
    values.push(JSON.stringify(updates.formats))
  }
  if (updates.thumbnail_url !== undefined) {
    sets.push('thumbnail_url = ?')
    values.push(updates.thumbnail_url)
  }

  if (sets.length === 0) return
  values.push(id)
  db.prepare(`UPDATE history SET ${sets.join(', ')} WHERE id = ?`).run(...values)
}

export function deleteHistoryEntry(id: number): void {
  const db = getDb()
  db.prepare('DELETE FROM history WHERE id = ?').run(id)
}

// ── Preferences helpers ──────────────────────────────────────────────────

export function getPreference(key: string, defaultValue = ''): string {
  const db = getDb()
  const row = db.prepare('SELECT value FROM preferences WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? defaultValue
}

export function setPreference(key: string, value: string): void {
  const db = getDb()
  db.prepare(`
    INSERT INTO preferences (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key, value)
}
