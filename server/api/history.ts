// server/api/history.ts
// GET: Fetch conversion history, DELETE: Remove entry
import { defineEventHandler, getMethod, getQuery, readBody } from 'h3'
import { getHistory, deleteHistoryEntry, updateHistoryEntry } from '../utils/db'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    return { entries: getHistory() }
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
