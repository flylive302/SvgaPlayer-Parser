<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">⚡ Convert</h1>
      <p class="page-subtitle">Upload, convert, and download alpha-packed video or SVGA animations</p>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'video' }" @click="activeTab = 'video'">
        <span class="tab-icon video">🎬</span> Video (MP4 → WebM)
      </button>
      <button class="tab" :class="{ active: activeTab === 'svga' }" @click="activeTab = 'svga'">
        <span class="tab-icon svga">✨</span> SVGA (→ JSON)
      </button>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- VIDEO TAB                                                  -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'video'">
      <!-- Drop Zone -->
      <div
        class="drop-zone"
        :class="{ 'drag-over': isDraggingVideo }"
        @dragover.prevent="isDraggingVideo = true"
        @dragleave.prevent="isDraggingVideo = false"
        @drop.prevent="handleVideoDrop"
        @click="videoInput?.click()"
      >
        <div class="drop-zone-icon">🎬</div>
        <div class="drop-zone-text">Drop MP4 files here, or click to browse</div>
        <div class="drop-zone-hint">Side-by-side alpha-packed MP4 files</div>
        <input ref="videoInput" type="file" multiple accept=".mp4,.MP4" style="display:none" @change="handleVideoFileSelect" />
      </div>

      <!-- Video Queue -->
      <div v-if="videoQueue.length > 0" class="asset-queue">
        <div class="queue-header">
          <h2 class="card-title">{{ videoQueue.length }} video{{ videoQueue.length > 1 ? 's' : '' }} queued</h2>
          <div class="queue-actions">
            <button class="btn btn-danger btn-sm" @click="videoQueue = []" :disabled="isVideoProcessing">🗑️ Clear</button>
            <button class="btn btn-primary btn-lg" @click="processVideos" :disabled="isVideoProcessing || videoQueue.length === 0">
              <span v-if="isVideoProcessing" class="spinner" style="width:16px;height:16px;border-width:2px"></span>
              {{ isVideoProcessing ? 'Processing...' : '⚡ Encode All' }}
            </button>
          </div>
        </div>

        <div v-for="(item, idx) in videoQueue" :key="item.id" class="asset-card">
          <div class="asset-thumb">🎬</div>
          <div class="asset-info">
            <div class="asset-name">{{ item.originalName }}</div>
            <div class="asset-meta">MP4 · {{ formatSize(item.size) }}</div>

            <!-- Config -->
            <div class="asset-config">
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Output Name</label>
                <input v-model="item.outputName" class="form-input" placeholder="e.g. oceanic_reverie" />
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Alpha Side</label>
                <div class="toggle-group">
                  <button class="toggle-option" :class="{ active: item.alphaSide === 'left' }" @click="item.alphaSide = 'left'">◀ Left</button>
                  <button class="toggle-option" :class="{ active: item.alphaSide === 'right' }" @click="item.alphaSide = 'right'">Right ▶</button>
                </div>
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="item.invert" />
                  Invert alpha matte
                </label>
              </div>
            </div>

            <!-- Progress -->
            <div v-if="item.status !== 'queued'" style="margin-top:12px">
              <div class="status-row">
                <span class="badge" :class="statusBadge(item.status)">{{ item.status }}</span>
                <span v-if="item.log" class="log-toggle" @click="item.showLog = !item.showLog">
                  {{ item.showLog ? 'Hide' : 'Show' }} log
                </span>
              </div>
              <div v-if="item.status === 'processing'" class="progress-bar">
                <div class="progress-fill" :style="{ width: item.progress + '%' }"></div>
              </div>
              <div v-if="item.status === 'processing'" class="progress-text">{{ item.progressText || 'Encoding...' }}</div>
              <div v-if="item.showLog && item.log" class="log-output">{{ item.log }}</div>
            </div>

            <!-- Result Card (after conversion) -->
            <div v-if="item.status === 'done'" class="result-card result-card-video">
              <h3 class="result-title">✅ Conversion Complete</h3>
              <div class="result-content">
                <div class="result-preview">
                  <video v-if="item.previewUrl" :src="item.previewUrl" autoplay loop muted playsinline class="preview-video"></video>
                </div>
                <div class="result-details">
                  <div class="result-name">{{ item.outputName }}.webm</div>

                  <!-- Primary: Download -->
                  <div class="result-actions-primary">
                    <a :href="item.downloadUrl || item.previewUrl" :download="`${item.outputName}.webm`" class="btn btn-success">⬇️ Download WebM</a>
                    <a v-if="item.thumbnailUrl" :href="item.thumbnailUrl" :download="`${item.outputName}_thumb.png`" class="btn btn-secondary btn-sm">⬇️ Thumbnail</a>
                  </div>

                  <!-- Secondary: iOS + CDN -->
                  <div class="result-actions-secondary">
                    <button class="btn btn-secondary btn-sm" @click="item.showCdnUpload = !item.showCdnUpload">
                      ☁️ Upload to CDN {{ item.showCdnUpload ? '▲' : '▼' }}
                    </button>
                    <button
                      v-if="item.cdnUrl"
                      class="btn btn-sm hevc-btn"
                      :disabled="item.hevcTriggered"
                      @click="triggerHevc(item)"
                    >
                      {{ item.hevcTriggered ? '✅ HEVC Triggered' : '🍎 Encode HEVC (.mov)' }}
                    </button>
                    <NuxtLink v-else to="/settings" class="btn btn-secondary btn-sm hevc-btn">🍎 iOS HEVC Setup</NuxtLink>
                  </div>

                  <!-- Inline CDN Upload (expandable) -->
                  <div v-if="item.showCdnUpload" class="cdn-upload-inline">
                    <div class="form-group">
                      <label class="form-label">CDN Provider</label>
                      <select v-model="item.cdnProvider" class="form-select">
                        <option value="r2">Cloudflare R2</option>
                        <option value="imagekit">ImageKit</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Remote Path</label>
                      <input v-model="item.cdnPath" class="form-input" placeholder="/" />
                    </div>
                    <div class="form-group">
                      <label class="form-label">Filename</label>
                      <input v-model="item.cdnFilename" class="form-input" :placeholder="`${item.outputName}.webm`" />
                    </div>
                    <button class="btn btn-primary btn-sm" @click="uploadToCdn(item, 'video')" :disabled="item.cdnUploading">
                      {{ item.cdnUploading ? 'Uploading...' : '☁️ Upload' }}
                    </button>
                    <div v-if="item.cdnUrl" class="cdn-url-result">
                      <span class="badge badge-emerald">✅ Uploaded</span>
                      <a :href="item.cdnUrl" target="_blank" class="cdn-url-link">{{ item.cdnUrl }}</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Remove -->
          <div class="asset-actions">
            <button class="btn btn-danger btn-sm" @click="videoQueue.splice(idx, 1)" :disabled="isVideoProcessing">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════ -->
    <!-- SVGA TAB                                                   -->
    <!-- ═══════════════════════════════════════════════════════════ -->
    <div v-if="activeTab === 'svga'">
      <!-- Drop Zone -->
      <div
        class="drop-zone"
        :class="{ 'drag-over': isDraggingSvga }"
        @dragover.prevent="isDraggingSvga = true"
        @dragleave.prevent="isDraggingSvga = false"
        @drop.prevent="handleSvgaDrop"
        @click="svgaInput?.click()"
      >
        <div class="drop-zone-icon">✨</div>
        <div class="drop-zone-text">Drop SVGA files here, or click to browse</div>
        <div class="drop-zone-hint">.svga animation files</div>
        <input ref="svgaInput" type="file" multiple accept=".svga" style="display:none" @change="handleSvgaFileSelect" />
      </div>

      <!-- SVGA Queue -->
      <div v-if="svgaQueue.length > 0" class="asset-queue">
        <div class="queue-header">
          <h2 class="card-title">{{ svgaQueue.length }} SVGA{{ svgaQueue.length > 1 ? 's' : '' }} queued</h2>
          <div class="queue-actions">
            <button class="btn btn-danger btn-sm" @click="svgaQueue = []" :disabled="isSvgaProcessing">🗑️ Clear</button>
            <button class="btn btn-primary btn-lg" @click="processSvgas" :disabled="isSvgaProcessing || svgaQueue.length === 0">
              <span v-if="isSvgaProcessing" class="spinner" style="width:16px;height:16px;border-width:2px"></span>
              {{ isSvgaProcessing ? 'Parsing...' : '⚡ Parse All' }}
            </button>
          </div>
        </div>

        <div v-for="(item, idx) in svgaQueue" :key="item.id" class="asset-card">
          <div class="asset-thumb svga-thumb">✨</div>
          <div class="asset-info">
            <div class="asset-name">{{ item.originalName }}</div>
            <div class="asset-meta">SVGA · {{ formatSize(item.size) }}</div>

            <div class="asset-config">
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label">Output Name</label>
                <input v-model="item.outputName" class="form-input" placeholder="e.g. love_birds" />
              </div>
            </div>

            <!-- Progress -->
            <div v-if="item.status !== 'queued'" style="margin-top:12px">
              <div class="status-row">
                <span class="badge" :class="statusBadge(item.status)">{{ item.status }}</span>
                <span v-if="item.log" class="log-toggle" @click="item.showLog = !item.showLog">
                  {{ item.showLog ? 'Hide' : 'Show' }} log
                </span>
              </div>
              <div v-if="item.status === 'processing'" class="progress-bar">
                <div class="progress-fill" :style="{ width: item.progress + '%' }"></div>
              </div>
              <div v-if="item.status === 'processing'" class="progress-text">{{ item.progressText || 'Parsing...' }}</div>
              <div v-if="item.showLog && item.log" class="log-output">{{ item.log }}</div>
            </div>

            <!-- Result Card -->
            <div v-if="item.status === 'done'" class="result-card result-card-svga">
              <h3 class="result-title">✅ Parse Complete</h3>

              <!-- Stats -->
              <div v-if="item.stats" class="svga-stats">
                <span class="stat-chip">{{ item.stats.frames }} frames</span>
                <span class="stat-chip">{{ item.stats.fps }} FPS</span>
                <span class="stat-chip">{{ item.stats.viewBoxWidth }}×{{ item.stats.viewBoxHeight }}</span>
                <span class="stat-chip">{{ item.stats.images }} images</span>
                <span v-if="item.jsonSize" class="stat-chip">JSON: {{ formatSize(item.jsonSize) }}</span>
              </div>

              <!-- Primary: Download -->
              <div class="result-actions-primary">
                <a :href="item.downloadUrl || `/api/preview/svga/${item.outputName}/${item.outputName}.json`" :download="`${item.outputName}.json`" class="btn btn-success">⬇️ Download JSON</a>
              </div>

              <!-- Secondary -->
              <div class="result-actions-secondary">
                <button class="btn btn-secondary btn-sm" @click="item.showCdnUpload = !item.showCdnUpload">
                  ☁️ Upload to CDN {{ item.showCdnUpload ? '▲' : '▼' }}
                </button>
              </div>

              <!-- Inline CDN Upload -->
              <div v-if="item.showCdnUpload" class="cdn-upload-inline">
                <div class="form-group">
                  <label class="form-label">CDN Provider</label>
                  <select v-model="item.cdnProvider" class="form-select">
                    <option value="r2">Cloudflare R2</option>
                    <option value="imagekit">ImageKit</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Remote Path</label>
                  <input v-model="item.cdnPath" class="form-input" placeholder="/" />
                </div>
                <button class="btn btn-primary btn-sm" @click="uploadToCdn(item, 'svga')" :disabled="item.cdnUploading">
                  {{ item.cdnUploading ? 'Uploading...' : '☁️ Upload' }}
                </button>
                <div v-if="item.cdnUrl" class="cdn-url-result">
                  <span class="badge badge-emerald">✅ Uploaded</span>
                  <a :href="item.cdnUrl" target="_blank" class="cdn-url-link">{{ item.cdnUrl }}</a>
                </div>
              </div>
            </div>
          </div>

          <!-- Remove -->
          <div class="asset-actions">
            <button class="btn btn-danger btn-sm" @click="svgaQueue.splice(idx, 1)" :disabled="isSvgaProcessing">✕</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatSize, statusBadge } from '~/composables/useFormatters'

useHead({ title: 'Convert — AlphaConvert' })

const addToast = inject<(type: string, msg: string) => void>('addToast')

// ── Tab state ────────────────────────────────────────────────────
const activeTab = ref<'video' | 'svga'>('video')

// ── VIDEO ────────────────────────────────────────────────────────
interface VideoItem {
  id: number; file: File; originalName: string; size: number;
  outputName: string; alphaSide: 'left' | 'right'; invert: boolean;
  status: 'queued' | 'uploading' | 'processing' | 'done' | 'error';
  progress: number; progressText: string; log: string; showLog: boolean;
  previewUrl: string; thumbnailUrl: string; downloadUrl: string;
  showCdnUpload: boolean; cdnProvider: string; cdnPath: string; cdnFilename: string;
  cdnUploading: boolean; cdnUrl: string;
  hevcTriggered: boolean;
}

const videoInput = ref<HTMLInputElement>()
const isDraggingVideo = ref(false)
const isVideoProcessing = ref(false)
const videoQueue = ref<VideoItem[]>([])

const handleVideoFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files) addVideoFiles(Array.from(input.files))
  input.value = ''
}

const handleVideoDrop = (e: DragEvent) => {
  isDraggingVideo.value = false
  if (e.dataTransfer?.files) addVideoFiles(Array.from(e.dataTransfer.files))
}

const addVideoFiles = (files: File[]) => {
  let added = 0
  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'mp4') { addToast?.('error', `Only MP4 files. Got: .${ext}`); continue }
    const baseName = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '')
    videoQueue.value.push({
      id: Date.now() + Math.random(), file, originalName: file.name, size: file.size,
      outputName: baseName, alphaSide: 'right', invert: false,
      status: 'queued', progress: 0, progressText: '', log: '', showLog: false,
      previewUrl: '', thumbnailUrl: '', downloadUrl: '',
      showCdnUpload: false, cdnProvider: 'r2', cdnPath: '/', cdnFilename: '',
      cdnUploading: false, cdnUrl: '',
      hevcTriggered: false,
    })
    added++
  }
  if (added) addToast?.('info', `${added} video(s) added`)
}

const processVideos = async () => {
  isVideoProcessing.value = true
  for (const item of videoQueue.value) {
    if (item.status === 'done') continue
    try {
      item.status = 'uploading'; item.progress = 10; item.progressText = 'Uploading to server...'
      const formData = new FormData()
      formData.append('file', item.file)
      const uploadRes = await $fetch<{ success: boolean; filename: string; error?: string }>('/api/upload', { method: 'POST', body: formData })
      if (!uploadRes.success) throw new Error(uploadRes.error || 'Upload failed')

      item.status = 'processing'; item.progress = 30; item.progressText = 'Encoding WebM VP9 + alpha...'
      const processRes = await $fetch<{ success: boolean; log?: string; error?: string; webm?: string; thumbnail?: string }>('/api/process', {
        method: 'POST',
        body: { filename: uploadRes.filename, outputName: item.outputName, alphaSide: item.alphaSide, invert: item.invert, type: 'mp4' },
      })

      item.log = processRes.log || ''
      item.progress = 90
      if (!processRes.success) throw new Error(processRes.error || 'Encoding failed')

      const encodedName = encodeURIComponent(item.outputName)
      item.previewUrl = `/api/preview/webm/${encodedName}/playable.webm`
      item.thumbnailUrl = `/api/preview/webm/${encodedName}/thumbnail.png`
      item.downloadUrl = item.previewUrl
      item.cdnFilename = `${item.outputName}.webm`
      item.progress = 100; item.progressText = 'Encoding complete!'; item.status = 'done'

      // Log to history
      try {
        await $fetch('/api/history', {
          method: 'POST',
          body: {
            name: item.outputName,
            asset_type: 'video',
            source_filename: item.originalName,
            formats: { webm: true },
            cdn_urls: [],
            thumbnail_url: null,
          },
        })
      } catch { /* non-critical */ }

      addToast?.('success', `${item.outputName} encoded!`)
    } catch (err: any) {
      item.status = 'error'; item.progressText = err.message || 'Unknown error'
      item.log += '\n\nError: ' + (err.message || 'Unknown')
      addToast?.('error', `Failed: ${item.outputName} — ${err.message}`)
    }
  }
  isVideoProcessing.value = false
}

// ── SVGA ─────────────────────────────────────────────────────────
interface SvgaItem {
  id: number; file: File; originalName: string; size: number; outputName: string;
  status: 'queued' | 'uploading' | 'processing' | 'done' | 'error';
  progress: number; progressText: string; log: string; showLog: boolean;
  parsed: boolean; jsonSize: number; stats: any; downloadUrl: string;
  showCdnUpload: boolean; cdnProvider: string; cdnPath: string;
  cdnUploading: boolean; cdnUrl: string;
}

const svgaInput = ref<HTMLInputElement>()
const isDraggingSvga = ref(false)
const isSvgaProcessing = ref(false)
const svgaQueue = ref<SvgaItem[]>([])

const handleSvgaFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files) addSvgaFiles(Array.from(input.files))
  input.value = ''
}

const handleSvgaDrop = (e: DragEvent) => {
  isDraggingSvga.value = false
  if (e.dataTransfer?.files) addSvgaFiles(Array.from(e.dataTransfer.files))
}

const addSvgaFiles = (files: File[]) => {
  let added = 0
  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'svga') { addToast?.('error', `Only .svga files. Got: .${ext}`); continue }
    const baseName = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, '')
    svgaQueue.value.push({
      id: Date.now() + Math.random(), file, originalName: file.name, size: file.size,
      outputName: baseName,
      status: 'queued', progress: 0, progressText: '', log: '', showLog: false,
      parsed: false, jsonSize: 0, stats: null, downloadUrl: '',
      showCdnUpload: false, cdnProvider: 'r2', cdnPath: '/',
      cdnUploading: false, cdnUrl: '',
    })
    added++
  }
  if (added) addToast?.('info', `${added} SVGA(s) added`)
}

const processSvgas = async () => {
  isSvgaProcessing.value = true
  for (const item of svgaQueue.value) {
    if (item.status === 'done') continue
    try {
      item.status = 'uploading'; item.progress = 20; item.progressText = 'Uploading SVGA...'
      const formData = new FormData()
      formData.append('file', item.file)
      const uploadRes = await $fetch<{ success: boolean; filename: string; error?: string }>('/api/upload', { method: 'POST', body: formData })
      if (!uploadRes.success) throw new Error(uploadRes.error || 'Upload failed')

      item.status = 'processing'; item.progress = 50; item.progressText = 'Parsing SVGA → JSON...'
      const parseRes = await $fetch<{
        success: boolean; log?: string; error?: string; jsonSize?: number;
        stats?: { frames: number; fps: number; viewBoxWidth: number; viewBoxHeight: number; images: number }
      }>('/api/process-svga', {
        method: 'POST',
        body: { filename: uploadRes.filename, outputName: item.outputName },
      })

      item.log = parseRes.log || ''
      if (!parseRes.success) throw new Error(parseRes.error || 'Parsing failed')

      item.jsonSize = parseRes.jsonSize || 0
      item.stats = parseRes.stats || null
      item.downloadUrl = `/api/preview/svga/${item.outputName}/${item.outputName}.json`
      item.parsed = true; item.progress = 100; item.progressText = 'Parsing complete!'; item.status = 'done'

      // Log to history
      try {
        await $fetch('/api/history', {
          method: 'POST',
          body: {
            name: item.outputName,
            asset_type: 'svga',
            source_filename: item.originalName,
            formats: { json: true },
            cdn_urls: [],
            thumbnail_url: null,
          },
        })
      } catch { /* non-critical */ }

      addToast?.('success', `${item.outputName} parsed!`)
    } catch (err: any) {
      item.status = 'error'; item.progressText = err.message || 'Unknown error'
      item.log += '\n\nError: ' + (err.message || 'Unknown')
      addToast?.('error', `Failed: ${item.outputName} — ${err.message}`)
    }
  }
  isSvgaProcessing.value = false
}

// ── CDN Upload (inline) ──────────────────────────────────────────
const uploadToCdn = async (item: VideoItem | SvgaItem, type: 'video' | 'svga') => {
  item.cdnUploading = true
  try {
    const res = await $fetch<{ success: boolean; urls?: string[]; log?: string; error?: string }>('/api/upload-cdn', {
      method: 'POST',
      body: {
        name: item.outputName,
        provider: item.cdnProvider,
        cdnPath: item.cdnPath || '/',
        assetType: type === 'video' ? 'video' : 'svga',
      },
    })

    if (!res.success) throw new Error(res.error || res.log || 'Upload failed')
    item.cdnUrl = res.urls?.[0] || ''
    addToast?.('success', `Uploaded to CDN: ${item.outputName}`)
  } catch (err: any) {
    addToast?.('error', `CDN upload failed: ${err.message}`)
  }
  item.cdnUploading = false
}

// ── HEVC Trigger ─────────────────────────────────────────────────
const triggerHevc = async (item: VideoItem) => {
  try {
    const res = await $fetch<{ success: boolean; message?: string; actionsUrl?: string; error?: string }>('/api/trigger-hevc', {
      method: 'POST',
      body: {
        assetName: item.outputName,
        cdnProvider: item.cdnProvider,
        cdnPath: item.cdnPath || '/',
      },
    })
    if (!res.success) throw new Error(res.error || 'Trigger failed')
    item.hevcTriggered = true
    addToast?.('success', res.message || 'HEVC encoding triggered on GitHub Actions!')
    if (res.actionsUrl) {
      window.open(res.actionsUrl, '_blank')
    }
  } catch (err: any) {
    addToast?.('error', `HEVC trigger failed: ${err.message}`)
  }
}
</script>

<style scoped>
/* ── Tabs ──────────────────────────────────────────────── */
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  padding: 4px;
  border: 1px solid var(--border-subtle);
}

.tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.tab:hover { color: var(--text-primary); background: rgba(59,130,246,0.06); }
.tab.active { background: var(--bg-card); color: var(--text-primary); box-shadow: var(--shadow-sm); }

.tab-icon { font-size: 1.1rem; }

/* ── Queue ─────────────────────────────────────────────── */
.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.queue-actions { display: flex; gap: 10px; }
.status-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.log-toggle { font-size: 0.75rem; color: var(--text-muted); cursor: pointer; }
.log-toggle:hover { color: var(--text-primary); }

.log-output {
  margin-top: 8px;
  padding: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

/* ── Result Cards ──────────────────────────────────────── */
.result-card {
  margin-top: 16px;
  padding: 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
}

.result-card-video { background: rgba(59,130,246,0.06); border-color: rgba(59,130,246,0.2); }
.result-card-svga { background: rgba(139,92,246,0.06); border-color: rgba(139,92,246,0.2); }

.result-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 14px;
}

.result-content { display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap; }

.preview-video {
  max-width: 280px;
  max-height: 200px;
  border-radius: var(--radius-md);
  background: repeating-conic-gradient(#1a1a2e 0% 25%, #16162a 0% 50%) 50% / 20px 20px;
}

.result-details { flex: 1; min-width: 200px; }
.result-name { font-weight: 600; font-size: 0.95rem; color: var(--text-primary); margin-bottom: 12px; font-family: var(--font-mono); }

.result-actions-primary { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
.result-actions-secondary { display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }

.hevc-btn {
  border-color: rgba(16,185,129,0.3) !important;
  color: var(--accent-emerald) !important;
}
.hevc-btn:hover { background: rgba(16,185,129,0.1) !important; }

/* ── SVGA Stats ────────────────────────────────────────── */
.svga-stats { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.svga-thumb { background: var(--accent-violet-glow) !important; }

.stat-chip {
  padding: 4px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: 20px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-weight: 500;
}

/* ── Inline CDN Upload ─────────────────────────────────── */
.cdn-upload-inline {
  margin-top: 12px;
  padding: 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}

.cdn-url-result {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.cdn-url-link {
  font-size: 0.82rem;
  color: var(--accent-blue);
  word-break: break-all;
}

/* ── Spinner ───────────────────────────────────────────── */
.spinner {
  display: inline-block;
  border: 2px solid rgba(255,255,255,0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
