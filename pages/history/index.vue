<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">📁 History</h1>
      <p class="page-subtitle">All converted and uploaded assets</p>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'video' }" @click="activeTab = 'video'">
        🎬 Video Assets
        <span v-if="videoAssets.length" class="tab-count">{{ videoAssets.length }}</span>
      </button>
      <button class="tab" :class="{ active: activeTab === 'svga' }" @click="activeTab = 'svga'">
        ✨ SVGA Assets
        <span v-if="svgaAssets.length" class="tab-count">{{ svgaAssets.length }}</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" style="text-align:center; padding:48px">
      <div class="spinner"></div>
      <p style="margin-top:12px; color:var(--text-muted)">Loading assets...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="currentAssets.length === 0" class="empty-state">
      <div style="font-size:3rem; margin-bottom:12px">{{ activeTab === 'video' ? '🎬' : '✨' }}</div>
      <p>No {{ activeTab === 'video' ? 'video' : 'SVGA' }} assets yet.</p>
      <NuxtLink :to="activeTab === 'video' ? '/video' : '/svga'" class="btn btn-primary" style="margin-top:12px">
        Go to {{ activeTab === 'video' ? 'Video' : 'SVGA' }} Converter
      </NuxtLink>
    </div>

    <!-- Asset Table -->
    <div v-else class="card" style="margin-top:16px; overflow:hidden">
      <table class="asset-table">
        <thead>
          <tr>
            <th style="width:64px">Preview</th>
            <th>Name</th>
            <th>Formats</th>
            <th>Encoded</th>
            <th>CDN</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="asset in currentAssets" :key="asset.name" class="asset-row">
            <td>
              <div class="thumb-cell">
                <!-- Video: show thumbnail image or inline video -->
                <img
                  v-if="activeTab === 'video' && asset.thumbnail"
                  :src="asset.thumbnail"
                  class="table-thumb"
                  alt=""
                />
                <video
                  v-else-if="activeTab === 'video'"
                  :src="`/api/preview/webm/${asset.name}/playable.webm`"
                  class="table-thumb"
                  muted
                  loop
                  playsinline
                  @mouseenter="($event.target as HTMLVideoElement).play()"
                  @mouseleave="($event.target as HTMLVideoElement).pause()"
                />
                <!-- SVGA: show custom thumbnail or emoji -->
                <img
                  v-else-if="activeTab === 'svga' && asset.thumbnail"
                  :src="asset.thumbnail"
                  class="table-thumb"
                  alt=""
                />
                <span v-else class="table-thumb-fallback">✨</span>
              </div>
            </td>
            <td>
              <div class="asset-name-cell">
                <span class="asset-name-text">{{ asset.name }}</span>
              </div>
            </td>
            <td>
              <div class="format-chips">
                <span v-if="asset.formats?.webm" class="format-chip">WebM</span>
                <span v-if="asset.formats?.hevc" class="format-chip">HEVC</span>
                <span v-if="asset.formats?.json" class="format-chip">JSON</span>
              </div>
            </td>
            <td>
              <span class="date-text">{{ formatDate(asset.encoded_at) }}</span>
            </td>
            <td>
              <span v-if="asset.cdn_urls && asset.cdn_urls.length" class="badge badge-emerald">Uploaded</span>
              <span v-else class="badge badge-rose">Local</span>
            </td>
            <td>
              <div class="action-buttons">
                <NuxtLink
                  :to="`/history/${activeTab}/${asset.name}`"
                  class="btn btn-sm"
                  title="Edit"
                >✏️</NuxtLink>
                <button class="btn btn-danger btn-sm" @click="deleteAsset(asset.name)" title="Delete">🗑️</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Asset {
  name: string
  assetType: string
  formats: Record<string, string>
  thumbnail?: string
  encoded_at: string
  cdn_urls?: string[]
}

const addToast = inject<(type: string, msg: string) => void>('addToast')
const activeTab = ref<'video' | 'svga'>('video')
const loading = ref(true)
const assets = ref<Asset[]>([])

const videoAssets = computed(() => assets.value.filter(a => a.assetType !== 'svga'))
const svgaAssets = computed(() => assets.value.filter(a => a.assetType === 'svga'))
const currentAssets = computed(() => activeTab.value === 'video' ? videoAssets.value : svgaAssets.value)

const loadAssets = async () => {
  loading.value = true
  try {
    const data = await $fetch<{assets: Asset[]}>('/api/assets')
    assets.value = data.assets || []
  } catch {
    assets.value = []
  }
  loading.value = false
}

const formatDate = (iso: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const deleteAsset = async (name: string) => {
  if (!confirm(`Delete "${name}" and all its files?`)) return
  try {
    await $fetch(`/api/assets/${name}`, { method: 'DELETE' })
    assets.value = assets.value.filter(a => a.name !== name)
    addToast?.('success', `Deleted: ${name}`)
  } catch (err: any) {
    addToast?.('error', err.message || 'Delete failed')
  }
}

onMounted(loadAssets)
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-secondary);
  padding: 4px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  margin-top: 8px;
}

.tab {
  flex: 1;
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.tab:hover {
  color: var(--text-primary);
  background: rgba(59, 130, 246, 0.06);
}

.tab.active {
  background: rgba(59, 130, 246, 0.12);
  color: var(--accent-blue);
  font-weight: 600;
}

.tab-count {
  font-size: 0.72rem;
  background: rgba(59, 130, 246, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 64px 24px;
  color: var(--text-muted);
}

.asset-table {
  width: 100%;
  border-collapse: collapse;
}

.asset-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-subtle);
}

.asset-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.88rem;
}

.asset-row:hover {
  background: rgba(59, 130, 246, 0.03);
}

.asset-row:last-child td {
  border-bottom: none;
}

.asset-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.asset-name-text {
  font-weight: 600;
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

.thumb-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-thumb {
  max-width: 240px;
  max-height: 120px;
  object-fit: cover;
  border-radius: 6px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
}

.table-thumb-fallback {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
}

.format-chips {
  display: flex;
  gap: 4px;
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
}

.date-text {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.action-buttons {
  display: flex;
  gap: 6px;
}
</style>
