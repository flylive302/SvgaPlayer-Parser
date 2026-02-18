<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">📁 History</h1>
      <p class="page-subtitle">Your recent conversions — metadata stored locally in SQLite</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card" style="text-align:center; padding:40px">
      <span class="spinner" style="width:24px; height:24px; border-width:3px"></span>
      <p style="margin-top:12px; color:var(--text-muted)">Loading history...</p>
    </div>

    <!-- Empty -->
    <div v-else-if="entries.length === 0" class="card" style="text-align:center; padding:48px">
      <div style="font-size:2rem; margin-bottom:12px">📁</div>
      <p style="color:var(--text-muted)">No conversions yet. Head to <NuxtLink to="/convert" style="color:var(--accent-blue)">Convert</NuxtLink> to get started.</p>
    </div>

    <!-- History List -->
    <div v-else>
      <!-- Filter -->
      <div class="filter-bar">
        <button class="filter-btn" :class="{ active: filter === 'all' }" @click="filter = 'all'">All ({{ entries.length }})</button>
        <button class="filter-btn" :class="{ active: filter === 'video' }" @click="filter = 'video'">🎬 Video ({{ videoCount }})</button>
        <button class="filter-btn" :class="{ active: filter === 'svga' }" @click="filter = 'svga'">✨ SVGA ({{ svgaCount }})</button>
      </div>

      <div class="history-list">
        <div v-for="entry in filteredEntries" :key="entry.id" class="history-card">
          <div class="history-icon" :class="entry.asset_type">
            {{ entry.asset_type === 'video' ? '🎬' : '✨' }}
          </div>
          <div class="history-info">
            <div class="history-name">{{ entry.name }}</div>
            <div class="history-meta">
              <span class="badge" :class="entry.asset_type === 'video' ? 'badge-blue' : 'badge-violet'">
                {{ entry.asset_type }}
              </span>
              <span v-if="entry.source_filename" class="history-source">{{ entry.source_filename }}</span>
              <span class="history-date">{{ formatDate(entry.created_at) }}</span>
            </div>
            <!-- CDN URLs -->
            <div v-if="entry.cdn_urls && entry.cdn_urls.length > 0" class="history-urls">
              <a v-for="(url, i) in entry.cdn_urls" :key="i" :href="url" target="_blank" class="cdn-url-chip">
                ☁️ {{ shortenUrl(url) }}
              </a>
            </div>
          </div>
          <div class="history-actions">
            <button class="btn btn-danger btn-sm" @click="deleteEntry(entry.id)" title="Delete">🗑️</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'History — AlphaConvert' })

const addToast = inject<(type: string, msg: string) => void>('addToast')

interface HistoryEntry {
  id: number; name: string; asset_type: string; source_filename: string | null;
  formats: Record<string, boolean>; cdn_urls: string[]; thumbnail_url: string | null;
  created_at: string;
}

const loading = ref(true)
const filter = ref<'all' | 'video' | 'svga'>('all')
const entries = ref<HistoryEntry[]>([])

const videoCount = computed(() => entries.value.filter(e => e.asset_type === 'video').length)
const svgaCount = computed(() => entries.value.filter(e => e.asset_type === 'svga').length)
const filteredEntries = computed(() =>
  filter.value === 'all' ? entries.value : entries.value.filter(e => e.asset_type === filter.value)
)

const fetchHistory = async () => {
  loading.value = true
  try {
    const res = await $fetch<{ entries: HistoryEntry[] }>('/api/history')
    entries.value = res.entries || []
  } catch {
    addToast?.('error', 'Failed to load history')
  }
  loading.value = false
}

const deleteEntry = async (id: number) => {
  try {
    await $fetch('/api/history', { method: 'DELETE', query: { id } })
    entries.value = entries.value.filter(e => e.id !== id)
    addToast?.('info', 'Entry deleted')
  } catch {
    addToast?.('error', 'Failed to delete entry')
  }
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

const shortenUrl = (url: string) => {
  try { return new URL(url).pathname.split('/').pop() || url } catch { return url }
}

onMounted(fetchHistory)
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-muted);
  font-family: var(--font-sans);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-btn:hover { color: var(--text-primary); border-color: var(--border-active); }
.filter-btn.active { background: var(--bg-card); color: var(--text-primary); border-color: var(--accent-blue); }

.history-list { display: flex; flex-direction: column; gap: 8px; }

.history-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.history-card:hover { border-color: var(--border-active); }

.history-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.history-icon.video { background: var(--accent-blue-glow); }
.history-icon.svga { background: var(--accent-violet-glow); }

.history-info { flex: 1; min-width: 0; }
.history-name { font-weight: 600; font-size: 0.92rem; color: var(--text-primary); margin-bottom: 4px; }

.history-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.history-source { font-size: 0.78rem; color: var(--text-muted); }
.history-date { font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono); }

.history-urls {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cdn-url-chip {
  padding: 3px 10px;
  background: rgba(16,185,129,0.1);
  border: 1px solid rgba(16,185,129,0.2);
  border-radius: 12px;
  font-size: 0.75rem;
  color: var(--accent-emerald);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.cdn-url-chip:hover { background: rgba(16,185,129,0.18); }

.history-actions { flex-shrink: 0; }

.spinner {
  display: inline-block;
  border: 3px solid rgba(255,255,255,0.2);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
