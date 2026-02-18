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
  </div>
</template>

<script setup lang="ts">
import { formatSize } from '~/composables/useFormatters'

useHead({ title: 'CDN Upload — AlphaConvert' })

const addToast = inject<(type: string, msg: string) => void>('addToast')

interface UploadFile extends File { _status?: string; _cdnUrl?: string }

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const isUploading = ref(false)
const uploadedCount = ref(0)
const cdnProvider = ref('r2')
const remotePath = ref('/')
const files = ref<UploadFile[]>([])

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files) addFiles(Array.from(input.files))
  input.value = ''
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files) addFiles(Array.from(e.dataTransfer.files))
}

const addFiles = (newFiles: File[]) => {
  for (const f of newFiles) {
    const uf = f as UploadFile
    uf._status = 'pending'
    uf._cdnUrl = ''
    files.value.push(uf)
  }
}

const fileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (ext === 'webm' || ext === 'mp4' || ext === 'mov') return '🎬'
  if (ext === 'svga') return '✨'
  if (ext === 'json') return '📄'
  if (ext === 'png' || ext === 'jpg' || ext === 'webp') return '🖼️'
  return '📁'
}

const uploadAll = async () => {
  isUploading.value = true
  uploadedCount.value = 0

  for (const file of files.value) {
    if (file._status === 'done') { uploadedCount.value++; continue }
    file._status = 'uploading'

    try {
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
          remotePath: remotePath.value,
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
</style>
