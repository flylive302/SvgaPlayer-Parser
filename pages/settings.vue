<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">⚙️ Settings</h1>
      <p class="page-subtitle">Configure CDN credentials and iOS HEVC encoding</p>
    </div>

    <!-- ── Cloudflare R2 ──────────────────────────────────────── -->
    <div class="card settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon" style="background:var(--accent-amber-glow);color:var(--accent-amber)">☁️</div>
        <div>
          <div class="settings-section-title">Cloudflare R2</div>
          <div class="settings-hint">Object storage for WebM, HEVC, and JSON assets</div>
        </div>
        <span class="badge" :class="r2Connected ? 'badge-emerald' : 'badge-rose'" style="margin-left:auto">
          {{ r2Connected ? 'Connected' : 'Not configured' }}
        </span>
      </div>

      <details class="help-details">
        <summary class="help-summary">How to get R2 credentials</summary>
        <div class="help-content">
          <ol>
            <li>Log into <a href="https://dash.cloudflare.com" target="_blank">Cloudflare Dashboard</a></li>
            <li>Go to <strong>R2 Object Storage</strong> → create a bucket</li>
            <li>Copy your <strong>Account ID</strong> from the URL or dashboard sidebar</li>
            <li>Go to <strong>Manage R2 API Tokens</strong> → create a token with read/write permissions</li>
            <li>Optionally set a custom domain under bucket settings</li>
          </ol>
        </div>
      </details>

      <div class="settings-grid">
        <div class="form-group">
          <label class="form-label">Account ID</label>
          <input v-model="r2.accountId" class="form-input" placeholder="Your Cloudflare Account ID" />
        </div>
        <div class="form-group">
          <label class="form-label">API Token</label>
          <input v-model="r2.apiToken" class="form-input" placeholder="R2 API Token" type="password" />
        </div>
        <div class="form-group">
          <label class="form-label">Bucket Name</label>
          <input v-model="r2.bucket" class="form-input" placeholder="my-assets" />
        </div>
        <div class="form-group">
          <label class="form-label">Custom Domain</label>
          <input v-model="r2.domain" class="form-input" placeholder="https://assets.example.com" />
        </div>
      </div>

      <div class="section-save">
        <button class="btn btn-primary btn-sm" @click="save('r2')" :disabled="saving.r2">
          {{ saving.r2 ? 'Saving...' : '💾 Save R2' }}
        </button>
      </div>
    </div>

    <!-- ── ImageKit ────────────────────────────────────────────── -->
    <div class="card settings-section">
      <div class="settings-section-header">
        <div class="settings-section-icon" style="background:var(--accent-violet-glow);color:var(--accent-violet)">🖼️</div>
        <div>
          <div class="settings-section-title">ImageKit</div>
          <div class="settings-hint">Alternative CDN with image optimization</div>
        </div>
        <span class="badge" :class="imagekitConnected ? 'badge-emerald' : 'badge-rose'" style="margin-left:auto">
          {{ imagekitConnected ? 'Connected' : 'Not configured' }}
        </span>
      </div>

      <details class="help-details">
        <summary class="help-summary">How to get ImageKit credentials</summary>
        <div class="help-content">
          <ol>
            <li>Sign up at <a href="https://imagekit.io" target="_blank">imagekit.io</a></li>
            <li>Go to <strong>Dashboard → Developer</strong> options</li>
            <li>Copy your <strong>URL Endpoint</strong>, <strong>Public Key</strong>, and <strong>Private Key</strong></li>
          </ol>
        </div>
      </details>

      <div class="settings-grid">
        <div class="form-group">
          <label class="form-label">URL Endpoint</label>
          <input v-model="imagekit.endpoint" class="form-input" placeholder="https://ik.imagekit.io/your_id" />
        </div>
        <div class="form-group">
          <label class="form-label">Public Key</label>
          <input v-model="imagekit.publicKey" class="form-input" placeholder="public_..." />
        </div>
        <div class="form-group">
          <label class="form-label">Private Key</label>
          <input v-model="imagekit.privateKey" class="form-input" placeholder="private_..." type="password" />
        </div>
      </div>

      <div class="section-save">
        <button class="btn btn-primary btn-sm" @click="save('imagekit')" :disabled="saving.imagekit">
          {{ saving.imagekit ? 'Saving...' : '💾 Save ImageKit' }}
        </button>
      </div>
    </div>

    <!-- ── iOS HEVC Setup Wizard ──────────────────────────────── -->
    <div class="card settings-section hevc-section">
      <div class="settings-section-header">
        <div class="settings-section-icon" style="background:var(--accent-emerald-glow);color:var(--accent-emerald)">🍎</div>
        <div>
          <div class="settings-section-title">iOS HEVC Encoding</div>
          <div class="settings-hint">Encode HEVC with alpha via GitHub Actions (macOS runner)</div>
        </div>
        <span class="badge" :class="githubConnected ? 'badge-emerald' : 'badge-rose'" style="margin-left:auto">
          {{ githubConnected ? 'Ready' : '3 steps required' }}
        </span>
      </div>

      <!-- Step-by-step wizard -->
      <div class="wizard">
        <!-- Step 1: Fork -->
        <div class="wizard-step">
          <div class="wizard-step-header">
            <div class="wizard-step-num" :class="{ done: github.repo }">①</div>
            <div class="wizard-step-title">Fork the repository</div>
          </div>
          <div class="wizard-step-body">
            <p>Fork <a href="https://github.com/AiCodeLab/AlphaConvert" target="_blank" class="link">AiCodeLab/AlphaConvert</a> to your own GitHub account. This gives you access to the macOS HEVC encoding workflow.</p>
          </div>
        </div>

        <!-- Step 2: Add secrets -->
        <div class="wizard-step">
          <div class="wizard-step-header">
            <div class="wizard-step-num">②</div>
            <div class="wizard-step-title">Add CDN secrets to your fork</div>
          </div>
          <div class="wizard-step-body">
            <p>Go to your fork → <strong>Settings → Secrets → Actions</strong> and add these secrets so the workflow can upload the encoded HEVC file to your CDN:</p>
            <div class="secret-list">
              <div class="secret-item">
                <code>CLOUDFLARE_ACCOUNT_ID</code>
                <span class="secret-desc">Your R2 account ID</span>
              </div>
              <div class="secret-item">
                <code>CLOUDFLARE_API_TOKEN</code>
                <span class="secret-desc">R2 API token with write access</span>
              </div>
              <div class="secret-item">
                <code>R2_BUCKET_NAME</code>
                <span class="secret-desc">Target R2 bucket</span>
              </div>
              <div class="secret-item">
                <code>R2_CUSTOM_DOMAIN</code>
                <span class="secret-desc">Custom domain (optional)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Enter PAT -->
        <div class="wizard-step">
          <div class="wizard-step-header">
            <div class="wizard-step-num" :class="{ done: github.pat }">③</div>
            <div class="wizard-step-title">Enter your GitHub PAT</div>
          </div>
          <div class="wizard-step-body">
            <p>Generate a Personal Access Token at <a href="https://github.com/settings/tokens" target="_blank" class="link">github.com/settings/tokens</a> with <code>actions:read+write</code> scope.</p>
            <div class="settings-grid" style="margin-top:12px">
              <div class="form-group">
                <label class="form-label">Personal Access Token (PAT)</label>
                <input v-model="github.pat" class="form-input" placeholder="github_pat_..." type="password" />
              </div>
              <div class="form-group">
                <label class="form-label">Repository (owner/repo)</label>
                <input v-model="github.repo" class="form-input" placeholder="your-user/AlphaConvert" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section-save">
        <button class="btn btn-success btn-sm" @click="save('github')" :disabled="saving.github">
          {{ saving.github ? 'Saving...' : '💾 Save GitHub Config' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Settings — AlphaConvert' })
const addToast = inject<(type: string, msg: string) => void>('addToast')

const saving = ref<Record<string, boolean>>({ r2: false, imagekit: false, github: false })

const r2 = ref({ accountId: '', apiToken: '', bucket: '', domain: '' })
const imagekit = ref({ endpoint: '', publicKey: '', privateKey: '' })
const github = ref({ pat: '', repo: '' })

const r2Connected = computed(() => !!r2.value.accountId && !!r2.value.apiToken)
const imagekitConnected = computed(() => !!imagekit.value.privateKey && !!imagekit.value.endpoint)
const githubConnected = computed(() => !!github.value.pat && !!github.value.repo)

const loadSettings = async () => {
  try {
    const data = await $fetch<Record<string, Record<string, string>>>('/api/settings')
    if (data?.r2) Object.assign(r2.value, data.r2)
    if (data?.imagekit) Object.assign(imagekit.value, data.imagekit)
    if (data?.github) Object.assign(github.value, data.github)
  } catch { /* no saved settings */ }
}

const save = async (provider: string) => {
  saving.value[provider] = true
  try {
    const configs: Record<string, any> = { r2: r2.value, imagekit: imagekit.value, github: github.value }
    await $fetch('/api/settings', {
      method: 'POST',
      body: { provider, config: configs[provider] },
    })
    addToast?.('success', `${provider} settings saved`)
  } catch (err: any) {
    addToast?.('error', `Failed to save: ${err.message || ''}`)
  }
  saving.value[provider] = false
}

onMounted(loadSettings)
</script>

<style scoped>
.settings-hint { font-size: 0.8rem; color: var(--text-muted); }
.section-save { margin-top: 16px; display: flex; justify-content: flex-end; }

/* ── Help Details ──────────────────────────────── */
.help-details {
  margin-bottom: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.help-summary {
  padding: 10px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent-blue);
  cursor: pointer;
  background: var(--bg-input);
  transition: background var(--transition-fast);
}

.help-summary:hover { background: var(--bg-secondary); }

.help-content {
  padding: 14px 18px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.7;
}

.help-content ol { padding-left: 20px; }
.help-content li { margin-bottom: 6px; }
.help-content a { color: var(--accent-blue); }

/* ── HEVC Section ──────────────────────────────── */
.hevc-section {
  border-color: rgba(16,185,129,0.25);
  background: linear-gradient(135deg, rgba(16,185,129,0.04), transparent);
}

.wizard { display: flex; flex-direction: column; gap: 4px; }

.wizard-step {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.wizard-step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-input);
}

.wizard-step-num {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 700;
  background: var(--bg-tertiary);
  color: var(--text-muted);
}

.wizard-step-num.done { background: var(--accent-emerald-glow); color: var(--accent-emerald); }

.wizard-step-title { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); }

.wizard-step-body {
  padding: 14px 16px;
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.wizard-step-body .link { color: var(--accent-blue); }
.wizard-step-body code {
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--accent-blue);
}

/* ── Secret List ──────────────────────────────── */
.secret-list { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }

.secret-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
}

.secret-item code {
  padding: 3px 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--accent-amber);
  white-space: nowrap;
}

.secret-desc { font-size: 0.78rem; color: var(--text-muted); }
</style>
