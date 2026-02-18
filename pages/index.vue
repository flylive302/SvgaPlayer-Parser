<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-badge">SVGA · WebM · HEVC</div>
      <h1 class="hero-title">
        The Alpha Video Toolkit<br>
        <span class="hero-title-accent">for Web & iOS</span>
      </h1>
      <p class="hero-subtitle">
        Convert SVGA animations, alpha-packed MP4 to WebM VP9, and HEVC with transparency.
        Ship transparent video on every platform.
      </p>
      <div class="hero-actions">
        <NuxtLink to="/convert" class="btn btn-primary btn-lg hero-cta">
          ⚡ Start Converting
        </NuxtLink>
        <a href="#features" class="btn btn-secondary btn-lg">
          ↓ See Features
        </a>
      </div>
    </section>

    <!-- Three Pillars -->
    <section id="features" class="pillars">
      <div class="pillar pillar-svga">
        <div class="pillar-icon-wrap svga">
          <span class="pillar-icon">✨</span>
        </div>
        <h2 class="pillar-title">SVGA Parser</h2>
        <p class="pillar-desc">
          Parse & convert SVGA animations into JSON bundles for web playback.
          <strong>No other online tool does this.</strong>
        </p>
        <div class="pillar-formats">
          <span class="format-badge">.svga</span>
          <span class="format-arrow">→</span>
          <span class="format-badge">.json</span>
        </div>
        <NuxtLink to="/convert" class="pillar-cta svga">Try SVGA →</NuxtLink>
      </div>

      <div class="pillar pillar-webm">
        <div class="pillar-icon-wrap webm">
          <span class="pillar-icon">🎬</span>
        </div>
        <h2 class="pillar-title">WebM VP9</h2>
        <p class="pillar-desc">
          Convert alpha-packed side-by-side MP4 to WebM VP9 with embedded transparency.
          Chrome, Firefox, Android.
        </p>
        <div class="pillar-formats">
          <span class="format-badge">.mp4 (α)</span>
          <span class="format-arrow">→</span>
          <span class="format-badge">.webm</span>
        </div>
        <NuxtLink to="/convert" class="pillar-cta webm">Try Video →</NuxtLink>
      </div>

      <div class="pillar pillar-hevc">
        <div class="pillar-icon-wrap hevc">
          <span class="pillar-icon">🍎</span>
        </div>
        <h2 class="pillar-title">HEVC + Alpha</h2>
        <p class="pillar-desc">
          Encode HEVC with alpha via Apple VideoToolbox.
          Safari, iOS native apps, macOS.
        </p>
        <div class="pillar-formats">
          <span class="format-badge">.webm</span>
          <span class="format-arrow">→</span>
          <span class="format-badge">.mov</span>
        </div>
        <NuxtLink to="/convert" class="pillar-cta hevc">Try iOS →</NuxtLink>
      </div>
    </section>

    <!-- How It Works -->
    <section class="how-it-works">
      <h2 class="section-title">How It Works</h2>
      <div class="steps">
        <div class="step">
          <div class="step-number">①</div>
          <div class="step-label">Upload</div>
          <div class="step-desc">Drop your MP4 or SVGA file</div>
        </div>
        <div class="step-connector"></div>
        <div class="step">
          <div class="step-number">②</div>
          <div class="step-label">Convert</div>
          <div class="step-desc">Configure options & encode</div>
        </div>
        <div class="step-connector"></div>
        <div class="step">
          <div class="step-number">③</div>
          <div class="step-label">Download</div>
          <div class="step-desc">Get your files or upload to CDN</div>
        </div>
      </div>
    </section>

    <!-- Format Grid -->
    <section class="format-grid-section">
      <h2 class="section-title">Supported Formats</h2>
      <div class="card format-grid-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Input</th>
              <th>Output</th>
              <th>Platform</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="badge badge-blue">.mp4 (alpha)</span></td>
              <td><span class="badge badge-blue">.webm VP9+α</span></td>
              <td>Chrome, Firefox, Android</td>
            </tr>
            <tr>
              <td><span class="badge badge-violet">.svga</span></td>
              <td><span class="badge badge-violet">.json bundle</span></td>
              <td>Any web browser</td>
            </tr>
            <tr>
              <td><span class="badge badge-blue">.webm</span></td>
              <td><span class="badge badge-emerald">.mov HEVC+α</span></td>
              <td>Safari, iOS native apps</td>
            </tr>
            <tr>
              <td>Any converted file</td>
              <td><span class="badge badge-amber">CDN URL</span></td>
              <td>R2, ImageKit</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- iOS Marketing Section -->
    <section class="ios-section">
      <div class="card ios-card">
        <div class="ios-content">
          <div class="ios-text">
            <div class="ios-eyebrow">🍎 iOS & Safari Support</div>
            <h2 class="ios-title">Ship transparent video on Apple platforms</h2>
            <p class="ios-desc">
              HEVC with alpha — encoded via Apple VideoToolbox on GitHub Actions.
              Works on Safari, iOS apps, and macOS. The only tool that does this end-to-end.
            </p>
            <NuxtLink to="/settings" class="btn btn-success">
              Set Up iOS Encoding →
            </NuxtLink>
          </div>
          <div class="ios-visual">
            <div class="ios-badge-stack">
              <span class="ios-plat-badge">Safari</span>
              <span class="ios-plat-badge">iOS Apps</span>
              <span class="ios-plat-badge">macOS</span>
              <span class="ios-plat-badge">tvOS</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'AlphaConvert — SVGA, WebM & HEVC Alpha Video Toolkit',
})
</script>

<style scoped>
/* ── Hero ───────────────────────────────────────────────────────── */
.hero {
  text-align: center;
  padding: 48px 0 56px;
}

.hero-badge {
  display: inline-block;
  padding: 6px 18px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.15), rgba(16,185,129,0.15));
  color: var(--text-secondary);
  border: 1px solid rgba(139,92,246,0.2);
  margin-bottom: 24px;
}

.hero-title {
  font-size: 2.75rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--text-primary);
  margin-bottom: 20px;
}

.hero-title-accent {
  background: linear-gradient(135deg, #8b5cf6, #3b82f6, #10b981);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  max-width: 600px;
  margin: 0 auto 32px;
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--text-secondary);
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.hero-cta {
  position: relative;
  overflow: hidden;
}

.hero-cta::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transform: translateX(-100%);
  animation: ctaShimmer 3s infinite;
}

@keyframes ctaShimmer {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

/* ── Three Pillars ──────────────────────────────────────────────── */
.pillars {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 56px;
}

.pillar {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 28px 24px;
  text-align: center;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.pillar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.pillar-svga::before { background: linear-gradient(135deg, #8b5cf6, #a855f7); }
.pillar-webm::before { background: var(--gradient-blue); }
.pillar-hevc::before { background: var(--gradient-emerald); }

.pillar:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.pillar-svga:hover { border-color: rgba(139,92,246,0.4); box-shadow: 0 8px 32px rgba(139,92,246,0.15); }
.pillar-webm:hover { border-color: rgba(59,130,246,0.4); box-shadow: 0 8px 32px rgba(59,130,246,0.15); }
.pillar-hevc:hover { border-color: rgba(16,185,129,0.4); box-shadow: 0 8px 32px rgba(16,185,129,0.15); }

.pillar-icon-wrap {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  font-size: 1.5rem;
}

.pillar-icon-wrap.svga { background: var(--accent-violet-glow); }
.pillar-icon-wrap.webm { background: var(--accent-blue-glow); }
.pillar-icon-wrap.hevc { background: var(--accent-emerald-glow); }

.pillar-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: var(--text-primary);
}

.pillar-desc {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
}

.pillar-desc strong {
  color: var(--text-primary);
}

.pillar-formats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.format-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.78rem;
  font-family: var(--font-mono);
  font-weight: 500;
  background: var(--bg-input);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
}

.format-arrow {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.pillar-cta {
  display: inline-block;
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
  transition: all var(--transition-fast);
}

.pillar-cta.svga { color: var(--accent-violet); }
.pillar-cta.webm { color: var(--accent-blue); }
.pillar-cta.hevc { color: var(--accent-emerald); }

.pillar-cta:hover { transform: translateX(4px); }

/* ── How It Works ───────────────────────────────────────────────── */
.how-it-works {
  margin-bottom: 56px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 28px;
  background: linear-gradient(135deg, #e2e8f0, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.step {
  text-align: center;
  padding: 28px 32px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  min-width: 180px;
  transition: all var(--transition-base);
}

.step:hover {
  background: var(--bg-card-hover);
  border-color: var(--border-active);
}

.step-number {
  font-size: 2rem;
  margin-bottom: 8px;
}

.step-label {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.step-desc {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.step-connector {
  width: 40px;
  height: 2px;
  background: var(--border-subtle);
  flex-shrink: 0;
}

/* ── Format Grid ────────────────────────────────────────────────── */
.format-grid-section {
  margin-bottom: 56px;
}

.format-grid-card {
  overflow: hidden;
}

/* ── iOS Section ────────────────────────────────────────────────── */
.ios-section {
  margin-bottom: 56px;
}

.ios-card {
  background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.05));
  border-color: rgba(16,185,129,0.25);
}

.ios-card:hover {
  border-color: rgba(16,185,129,0.4);
  box-shadow: 0 0 30px rgba(16,185,129,0.1);
}

.ios-content {
  display: flex;
  align-items: center;
  gap: 40px;
}

.ios-text {
  flex: 1;
}

.ios-eyebrow {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-emerald);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 12px;
}

.ios-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  line-height: 1.3;
}

.ios-desc {
  font-size: 0.92rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 20px;
}

.ios-visual {
  flex-shrink: 0;
}

.ios-badge-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ios-plat-badge {
  padding: 8px 20px;
  border-radius: var(--radius-md);
  font-size: 0.82rem;
  font-weight: 600;
  background: rgba(16,185,129,0.12);
  color: var(--accent-emerald);
  border: 1px solid rgba(16,185,129,0.2);
  text-align: center;
}
</style>