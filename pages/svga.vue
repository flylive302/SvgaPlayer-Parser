<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">✨ SVGA Converter</h1>
      <p class="page-subtitle">Parse SVGA animations into JSON for web playback</p>
    </div>

    <!-- Drop Zone -->
    <div
      class="drop-zone"
      :class="{ 'drag-over': isDragging }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="openFileDialog"
    >
      <div class="drop-zone-icon">✨</div>
      <div class="drop-zone-text">Drop SVGA files here, or click to browse</div>
      <div class="drop-zone-hint">SVGA animation files will be parsed to JSON</div>
      <input
        ref="fileInput"
        type="file"
        multiple
        accept=".svga"
        style="display:none"
        @change="handleFileSelect"
      />
    </div>

    <!-- Queue -->
    <div v-if="queue.length > 0" class="asset-queue">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
        <h2 class="card-title">{{ queue.length }} animation{{ queue.length > 1 ? 's' : '' }} queued</h2>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-danger btn-sm" @click="clearQueue" :disabled="isProcessing">🗑️ Clear All</button>
          <button class="btn btn-primary btn-lg" @click="processAll" :disabled="isProcessing || queue.length === 0">
            <span v-if="isProcessing" class="spinner" style="width:16px;height:16px;border-width:2px"></span>
            {{ isProcessing ? 'Parsing...' : '⚡ Parse All' }}
          </button>
        </div>
      </div>

      <!-- SVGA Cards -->
      <div v-for="(item, idx) in queue" :key="item.id" class="asset-card">
        <div class="asset-thumb">✨</div>

        <div class="asset-info">
          <div class="asset-name">{{ item.originalName }}</div>
          <div class="asset-meta">SVGA · {{ formatSize(item.size) }}</div>

          <div class="asset-config">
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Output Name</label>
              <input v-model="item.outputName" class="form-input" placeholder="e.g. fire_gift" />
            </div>
          </div>

          <!-- Progress -->
          <div v-if="item.status !== 'queued'" style="margin-top:12px">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px">
              <span class="badge" :class="statusBadge(item.status)">{{ item.status }}</span>
              <span v-if="item.log" style="font-size:0.75rem; color:var(--text-muted); cursor:pointer" @click="item.showLog = !item.showLog">
                {{ item.showLog ? 'Hide' : 'Show' }} log
              </span>
            </div>
            <div v-if="item.status === 'processing'" class="progress-bar">
              <div class="progress-fill" :style="{ width: item.progress + '%' }"></div>
            </div>
            <div v-if="item.status === 'processing'" class="progress-text">{{ item.progressText }}</div>
            <div v-if="item.showLog && item.log" class="log-output">{{ item.log }}</div>
          </div>

          <!-- Preview After Parsing -->
          <div v-if="item.parsed" class="preview-section">
            <h3 class="preview-title">📺 Preview</h3>

            <!-- SVGA Animation Player -->
            <SvgaPlayer
              :json-url="`/api/preview/svga/${item.outputName}/${item.outputName}.json`"
              :max-width="400"
              :max-height="300"
            />

            <!-- Stats -->
            <div class="svga-stats" style="margin-top:12px">
              <div class="stat-chip">🎞️ {{ item.stats.frames }} frames</div>
              <div class="stat-chip">⏱️ {{ item.stats.fps }} fps</div>
              <div class="stat-chip">📐 {{ item.stats.viewBoxWidth }}×{{ item.stats.viewBoxHeight }}</div>
              <div class="stat-chip">🖼️ {{ item.stats.images }} images</div>
              <div class="stat-chip">💾 {{ formatSize(item.jsonSize) }} JSON</div>
            </div>

            <!-- JSON Preview -->
            <div class="json-preview-toggle" @click="item.showJson = !item.showJson">
              {{ item.showJson ? '▼ Hide' : '▶ Show' }} JSON Preview
            </div>
            <div v-if="item.showJson" class="log-output" style="max-height:300px; overflow:auto; margin-top:8px">
              <pre style="white-space:pre-wrap; word-break:break-all; font-size:0.7rem">{{ item.jsonPreviewText }}</pre>
            </div>

            <!-- Edit & Upload Link -->
            <div class="edit-link-section">
              <NuxtLink :to="`/history/svga/${item.outputName}`" class="btn btn-primary">
                ✏️ Edit & Upload to CDN
              </NuxtLink>
              <span class="form-hint">Configure CDN path, thumbnail, and upload settings on the edit page</span>
            </div>
          </div>
        </div>

        <div class="asset-actions">
          <button class="btn btn-danger btn-sm" @click="removeFromQueue(idx)" :disabled="isProcessing">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatSize, statusBadge } from '~/composables/useFormatters'
interface SvgaItem {
  id: number
  file: File
  originalName: string
  size: number
  outputName: string
  status: 'queued' | 'uploading' | 'processing' | 'done' | 'error'
  progress: number
  progressText: string
  log: string
  showLog: boolean
  parsed: boolean
  jsonSize: number
  stats: { frames: number, fps: number, viewBoxWidth: number, viewBoxHeight: number, images: number }
  jsonPreviewText: string
  showJson: boolean
}

const addToast = inject<(type: string, msg: string) => void>('addToast')
const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const isProcessing = ref(false)
const queue = ref<SvgaItem[]>([])

const openFileDialog = () => fileInput.value?.click()

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files) addFiles(Array.from(input.files))
  input.value = ''
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files) addFiles(Array.from(e.dataTransfer.files))
}

const addFiles = (files: File[]) => {
  let added = 0
  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'svga') {
      addToast?.('error', `Only SVGA files accepted. Got: .${ext}`)
      continue
    }
    const baseName = file.name.replace(/\.[^.]+$/, '')
      .toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '')

    queue.value.push({
      id: Date.now() + Math.random(),
      file,
      originalName: file.name,
      size: file.size,
      outputName: baseName,
      status: 'queued',
      progress: 0,
      progressText: '',
      log: '',
      showLog: false,
      parsed: false,
      jsonSize: 0,
      stats: { frames: 0, fps: 0, viewBoxWidth: 0, viewBoxHeight: 0, images: 0 },
      jsonPreviewText: '',
      showJson: false,
    })
    added++
  }
  if (added) addToast?.('info', `${added} animation(s) added`)
}

const removeFromQueue = (idx: number) => queue.value.splice(idx, 1)
const clearQueue = () => { queue.value = [] }

const processAll = async () => {
  isProcessing.value = true
  for (const item of queue.value) {
    if (item.status === 'done') continue
    try {
      // Step 1: Upload file to server
      item.status = 'uploading'
      item.progress = 20
      item.progressText = 'Uploading SVGA to server...'

      const formData = new FormData()
      formData.append('file', item.file)

      const uploadRes = await $fetch<{success: boolean, filename: string, error?: string}>('/api/upload', {
        method: 'POST', body: formData
      })
      if (!uploadRes.success) throw new Error(uploadRes.error || 'Upload failed')

      // Step 2: Parse SVGA → JSON
      item.status = 'processing'
      item.progress = 50
      item.progressText = 'Parsing SVGA → JSON...'

      const parseRes = await $fetch<{
        success: boolean, log?: string, error?: string, jsonSize?: number,
        stats?: { frames: number, fps: number, viewBoxWidth: number, viewBoxHeight: number, images: number }
      }>('/api/process-svga', {
        method: 'POST',
        body: { filename: uploadRes.filename, outputName: item.outputName }
      })

      item.log = parseRes.log || ''
      if (!parseRes.success) throw new Error(parseRes.error || 'Parsing failed')

      // Step 3: Load preview
      item.progress = 80
      item.progressText = 'Loading preview...'

      item.jsonSize = parseRes.jsonSize || 0
      item.stats = parseRes.stats || item.stats

      // Fetch a snippet of the JSON for preview
      try {
        const jsonData = await $fetch<any>(`/api/preview/svga/${item.outputName}/${item.outputName}.json`)
        item.jsonPreviewText = JSON.stringify(jsonData, null, 2).substring(0, 2000) + '...'
      } catch {
        item.jsonPreviewText = '(Preview not available)'
      }

      item.parsed = true
      item.progress = 100
      item.progressText = 'Parsing complete!'
      item.status = 'done'

      // Step 4: Auto-register in manifest
      try {
        await $fetch('/api/register-asset', {
          method: 'POST',
          body: { name: item.outputName, assetType: 'svga' }
        })
      } catch { /* non-critical */ }

      addToast?.('success', `${item.outputName} parsed successfully!`)

    } catch (err: any) {
      item.status = 'error'
      item.progressText = err.message || 'Unknown error'
      item.log += '\n\nError: ' + (err.message || 'Unknown')
      addToast?.('error', `Failed: ${item.outputName} — ${err.message}`)
    }
  }
  isProcessing.value = false
}
</script>

<style scoped>
.preview-section {
  margin-top: 16px;
  padding: 16px;
  background: rgba(168, 85, 247, 0.06);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.preview-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.svga-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.stat-chip {
  padding: 4px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.json-preview-toggle {
  font-size: 0.8rem;
  color: var(--accent-blue);
  cursor: pointer;
  font-weight: 500;
}

.json-preview-toggle:hover {
  color: var(--accent-violet);
}

.edit-link-section {
  margin-top: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: var(--radius-md);
}

.form-hint {
  font-size: 0.78rem;
  color: var(--text-muted);
}
</style>
