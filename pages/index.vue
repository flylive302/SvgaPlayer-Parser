<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Overview of your processed assets and pipeline status</p>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="card stat-card blue">
        <div class="stat-icon blue">📦</div>
        <div class="card-value">{{ assets.length }}</div>
        <div class="card-label">Total Assets</div>
      </div>
      <div class="card stat-card emerald">
        <div class="stat-icon emerald">✅</div>
        <div class="card-value">{{ uploadedCount }}</div>
        <div class="card-label">Uploaded to CDN</div>
      </div>
      <div class="card stat-card amber">
        <div class="stat-icon amber">🎬</div>
        <div class="card-value">{{ webmCount }}</div>
        <div class="card-label">WebM Files</div>
      </div>
      <div class="card stat-card violet">
        <div class="stat-icon violet">🍎</div>
        <div class="card-value">{{ hevcCount }}</div>
        <div class="card-label">HEVC Files</div>
      </div>
    </div>

    <!-- Asset Table -->
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h2 class="card-title">Processed Assets</h2>
        <button class="btn btn-secondary btn-sm" @click="refreshAssets">
          🔄 Refresh
        </button>
      </div>

      <div v-if="assets.length === 0" class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div class="empty-state-text">No assets processed yet</div>
        <div class="empty-state-hint">
          Go to <NuxtLink to="/upload" style="color:var(--accent-blue)">Upload & Process</NuxtLink> to get started
        </div>
      </div>

      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Formats</th>
            <th>Encoded</th>
            <th>CDN Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in assets" :key="a.name">
            <td>
              <span style="font-weight:600; color:var(--text-primary)">{{ a.name }}</span>
            </td>
            <td>
              <span :class="['badge', a.type === 'vip' ? 'badge-violet' : 'badge-blue']">
                {{ a.type }}
              </span>
            </td>
            <td>
              <span v-if="a.formats?.webm" class="badge badge-emerald" style="margin-right:4px">WebM</span>
              <span v-if="a.formats?.hevc" class="badge badge-amber">HEVC</span>
            </td>
            <td style="font-family:var(--font-mono); font-size:0.8rem;">
              {{ formatDate(a.encoded_at) }}
            </td>
            <td>
              <span class="status-dot success" style="margin-right:6px"></span>
              Uploaded
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
  type: string
  formats: { webm?: string; hevc?: string }
  thumbnail?: string
  encoded_at: string
}

const assets = ref<Asset[]>([])

const uploadedCount = computed(() => assets.value.length)
const webmCount = computed(() => assets.value.filter(a => a.formats?.webm).length)
const hevcCount = computed(() => assets.value.filter(a => a.formats?.hevc).length)

const formatDate = (iso: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const refreshAssets = async () => {
  try {
    const data = await $fetch<{assets: Asset[]}>('/api/assets')
    assets.value = data.assets || []
  } catch { /* empty */ }
}

onMounted(refreshAssets)
</script>