<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">CDN & GitHub Settings</h1>
      <p class="page-subtitle">Configure your Cloudflare R2, ImageKit, and GitHub Actions credentials</p>
    </div>

    <!-- Cloudflare R2 -->
    <div class="card settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon" style="background:var(--accent-amber-glow);color:var(--accent-amber)">☁️</div>
        <div>
          <div class="settings-section-title">Cloudflare R2</div>
          <div style="font-size:0.8rem; color:var(--text-muted)">Used for primary asset hosting at assets.flyliveapp.com</div>
        </div>
        <span
          class="badge"
          :class="r2Connected ? 'badge-emerald' : 'badge-rose'"
          style="margin-left:auto"
        >
          {{ r2Connected ? 'Connected' : 'Not configured' }}
        </span>
      </div>

      <div class="settings-grid">
        <div class="form-group">
          <label class="form-label">Account ID</label>
          <input v-model="settings.r2AccountId" class="form-input" placeholder="Your Cloudflare Account ID" type="text" />
        </div>
        <div class="form-group">
          <label class="form-label">API Token</label>
          <input v-model="settings.r2ApiToken" class="form-input" placeholder="Cloudflare API Token (R2 read/write)" type="password" />
        </div>
        <div class="form-group">
          <label class="form-label">Bucket Name</label>
          <input v-model="settings.r2Bucket" class="form-input" placeholder="flylive-assets" />
        </div>
        <div class="form-group">
          <label class="form-label">Custom Domain</label>
          <input v-model="settings.r2Domain" class="form-input" placeholder="https://assets.flyliveapp.com" />
        </div>
      </div>
    </div>

    <!-- ImageKit -->
    <div class="card settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon" style="background:var(--accent-violet-glow);color:var(--accent-violet)">🖼️</div>
        <div>
          <div class="settings-section-title">ImageKit</div>
          <div style="font-size:0.8rem; color:var(--text-muted)">Alternative CDN for image and video assets</div>
        </div>
        <span
          class="badge"
          :class="imagekitConnected ? 'badge-emerald' : 'badge-rose'"
          style="margin-left:auto"
        >
          {{ imagekitConnected ? 'Connected' : 'Not configured' }}
        </span>
      </div>

      <div class="settings-grid">
        <div class="form-group">
          <label class="form-label">URL Endpoint</label>
          <input v-model="settings.imagekitEndpoint" class="form-input" placeholder="https://ik.imagekit.io/your_id" />
        </div>
        <div class="form-group">
          <label class="form-label">Public Key</label>
          <input v-model="settings.imagekitPublicKey" class="form-input" placeholder="public_..." />
        </div>
        <div class="form-group">
          <label class="form-label">Private Key</label>
          <input v-model="settings.imagekitPrivateKey" class="form-input" placeholder="private_..." type="password" />
        </div>
      </div>
    </div>

    <!-- GitHub Actions -->
    <div class="card settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon" style="background:rgba(110,84,148,0.15);color:#8b5cf6">🐙</div>
        <div>
          <div class="settings-section-title">GitHub Actions</div>
          <div style="font-size:0.8rem; color:var(--text-muted)">Remote HEVC encoding on macOS runners</div>
        </div>
        <span
          class="badge"
          :class="githubConnected ? 'badge-emerald' : 'badge-rose'"
          style="margin-left:auto"
        >
          {{ githubConnected ? 'Connected' : 'Not configured' }}
        </span>
      </div>

      <div class="settings-grid">
        <div class="form-group">
          <label class="form-label">Personal Access Token (PAT)</label>
          <input v-model="settings.githubPat" class="form-input" placeholder="github_pat_..." type="password" />
          <span class="form-hint">Generate at github.com/settings/tokens — needs Actions read/write</span>
        </div>
        <div class="form-group">
          <label class="form-label">Repository (owner/repo)</label>
          <input v-model="settings.githubRepo" class="form-input" placeholder="flylive302/SvgaPlayer-Parser" />
        </div>
      </div>
    </div>

    <!-- Save Button -->
    <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:8px;">
      <button class="btn btn-secondary" @click="loadSettings">
        🔄 Reset
      </button>
      <button class="btn btn-success btn-lg" @click="saveSettings" :disabled="isSaving">
        <span v-if="isSaving" class="spinner" style="width:14px;height:14px;border-width:2px"></span>
        {{ isSaving ? 'Saving...' : '💾 Save Settings' }}
      </button>
    </div>

    <!-- Wrangler Info -->
    <div class="card" style="margin-top:32px">
      <div class="settings-section-header" style="border-bottom:none;margin-bottom:0;padding-bottom:0">
        <div class="settings-section-icon" style="background:var(--accent-blue-glow);color:var(--accent-blue)">ℹ️</div>
        <div>
          <div class="settings-section-title">How R2 Upload Works</div>
        </div>
      </div>
      <div style="color:var(--text-secondary);font-size:0.875rem;line-height:1.7;padding:0 4px">
        <p>R2 uploads use the <code style="color:var(--accent-blue);font-family:var(--font-mono);font-size:0.8rem;">wrangler</code> CLI under the hood. Make sure it's installed:</p>
        <div class="log-output" style="margin:12px 0">npm install -g wrangler
wrangler login</div>
        <p style="margin-top:8px">Alternatively, set <code style="color:var(--accent-blue);font-family:var(--font-mono);font-size:0.8rem;">CLOUDFLARE_API_TOKEN</code> as an environment variable for headless authentication (e.g. in CI).</p>
        <p style="margin-top:12px"><strong>HEVC encoding</strong> requires macOS. Use the
          <a href="https://github.com/" style="color:var(--accent-blue)">GitHub Actions workflow</a>
          (macos-latest runner) to encode HEVC remotely.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Settings {
  r2AccountId: string
  r2ApiToken: string
  r2Bucket: string
  r2Domain: string
  imagekitEndpoint: string
  imagekitPublicKey: string
  imagekitPrivateKey: string
  githubPat: string
  githubRepo: string
}

const addToast = inject<(type: string, msg: string) => void>('addToast')
const isSaving = ref(false)

const settings = ref<Settings>({
  r2AccountId: '',
  r2ApiToken: '',
  r2Bucket: 'flylive-assets',
  r2Domain: 'https://assets.flyliveapp.com',
  imagekitEndpoint: '',
  imagekitPublicKey: '',
  imagekitPrivateKey: '',
  githubPat: '',
  githubRepo: 'flylive302/SvgaPlayer-Parser'
})

const r2Connected = computed(() => !!settings.value.r2AccountId && !!settings.value.r2ApiToken)
const imagekitConnected = computed(() => !!settings.value.imagekitPrivateKey && !!settings.value.imagekitEndpoint)
const githubConnected = computed(() => !!settings.value.githubPat && !!settings.value.githubRepo)

const loadSettings = async () => {
  try {
    const data = await $fetch<Settings>('/api/settings')
    if (data) {
      settings.value = { ...settings.value, ...data }
    }
  } catch { /* no saved settings */ }
}

const saveSettings = async () => {
  isSaving.value = true
  try {
    await $fetch('/api/settings', {
      method: 'POST',
      body: settings.value
    })
    addToast?.('success', 'Settings saved to .env file')
  } catch (err: any) {
    addToast?.('error', 'Failed to save settings: ' + (err.message || ''))
  } finally {
    isSaving.value = false
  }
}

onMounted(loadSettings)
</script>
