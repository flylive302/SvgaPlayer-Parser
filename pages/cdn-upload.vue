<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">☁️ CDN Upload</h1>
      <p class="page-subtitle">Upload files directly to your CDN — Cloudflare R2 or ImageKit</p>
    </div>

    <!-- Drop Zone -->
    <div
      class="drop-zone"
      :class="{ 'drag-over': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="fileInput?.click()"
    >
      <div class="drop-zone-icon">☁️</div>
      <div class="drop-zone-text">Drop files to upload to CDN</div>
      <div class="drop-zone-hint">.webm, .mov, .json, .png, or any file</div>
      <input ref="fileInput" type="file" multiple style="display:none" @change="handleFileSelect" />
      <!-- Folder picker (Chromium/Edge): preserves relative paths -->
      <input ref="folderInput" type="file" multiple webkitdirectory directory style="display:none" @change="handleFolderSelect" />
    </div>

    <!-- Upload Config -->
    <div v-if="files.length > 0" class="card" style="margin-top:20px">
      <div class="card-header">
        <h2 class="card-title">{{ files.length }} file{{ files.length > 1 ? 's' : '' }} ready</h2>
        <button class="btn btn-danger btn-sm" @click="files = []">🗑️ Clear</button>
      </div>

      <!-- Global settings -->
      <div class="upload-config">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">CDN Provider</label>
            <select v-model="cdnProvider" class="form-select">
              <option value="r2">Cloudflare R2</option>
              <option value="imagekit">ImageKit</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Remote Path</label>
            <input v-model="remotePath" class="form-input" placeholder="e.g. /assets/animations/" />
          </div>
        </div>
        <div class="upload-actions">
          <button class="btn btn-secondary btn-sm" @click="folderInput?.click()" :disabled="isUploading">
            📁 Select Folder
          </button>
          <div class="upload-actions-hint">
            Folder uploads preserve subfolders under Remote Path.
          </div>
        </div>
      </div>

      <!-- File List -->
      <div class="file-list">
        <div v-for="(file, idx) in files" :key="idx" class="file-row">
          <div class="file-info">
            <span class="file-icon">{{ fileIcon(file.name) }}</span>
            <div>
              <div class="file-name">{{ file.name }}</div>
              <div class="file-size">{{ formatSize(file.size) }}</div>
            </div>
          </div>
          <div class="file-status">
            <span v-if="file._status === 'done'" class="badge badge-emerald">✅ Done</span>
            <span v-else-if="file._status === 'uploading'" class="badge badge-blue">Uploading...</span>
            <span v-else-if="file._status === 'error'" class="badge badge-amber">❌ Error</span>
            <button v-else class="btn btn-danger btn-sm" @click="files.splice(idx, 1)" style="padding:4px 10px">✕</button>
          </div>
          <div v-if="file._cdnUrl" class="file-url">
            <a :href="file._cdnUrl" target="_blank" class="cdn-url-link">{{ file._cdnUrl }}</a>
          </div>
        </div>
      </div>

      <!-- Upload Button -->
      <div style="margin-top:16px; text-align:right">
        <button class="btn btn-primary btn-lg" @click="uploadAll" :disabled="isUploading">
          <span v-if="isUploading" class="spinner" style="width:16px;height:16px;border-width:2px"></span>
          {{ isUploading ? `Uploading (${uploadedCount}/${files.length})...` : '☁️ Upload All to CDN' }}
        </button>
      </div>
    </div>

    <!-- CDN Browser -->
    <div class="card cdn-browser-card">
      <div class="card-header">
        <h2 class="card-title">Existing CDN Assets</h2>
        <button class="btn btn-secondary btn-sm" @click="refreshCdnList" :disabled="isListing">
          <span v-if="isListing" class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:6px"></span>
          Refresh
        </button>
      </div>

      <div class="cdn-browser-controls">
        <div class="form-row cdn-browser-row">
          <div class="form-group">
            <label class="form-label">Provider</label>
            <select v-model="cdnProvider" class="form-select">
              <option value="r2">Cloudflare R2</option>
              <option value="imagekit">ImageKit</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Remote Path / Prefix</label>
            <input v-model="listPrefix" class="form-input" placeholder="e.g. / or /assets/animations" />
          </div>
          <div class="form-group">
            <label class="form-label">Search</label>
            <input v-model="searchTerm" class="form-input" placeholder="Filter by name or path" />
          </div>
        </div>
      </div>

      <div v-if="listError" class="cdn-browser-error">
        {{ listError }}
      </div>

      <div class="cdn-list" v-if="filteredCdnItems.length">
        <div class="cdn-list-header">
          <span class="cdn-col-main">File</span>
          <span class="cdn-col-size">Size</span>
          <span class="cdn-col-date">Last Modified</span>
          <span class="cdn-col-actions">Actions</span>
        </div>
        <div
          v-for="item in filteredCdnItems"
          :key="item.provider + ':' + item.path"
          class="cdn-list-row"
        >
          <div class="cdn-col-main">
            <span class="file-icon">{{ fileIcon(item.name) }}</span>
            <div class="cdn-main-text">
              <div class="file-name">{{ item.name }}</div>
              <div class="file-path">{{ item.path }}</div>
            </div>
          </div>
          <div class="cdn-col-size">
            <span v-if="item.size != null">{{ formatSize(item.size) }}</span>
            <span v-else>—</span>
          </div>
          <div class="cdn-col-date">
            <span v-if="item.lastModified">{{ formatDate(item.lastModified) }}</span>
            <span v-else>—</span>
          </div>
          <div class="cdn-col-actions">
            <a
              :href="item.url"
              target="_blank"
              class="btn btn-secondary btn-xs"
            >
              Open
            </a>
            <a
              :href="item.url"
              download
              class="btn btn-secondary btn-xs"
            >
              Download
            </a>
            <button
              class="btn btn-secondary btn-xs"
              type="button"
              @click="copyUrl(item.url)"
            >
              Copy URL
            </button>
          </div>
        </div>
      </div>

      <div v-else class="cdn-list-empty">
        <span v-if="isListing">Loading assets from CDN…</span>
        <span v-else>No assets found for this provider/path yet.</span>
      </div>

      <div v-if="nextCursor" class="cdn-list-pagination">
        <button class="btn btn-secondary btn-sm" @click="loadMoreCdn" :disabled="isListing">
          <span v-if="isListing" class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:6px"></span>
          Load more
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatSize } from '~/composables/useFormatters'
import type { CdnObjectItem } from '~/server/utils/cdn-types'

useHead({ title: 'CDN Upload — AlphaConvert' })

const addToast = inject<(type: string, msg: string) => void>('addToast')

interface UploadFile extends File { _status?: string; _cdnUrl?: string; _relativePath?: string }

const fileInput = ref<HTMLInputElement>()
const folderInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const isUploading = ref(false)
const uploadedCount = ref(0)
const cdnProvider = ref('r2')
const remotePath = ref('/')
const files = ref<UploadFile[]>([])

// CDN listing state
const listPrefix = ref<string>('/')
const searchTerm = ref<string>('')
const isListing = ref(false)
const listError = ref<string | null>(null)
const listItems = ref<CdnObjectItem[]>([])
const nextCursor = ref<string | null>(null)

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files) addFiles(Array.from(input.files))
  input.value = ''
}

const handleFolderSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files) addFiles(Array.from(input.files))
  input.value = ''
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  if (!e.dataTransfer) return

  // If directories were dropped (Chromium), walk them and collect real files.
  // This avoids pushing the directory placeholder (often 0 B) as a "file".
  const items = Array.from(e.dataTransfer.items || [])
  const hasEntries = items.some((it) => typeof (it as any).webkitGetAsEntry === 'function')
  if (hasEntries) {
    void addDroppedItems(items)
    return
  }

  if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files))
}

const addFiles = (newFiles: File[]) => {
  for (const f of newFiles) {
    const uf = f as UploadFile
    uf._status = 'pending'
    uf._cdnUrl = ''
    // Preserve folder structure where available (folder picker and some browsers)
    const anyF = f as any
    if (typeof anyF.webkitRelativePath === 'string' && anyF.webkitRelativePath) {
      uf._relativePath = anyF.webkitRelativePath
    }
    files.value.push(uf)
  }
}

type WebkitEntry = {
  isFile: boolean
  isDirectory: boolean
  fullPath: string
  file: (cb: (file: File) => void, err?: (e: unknown) => void) => void
  createReader: () => { readEntries: (cb: (entries: WebkitEntry[]) => void, err?: (e: unknown) => void) => void }
}

const addDroppedItems = async (items: DataTransferItem[]) => {
  const collected: Array<{ file: File; relativePath?: string }> = []

  const walkEntry = async (entry: WebkitEntry) => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => {
        entry.file(resolve, reject)
      })
      const rel = entry.fullPath?.replace(/^\//, '') || ''
      collected.push({ file, relativePath: rel })
      return
    }

    if (entry.isDirectory) {
      const reader = entry.createReader()
      const readAll = async (): Promise<WebkitEntry[]> => {
        const chunk = await new Promise<WebkitEntry[]>((resolve, reject) => {
          reader.readEntries(resolve, reject)
        })
        if (!chunk.length) return []
        return chunk.concat(await readAll())
      }
      const entries = await readAll()
      for (const child of entries) await walkEntry(child)
    }
  }

  for (const it of items) {
    const entry = (it as any).webkitGetAsEntry?.() as WebkitEntry | null | undefined
    if (!entry) continue
    await walkEntry(entry)
  }

  if (!collected.length) {
    addToast?.('error', 'No files found in dropped folder')
    return
  }

  for (const { file, relativePath } of collected) {
    const uf = file as UploadFile
    uf._status = 'pending'
    uf._cdnUrl = ''
    if (relativePath) uf._relativePath = relativePath
    files.value.push(uf)
  }

  addToast?.('info', `Added ${collected.length} file(s) from folder`)
}

const fileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (ext === 'webm' || ext === 'mp4' || ext === 'mov') return '🎬'
  if (ext === 'svga') return '✨'
  if (ext === 'json') return '📄'
  if (ext === 'png' || ext === 'jpg' || ext === 'webp') return '🖼️'
  return '📁'
}

const joinRemotePath = (base: string, subdir: string) => {
  const cleanBase = (base || '/').trim().replace(/\/+/g, '/').replace(/\/$/, '') || '/'
  const cleanSub = (subdir || '').trim().replace(/\/+/g, '/').replace(/^\/+/, '').replace(/\/$/, '')
  if (!cleanSub) return cleanBase
  return cleanBase === '/' ? `/${cleanSub}` : `${cleanBase}/${cleanSub}`
}

const uploadAll = async () => {
  isUploading.value = true
  uploadedCount.value = 0

  for (const file of files.value) {
    if (file._status === 'done') { uploadedCount.value++; continue }
    file._status = 'uploading'

    try {
      // Derive per-file remote folder from relativePath, if provided.
      const rel = file._relativePath || ''
      const relDir = rel.includes('/') ? rel.split('/').slice(0, -1).join('/') : ''
      const effectiveRemotePath = joinRemotePath(remotePath.value, relDir)

      // Step 1: Upload to server temp
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await $fetch<{ success: boolean; filename: string; error?: string }>('/api/upload', {
        method: 'POST', body: formData,
      })
      if (!uploadRes.success) throw new Error(uploadRes.error || 'Upload failed')

      // Step 2: Upload to CDN
      const cdnRes = await $fetch<{ success: boolean; url?: string; error?: string }>('/api/upload-cdn', {
        method: 'POST',
        body: {
          provider: cdnProvider.value,
          filePath: `raw/${uploadRes.filename}`,
          remotePath: effectiveRemotePath,
          assetName: file.name.replace(/\.[^.]+$/, ''),
          filename: file.name,
        },
      })

      if (!cdnRes.success) throw new Error(cdnRes.error || 'CDN upload failed')
      file._status = 'done'
      file._cdnUrl = cdnRes.url || ''
      uploadedCount.value++
    } catch (err: any) {
      file._status = 'error'
      addToast?.('error', `${file.name}: ${err.message}`)
    }
  }

  isUploading.value = false
  const doneCount = files.value.filter(f => f._status === 'done').length
  addToast?.('success', `${doneCount}/${files.value.length} files uploaded to CDN`)
}

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString()
  } catch {
    return iso
  }
}

const refreshCdnList = () => {
  nextCursor.value = null
  void loadCdnAssets(true)
}

const loadMoreCdn = () => {
  if (!nextCursor.value) return
  void loadCdnAssets(false)
}

const loadCdnAssets = async (reset: boolean) => {
  isListing.value = true
  listError.value = null
  if (reset) {
    listItems.value = []
  }

  try {
    const provider = cdnProvider.value
    const endpoint = provider === 'imagekit' ? '/api/list-cdn-imagekit' : '/api/list-cdn-r2'

    const query: Record<string, string> = {
      prefix: listPrefix.value || '/',
    }
    if (!reset && nextCursor.value) {
      query.cursor = nextCursor.value
    }
    if (searchTerm.value.trim()) {
      query.search = searchTerm.value.trim()
    }

    const qs = new URLSearchParams(query).toString()

    const res = await $fetch<{ success: boolean; items: CdnObjectItem[]; nextCursor?: string; error?: string }>(
      `${endpoint}?${qs}`,
      { method: 'GET' },
    )

    if (!res.success) {
      throw new Error(res.error || 'Failed to load CDN assets')
    }

    const newItems = res.items || []
    if (reset) {
      listItems.value = newItems
    } else {
      listItems.value = listItems.value.concat(newItems)
    }
    nextCursor.value = res.nextCursor || null
  } catch (err: any) {
    const msg = err?.message || String(err)
    listError.value = msg
    addToast?.('error', msg)
  } finally {
    isListing.value = false
  }
}

const filteredCdnItems = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return listItems.value
  return listItems.value.filter((item) => {
    const haystack = `${item.name} ${item.path}`.toLowerCase()
    return haystack.includes(term)
  })
})

const copyUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    addToast?.('success', 'CDN URL copied to clipboard')
  } catch (err: any) {
    addToast?.('error', err?.message || 'Failed to copy URL')
  }
}

onMounted(() => {
  // Initialize browser state to current remotePath by default
  listPrefix.value = remotePath.value || '/'
  void loadCdnAssets(true)
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.upload-config {
  padding: 16px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  margin-bottom: 16px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
}

.upload-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.upload-actions-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  gap: 12px;
  flex-wrap: wrap;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.file-icon { font-size: 1.2rem; }
.file-name { font-size: 0.88rem; font-weight: 500; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-size { font-size: 0.75rem; color: var(--text-muted); }
.file-url { width: 100%; padding-left: 34px; }
.cdn-url-link { font-size: 0.8rem; color: var(--accent-blue); word-break: break-all; }

.spinner {
  display: inline-block;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.cdn-browser-card {
  margin-top: 24px;
}

.cdn-browser-controls {
  margin-bottom: 12px;
}

.cdn-browser-row {
  grid-template-columns: 1fr 2fr 2fr;
}

.cdn-browser-error {
  color: var(--accent-red);
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.cdn-list {
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}

.cdn-list-header,
.cdn-list-row {
  display: grid;
  grid-template-columns: 4fr 1fr 2fr 2fr;
  gap: 8px;
  padding: 8px 12px;
  align-items: center;
}

.cdn-list-header {
  background: var(--bg-secondary);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.cdn-list-row:nth-child(odd) {
  background: var(--bg-elevated);
}

.cdn-col-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.cdn-main-text {
  min-width: 0;
}

.file-path {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.cdn-col-size,
.cdn-col-date,
.cdn-col-actions {
  font-size: 0.8rem;
}

.cdn-col-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.cdn-list-empty {
  padding: 16px 4px 4px;
  font-size: 0.82rem;
  color: var(--text-muted);
}

.cdn-list-pagination {
  margin-top: 10px;
  text-align: right;
}

.btn.btn-xs {
  padding: 3px 8px;
  font-size: 0.72rem;
}
</style>
