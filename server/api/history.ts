// server/api/history.ts
// GET: Fetch conversion history, POST: Add entry, DELETE: Remove entry, PATCH: Update entry
import { defineEventHandler, getMethod, getQuery, readBody } from 'h3'
import { getHistory, addHistoryEntry, deleteHistoryEntry, updateHistoryEntry } from '../utils/db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    return { entries: getHistory() }
  }

  if (method === 'POST') {
    const body = await readBody(event)
    const { name, asset_type, source_filename, formats, cdn_urls, thumbnail_url } = body
    if (!name || !asset_type) return { success: false, error: 'Missing name or asset_type' }
    const id = addHistoryEntry({
      name,
      asset_type,
      source_filename: source_filename || null,
      formats: formats || {},
      cdn_urls: cdn_urls || [],
      thumbnail_url: thumbnail_url || null,
    })
    return { success: true, id }
  }

  if (method === 'DELETE') {
    const { id } = getQuery(event) as { id?: string }
    if (!id) return { success: false, error: 'Missing id' }
    deleteHistoryEntry(Number(id))
    return { success: true }
  }

  if (method === 'PATCH') {
    const body = await readBody(event)
    const { id, cdn_urls, formats, thumbnail_url } = body
    if (!id) return { success: false, error: 'Missing id' }
    updateHistoryEntry(Number(id), { cdn_urls, formats, thumbnail_url })
    return { success: true }
  }
})
