<template>
  <div>
    <div class="page-header">
      <div style="display:flex; align-items:center; gap:12px">
        <NuxtLink to="/history" class="btn btn-sm">← Back</NuxtLink>
        <div>
          <h1 class="page-title">✨ {{ assetName }}</h1>
          <p class="page-subtitle">Edit SVGA asset & upload to CDN</p>
        </div>
      </div>
    </div>

    <div v-if="loading" style="text-align:center; padding:48px">
      <div class="spinner"></div>
    </div>

    <div v-else-if="!asset" class="empty-state">
      <p>Asset not found</p>
      <NuxtLink to="/history" class="btn btn-primary" style="margin-top:12px">Back to History</NuxtLink>
    </div>

    <div v-else>
      <!-- Preview Card -->
      <div class="card" style="margin-bottom:24px">
        <h2 class="card-title" style="margin-bottom:16px">Preview</h2>

        <!-- SVGA Animation Player -->
        <SvgaPlayer
          v-if="svgaJsonUrl"
          :json-url="svgaJsonUrl"
          :max-width="500"
          :max-height="400"
        />

        <!-- SVGA Stats -->
        <div v-if="svgaStats" class="svga-stats" style="margin-top:12px">
          <div class="stat-chip">🎞️ {{ svgaStats.frames }} frames</div>
          <div class="stat-chip">⏱️ {{ svgaStats.fps }} fps</div>
          <div class="stat-chip">📐 {{ svgaStats.width }}×{{ svgaStats.height }}</div>
          <div class="stat-chip">🖼️ {{ svgaStats.images }} images</div>
        </div>

        <!-- JSON Preview Toggle -->
        <div class="json-preview-toggle" @click="showJson = !showJson">
          {{ showJson ? '▼ Hide' : '▶ Show' }} JSON Preview
        </div>
        <div v-if="showJson" class="log-output" style="max-height:400px; overflow:auto; margin-top:8px">
          <pre style="white-space:pre-wrap; word-break:break-all; font-size:0.7rem">{{ jsonPreview }}</pre>
        </div>
      </div>

      <!-- Asset Info -->
      <div class="card" style="margin-bottom:24px">
        <h2 class="card-title" style="margin-bottom:16px">Asset Details</h2>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Format</span>
            <span class="format-chip">JSON</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Encoded</span>
            <span>{{ formatDate(asset.encoded_at) }}</span>
          </div>
          <div v-if="asset.cdn_urls?.length" class="detail-item" style="grid-column: span 2">
            <span class="detail-label">CDN URLs</span>
            <div class="cdn-urls">
              <div v-for="url in asset.cdn_urls" :key="url" class="cdn-url-item">
                <code>{{ url }}</code>
                <button class="btn btn-sm" @click="copyUrl(url)">📋</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CDN Upload Card -->
      <div class="card" style="margin-bottom:24px">
        <h2 class="card-title" style="margin-bottom:16px">☁️ Upload to CDN</h2>

        <!-- CDN Path -->
        <div class="action-section">
          <h3 class="action-title">CDN Path</h3>
          <div class="form-group" style="margin-bottom:0; max-width:400px">
            <input v-model="cdnPath" class="form-input" placeholder="/ (root)" />
            <span class="form-hint">Directory path on CDN. Default: /</span>
          </div>
        </div>

        <!-- Custom Thumbnail -->
        <div class="action-section">
          <h3 class="action-title">Thumbnail</h3>
          <div class="thumb-upload-row">
            <div class="thumb-section" v-if="thumbnailPreviewUrl">
              <img :src="thumbnailPreviewUrl" class="preview-thumb-sm" alt="Current thumbnail" />
              <span class="badge badge-emerald" style="font-size:0.7rem">Custom</span>
            </div>
            <label class="btn btn-sm btn-outline thumb-upload-btn">
              📁 {{ thumbnailPreviewUrl ? 'Replace' : 'Upload' }} Thumbnail
              <input type="file" accept="image/*" style="display:none" @change="handleThumbnailUpload" />
            </label>
            <span v-if="!thumbnailPreviewUrl" class="form-hint">Optional — no auto-generate for SVGA</span>
          </div>
        </div>

        <!-- CDN Targets -->
        <div class="action-section">
          <h3 class="action-title">CDN Providers</h3>
          <div class="cdn-config-row">
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Asset CDN</label>
              <select v-model="cdnTarget" class="form-select">
                <option value="r2">Cloudflare R2</option>
                <option value="imagekit">ImageKit</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">Thumbnail CDN</label>
              <select v-model="thumbCdnTarget" class="form-select">
                <option value="r2">Cloudflare R2</option>
                <option value="imagekit">ImageKit</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Upload Button -->
        <div style="margin-top:16px">
          <button class="btn btn-primary btn-lg" @click="uploadToCdn" :disabled="uploading">
            <span v-if="uploading" class="spinner" style="width:14px;height:14px;border-width:2px"></span>
            {{ uploading ? 'Uploading...' : '☁️ Upload to CDN' }}
          </button>
        </div>

        <div v-if="uploadLog" class="log-output" style="margin-top:12px">{{ uploadLog }}</div>
      </div>

      <!-- Actions Card -->
      <div class="card" style="margin-bottom:24px">
        <h2 class="card-title" style="margin-bottom:16px">Actions</h2>

        <!-- Rename -->
        <div class="action-section">
          <h3 class="action-title">Rename Asset</h3>
          <div style="display:flex; gap:12px; align-items:flex-end">
            <div class="form-group" style="flex:1; margin-bottom:0">
              <label class="form-label">New Name</label>
              <input v-model="newName" class="form-input" :placeholder="assetName" />
            </div>
            <button class="btn btn-primary" @click="renameAsset" :disabled="!newName || newName === assetName || saving">
              {{ saving ? 'Saving...' : 'Rename' }}
            </button>
          </div>
        </div>

        <!-- Delete -->
        <div class="action-section danger-section">
          <h3 class="action-title" style="color:var(--accent-rose)">⚠️ Danger Zone</h3>
          <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px">
            This will permanently delete all local files for this asset.
          </p>
          <button class="btn btn-danger" @click="deleteAsset" :disabled="deleting">
            {{ deleting ? 'Deleting...' : '🗑️ Delete Asset' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '~/composables/useFormatters'
const route = useRoute()
const router = useRouter()
const addToast = inject<(type: string, msg: string) => void>('addToast')

const assetName = computed(() => route.params.name as string)
const loading = ref(true)
const asset = ref<any>(null)
const svgaStats = ref<any>(null)
const jsonPreview = ref('')
const showJson = ref(false)
const newName = ref('')
const saving = ref(false)
const uploading = ref(false)
const deleting = ref(false)
const uploadLog = ref('')

// CDN upload config
const cdnPath = ref('/')
const cdnTarget = ref<'r2' | 'imagekit'>('r2')
const thumbCdnTarget = ref<'r2' | 'imagekit'>('r2')
const thumbnailPreviewUrl = ref('')
const svgaJsonUrl = ref('')

const loadAsset = async () => {
  loading.value = true
  try {
    const data = await $fetch<{assets: any[]}>('/api/assets')
    asset.value = (data.assets || []).find((a: any) => a.name === assetName.value)
    if (asset.value) {
      newName.value = asset.value.name
      cdnPath.value = asset.value.cdnPath || '/'
    }

    // Set the URL for the SVGA player component
    svgaJsonUrl.value = `/api/preview/svga/${assetName.value}/${assetName.value}.json`

    // Try to load JSON preview
    try {
      const json = await $fetch<any>(svgaJsonUrl.value)
      const jsonStr = JSON.stringify(json, null, 2)
      jsonPreview.value = jsonStr.substring(0, 3000) + (jsonStr.length > 3000 ? '\n...(truncated)' : '')

      // Extract stats from parsed data (new Video format)
      svgaStats.value = {
        frames: json.frames || 0,
        fps: json.fps || 0,
        width: json.size?.width || 0,
        height: json.size?.height || 0,
        images: Object.keys(json.images || {}).length,
      }
    } catch { /* no preview available */ }
  } catch { /* ignore */ }
  loading.value = false
}



const copyUrl = (url: string) => {
  navigator.clipboard.writeText(url)
  addToast?.('info', 'Copied!')
}

const handleThumbnailUpload = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', assetName.value)
    formData.append('assetType', 'svga')

    const res = await $fetch<{success: boolean, path?: string, error?: string}>('/api/upload-thumbnail', {
      method: 'POST', body: formData
    })

    if (res.success && res.path) {
      thumbnailPreviewUrl.value = `/api/preview/${res.path}?t=${Date.now()}`
      addToast?.('success', 'Custom thumbnail uploaded!')
    } else {
      addToast?.('error', res.error || 'Thumbnail upload failed')
    }
  } catch (err: any) {
    addToast?.('error', err.message || 'Thumbnail upload failed')
  }
  input.value = ''
}

const uploadToCdn = async () => {
  uploading.value = true
  uploadLog.value = ''
  try {
    const res = await $fetch<{success: boolean, log?: string, error?: string, urls?: string[]}>('/api/upload-cdn', {
      method: 'POST',
      body: {
        name: assetName.value,
        provider: cdnTarget.value,
        thumbProvider: thumbCdnTarget.value,
        cdnPath: cdnPath.value || '/',
        assetType: 'svga',
      }
    })

    uploadLog.value = res.log || ''
    if (res.success) {
      addToast?.('success', 'Uploaded to CDN!')
      await loadAsset()
    } else {
      addToast?.('error', res.error || 'CDN upload failed')
    }
  } catch (err: any) {
    addToast?.('error', err.message || 'CDN upload failed')
  }
  uploading.value = false
}

const renameAsset = async () => {
  saving.value = true
  try {
    await $fetch(`/api/assets/${assetName.value}`, { method: 'PUT', body: { newName: newName.value } })
    addToast?.('success', `Renamed to ${newName.value}`)
    router.push(`/history/svga/${newName.value}`)
  } catch (err: any) {
    addToast?.('error', err.message || 'Rename failed')
  }
  saving.value = false
}

const deleteAsset = async () => {
  if (!confirm(`Delete "${assetName.value}" and all its files?`)) return
  deleting.value = true
  try {
    await $fetch(`/api/assets/${assetName.value}`, { method: 'DELETE' })
    addToast?.('success', `Deleted: ${assetName.value}`)
    router.push('/history')
  } catch (err: any) {
    addToast?.('error', err.message || 'Delete failed')
  }
  deleting.value = false
}

onMounted(loadAsset)
</script>

<style scoped>
.svga-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
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
  color: var(--accent-violet);
  cursor: pointer;
  font-weight: 500;
}

.json-preview-toggle:hover {
  color: var(--accent-blue);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.format-chip {
  font-size: 0.7rem;
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  font-family: var(--font-mono);
  display: inline-block;
}

.cdn-urls {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cdn-url-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.cdn-url-item code {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--accent-violet);
}

.action-section {
  padding: 16px 0;
  border-bottom: 1px solid var(--border-subtle);
}

.action-section:last-child {
  border-bottom: none;
}

.action-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.cdn-config-row {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.thumb-upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  border: 1px dashed var(--border-subtle);
}

.thumb-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.preview-thumb-sm {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-subtle);
}

.thumb-upload-btn {
  font-size: 0.75rem;
  cursor: pointer;
}

.form-hint {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 4px;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

.btn-outline:hover {
  background: var(--bg-tertiary);
  border-color: var(--accent-violet);
  color: var(--accent-violet);
}

.danger-section {
  padding: 16px;
  border: 1px solid rgba(244, 63, 94, 0.2);
  border-radius: var(--radius-md);
  background: rgba(244, 63, 94, 0.04);
  margin-top: 4px;
}

.empty-state {
  text-align: center;
  padding: 64px 24px;
  color: var(--text-muted);
}
</style>
