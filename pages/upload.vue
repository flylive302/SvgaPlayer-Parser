<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Upload & Process</h1>
      <p class="page-subtitle">Drag & drop MP4 or SVGA files to encode and upload to CDN</p>
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
      <div class="drop-zone-icon">📁</div>
      <div class="drop-zone-text">
        Drop MP4 or SVGA files here, or click to browse
      </div>
      <div class="drop-zone-hint">
        Supports side-by-side alpha-packed MP4 and SVGA animation files
      </div>
      <input
        ref="fileInput"
        type="file"
        multiple
        accept=".mp4,.svga,.MP4"
        style="display:none"
        @change="handleFileSelect"
      />
    </div>

    <!-- Queued Assets -->
    <div v-if="queue.length > 0" class="asset-queue">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
        <h2 class="card-title">{{ queue.length }} file{{ queue.length > 1 ? 's' : '' }} queued</h2>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-danger btn-sm" @click="clearQueue" :disabled="isProcessing">
            🗑️ Clear All
          </button>
          <button
            class="btn btn-primary btn-lg"
            @click="processAll"
            :disabled="isProcessing || queue.length === 0"
          >
            <span v-if="isProcessing" class="spinner" style="width:16px;height:16px;border-width:2px"></span>
            {{ isProcessing ? 'Processing...' : '⚡ Process All' }}
          </button>
        </div>
      </div>

      <!-- Asset Cards -->
      <div v-for="(item, idx) in queue" :key="item.id" class="asset-card">
        <!-- Thumbnail -->
        <div class="asset-thumb">
          <span v-if="item.type === 'mp4'">🎬</span>
          <span v-else>✨</span>
        </div>

        <!-- Info + Config -->
        <div class="asset-info">
          <div class="asset-name">{{ item.originalName }}</div>
          <div class="asset-meta">
            {{ item.type.toUpperCase() }} · {{ formatSize(item.size) }}
          </div>

          <!-- Configuration -->
          <div class="asset-config">
            <!-- Output Name -->
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Output Name</label>
              <input
                v-model="item.outputName"
                class="form-input"
                placeholder="e.g. oceanic_reverie"
              />
            </div>

            <!-- Alpha Side (MP4 only) -->
            <div v-if="item.type === 'mp4'" class="form-group" style="margin-bottom:0">
              <label class="form-label">Alpha Side</label>
              <div class="toggle-group">
                <button
                  class="toggle-option"
                  :class="{ active: item.alphaSide === 'left' }"
                  @click="item.alphaSide = 'left'"
                >
                  ◀ Left
                </button>
                <button
                  class="toggle-option"
                  :class="{ active: item.alphaSide === 'right' }"
                  @click="item.alphaSide = 'right'"
                >
                  Right ▶
                </button>
              </div>
            </div>

            <!-- Gift Type -->
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Gift Type</label>
              <select v-model="item.giftType" class="form-select">
                <option value="vip">VIP Gift</option>
                <option value="normal">Normal Gift</option>
              </select>
            </div>

            <!-- CDN Target -->
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Upload To</label>
              <select v-model="item.cdnTarget" class="form-select">
                <option value="r2">Cloudflare R2</option>
                <option value="imagekit">ImageKit</option>
                <option value="none">Don't Upload</option>
              </select>
            </div>

            <!-- CDN Path -->
            <div class="form-group" style="margin-bottom:0; grid-column: span 2;">
              <label class="form-label">CDN Path Prefix</label>
              <input
                v-model="item.cdnPath"
                class="form-input"
                :placeholder="`room/gifts/${item.giftType === 'vip' ? 'vip-gifts' : 'normal'}/${item.outputName}/`"
                style="font-family: var(--font-mono); font-size: 0.8rem;"
              />
            </div>

            <!-- Invert Alpha -->
            <div v-if="item.type === 'mp4'" class="form-group" style="margin-bottom:0">
              <label class="checkbox-label">
                <input type="checkbox" v-model="item.invert" />
                Invert alpha matte
              </label>
            </div>
          </div>

          <!-- Progress -->
          <div v-if="item.status !== 'queued'" style="margin-top:12px">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px">
              <span class="badge" :class="statusBadge(item.status)">
                {{ item.status }}
              </span>
              <span v-if="item.log" style="font-size:0.75rem; color:var(--text-muted); cursor:pointer" @click="item.showLog = !item.showLog">
                {{ item.showLog ? 'Hide' : 'Show' }} log
              </span>
            </div>
            <div v-if="item.status === 'processing'" class="progress-bar">
              <div class="progress-fill" :style="{ width: item.progress + '%' }"></div>
            </div>
            <div v-if="item.status === 'processing'" class="progress-text">
              {{ item.progressText || 'Encoding...' }}
            </div>
            <div v-if="item.showLog && item.log" class="log-output">{{ item.log }}</div>
          </div>
        </div>

        <!-- Actions -->
        <div class="asset-actions">
          <button class="btn btn-danger btn-sm" @click="removeFromQueue(idx)" :disabled="isProcessing">
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface QueueItem {
  id: number
  file: File
  originalName: string
  type: 'mp4' | 'svga'
  size: number
  outputName: string
  alphaSide: 'left' | 'right'
  giftType: 'vip' | 'normal'
  cdnTarget: 'r2' | 'imagekit' | 'none'
  cdnPath: string
  invert: boolean
  status: 'queued' | 'uploading' | 'processing' | 'uploading-cdn' | 'done' | 'error'
  progress: number
  progressText: string
  log: string
  showLog: boolean
}

const addToast = inject<(type: string, msg: string) => void>('addToast')
const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const isProcessing = ref(false)
const queue = ref<QueueItem[]>([])

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
  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'mp4' && ext !== 'svga') {
      addToast?.('error', `Unsupported file type: .${ext}`)
      continue
    }
    const baseName = file.name.replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[\s-]+/g, '_')
      .replace(/[^a-z0-9_]/g, '')

    queue.value.push({
      id: Date.now() + Math.random(),
      file,
      originalName: file.name,
      type: ext as 'mp4' | 'svga',
      size: file.size,
      outputName: baseName,
      alphaSide: 'right',
      giftType: 'normal',
      cdnTarget: 'r2',
      cdnPath: '',
      invert: false,
      status: 'queued',
      progress: 0,
      progressText: '',
      log: '',
      showLog: false
    })
  }
  addToast?.('info', `${files.length} file(s) added to queue`)
}

const removeFromQueue = (idx: number) => queue.value.splice(idx, 1)
const clearQueue = () => { queue.value = [] }

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    queued: 'badge-blue',
    uploading: 'badge-amber',
    processing: 'badge-violet',
    'uploading-cdn': 'badge-amber',
    done: 'badge-emerald',
    error: 'badge-rose'
  }
  return map[status] || 'badge-blue'
}

const processAll = async () => {
  isProcessing.value = true

  for (const item of queue.value) {
    if (item.status === 'done') continue

    try {
      // Step 1: Upload file to server
      item.status = 'uploading'
      item.progress = 10
      item.progressText = 'Uploading file to server...'

      const formData = new FormData()
      formData.append('file', item.file)
      formData.append('outputName', item.outputName)

      const uploadRes = await $fetch<{success: boolean, filename: string, error?: string}>('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!uploadRes.success) throw new Error(uploadRes.error || 'Upload failed')

      // Step 2: Process (encode)
      item.status = 'processing'
      item.progress = 30
      item.progressText = 'Encoding WebM VP9 + alpha...'

      const processRes = await $fetch<{
        success: boolean
        log?: string
        error?: string
        webm?: string
        thumbnail?: string
      }>('/api/process', {
        method: 'POST',
        body: {
          filename: uploadRes.filename,
          outputName: item.outputName,
          alphaSide: item.alphaSide,
          invert: item.invert,
          type: item.type
        }
      })

      item.log = processRes.log || ''
      item.progress = 70

      if (!processRes.success) throw new Error(processRes.error || 'Processing failed')

      item.progressText = 'Encoding complete!'

      // Step 3: Upload to CDN
      if (item.cdnTarget !== 'none') {
        item.status = 'uploading-cdn'
        item.progress = 80
        item.progressText = `Uploading to ${item.cdnTarget === 'r2' ? 'Cloudflare R2' : 'ImageKit'}...`

        const cdnPath = item.cdnPath || `room/gifts/${item.giftType === 'vip' ? 'vip-gifts' : 'normal'}/${item.outputName}/`

        const cdnRes = await $fetch<{success: boolean, error?: string}>('/api/upload-cdn', {
          method: 'POST',
          body: {
            name: item.outputName,
            type: item.giftType,
            provider: item.cdnTarget,
            path: cdnPath
          }
        })

        if (cdnRes.success) {
          item.progress = 100
          item.progressText = 'Uploaded to CDN!'
        } else {
          item.log += '\n\nCDN Upload: ' + (cdnRes.error || 'Failed')
          item.progressText = 'Encoded (CDN upload failed)'
        }
      } else {
        item.progress = 100
        item.progressText = 'Encoding complete (no CDN upload)'
      }

      item.status = 'done'
      addToast?.('success', `${item.outputName} processed successfully!`)

    } catch (err: any) {
      item.status = 'error'
      item.progressText = err.message || 'Unknown error'
      item.log += '\n\nError: ' + (err.message || 'Unknown error')
      addToast?.('error', `Failed: ${item.outputName} — ${err.message}`)
    }
  }

  isProcessing.value = false
}
</script>
