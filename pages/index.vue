<template>
  <div class="home">
    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- HERO                                                    -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <section class="hero">
      <!-- Animated background orbs -->
      <div class="hero-bg">
        <div class="orb orb-violet"></div>
        <div class="orb orb-blue"></div>
        <div class="orb orb-emerald"></div>
      </div>

      <div class="hero-content">
        <div class="hero-eyebrow">
          <svg class="eyebrow-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          The alpha video toolkit for Web & iOS
        </div>

        <h1 class="hero-title">
          Convert <span class="title-highlight svga-hl">SVGA</span>,
          <span class="title-highlight webm-hl">WebM</span> &
          <span class="title-highlight hevc-hl">HEVC</span>
          <br>with transparency
        </h1>

        <p class="hero-desc">
          Parse SVGA animations to JSON. Encode alpha-packed MP4 to WebM VP9.
          Ship HEVC with alpha for Safari & iOS. All in one toolkit.
        </p>

        <div class="hero-ctas">
          <NuxtLink to="/convert" class="cta-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Start Converting
            <span class="cta-shimmer"></span>
          </NuxtLink>
          <a href="#features" class="cta-secondary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            See Features
          </a>
        </div>

        <!-- Format flow indicator -->
        <div class="format-flow">
          <span class="flow-chip svga">.svga</span>
          <svg class="flow-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          <span class="flow-chip json">.json</span>
          <span class="flow-sep">·</span>
          <span class="flow-chip mp4">.mp4 (α)</span>
          <svg class="flow-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          <span class="flow-chip webm">.webm</span>
          <svg class="flow-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          <span class="flow-chip hevc">.mov</span>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- THREE FEATURES (equal weight)                          -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <section id="features" class="features">
      <div class="feature-card" @mouseenter="activeFeature = 'svga'" :class="{ glow: activeFeature === 'svga' }">
        <div class="feature-border-glow svga-glow"></div>
        <div class="feature-icon-wrap svga-bg">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
            <line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/>
            <line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/>
          </svg>
        </div>
        <h3 class="feature-title">SVGA → JSON</h3>
        <p class="feature-desc">Parse & convert SVGA animation files into JSON bundles for web playback. <strong>No other tool does this.</strong></p>
        <div class="feature-flow">
          <span class="mini-badge svga">.svga</span>
          <span class="mini-arrow">→</span>
          <span class="mini-badge neutral">.json</span>
        </div>
        <div class="feature-platforms">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          <span>Any web browser</span>
        </div>
        <NuxtLink to="/convert" class="feature-cta svga-cta">Try SVGA Parser →</NuxtLink>
      </div>

      <div class="feature-card" @mouseenter="activeFeature = 'webm'" :class="{ glow: activeFeature === 'webm' }">
        <div class="feature-border-glow webm-glow"></div>
        <div class="feature-icon-wrap webm-bg">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </div>
        <h3 class="feature-title">MP4 → WebM VP9</h3>
        <p class="feature-desc">Convert alpha-packed side-by-side MP4 to WebM VP9 with embedded transparency for web.</p>
        <div class="feature-flow">
          <span class="mini-badge webm">.mp4 (α)</span>
          <span class="mini-arrow">→</span>
          <span class="mini-badge neutral">.webm</span>
        </div>
        <div class="feature-platforms">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          <span>Chrome · Firefox · Android</span>
        </div>
        <NuxtLink to="/convert" class="feature-cta webm-cta">Try Video Encoder →</NuxtLink>
      </div>

      <div class="feature-card" @mouseenter="activeFeature = 'hevc'" :class="{ glow: activeFeature === 'hevc' }">
        <div class="feature-border-glow hevc-glow"></div>
        <div class="feature-icon-wrap hevc-bg">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10"/>
            <path d="M16.5 3.5C16.5 3.5 18 5 18 8s-2 5-2 5"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </div>
        <h3 class="feature-title">HEVC + Alpha</h3>
        <p class="feature-desc">Encode HEVC with alpha channel via Apple VideoToolbox. Safari, iOS apps, macOS native.</p>
        <div class="feature-flow">
          <span class="mini-badge hevc">.webm</span>
          <span class="mini-arrow">→</span>
          <span class="mini-badge neutral">.mov</span>
        </div>
        <div class="feature-platforms">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83"/><path d="M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
          <span>Safari · iOS · macOS · tvOS</span>
        </div>
        <NuxtLink to="/settings" class="feature-cta hevc-cta">Set Up iOS →</NuxtLink>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- HOW IT WORKS                                           -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <section class="how-section">
      <h2 class="section-heading">How It Works</h2>
      <div class="pipeline">
        <div class="pipe-step">
          <div class="pipe-num">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <div class="pipe-label">Upload</div>
          <div class="pipe-sub">MP4, SVGA, or any file</div>
        </div>
        <div class="pipe-connector"><div class="pipe-line"></div></div>
        <div class="pipe-step">
          <div class="pipe-num active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div class="pipe-label">Convert</div>
          <div class="pipe-sub">WebM VP9 · JSON · HEVC</div>
        </div>
        <div class="pipe-connector"><div class="pipe-line"></div></div>
        <div class="pipe-step">
          <div class="pipe-num">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </div>
          <div class="pipe-label">Download</div>
          <div class="pipe-sub">Or upload to R2 / ImageKit</div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- FORMAT TABLE                                           -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <section class="formats-section">
      <h2 class="section-heading">Supported Formats</h2>
      <div class="formats-card">
        <table class="data-table">
          <thead>
            <tr><th>Input</th><th>Output</th><th>Platform</th></tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="fmt svga">.svga</span></td>
              <td><span class="fmt neutral">.json (bundle)</span></td>
              <td class="plat-cell">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
                Any browser
              </td>
            </tr>
            <tr>
              <td><span class="fmt webm">.mp4 (alpha)</span></td>
              <td><span class="fmt neutral">.webm VP9+α</span></td>
              <td class="plat-cell">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                Chrome · Firefox · Android
              </td>
            </tr>
            <tr>
              <td><span class="fmt hevc">.webm</span></td>
              <td><span class="fmt neutral">.mov HEVC+α</span></td>
              <td class="plat-cell">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47"/><path d="M13 3.5c.73-.83 1.94-1.46 2.94-1.5"/></svg>
                Safari · iOS native
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- iOS CALLOUT                                            -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <section class="ios-callout">
      <div class="ios-inner">
        <div class="ios-glow"></div>
        <div class="ios-text">
          <div class="ios-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83"/><path d="M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            Ship on Apple Platforms
          </div>
          <h2 class="ios-title">Transparent video for Safari & iOS</h2>
          <p class="ios-desc">HEVC with alpha — encoded via Apple VideoToolbox on GitHub Actions macOS runners. The only tool that does this end-to-end.</p>
          <NuxtLink to="/settings" class="ios-cta">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9"/></svg>
            Set Up HEVC Encoding →
          </NuxtLink>
        </div>
        <div class="ios-visual">
          <div class="apple-badges">
            <span class="apple-badge">Safari</span>
            <span class="apple-badge">iOS Apps</span>
            <span class="apple-badge">macOS</span>
            <span class="apple-badge">tvOS</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'AlphaConvert — SVGA, WebM & HEVC Alpha Video Toolkit' })
const activeFeature = ref('')
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════════ */
/* HERO                                                       */
/* ═══════════════════════════════════════════════════════════ */
.hero {
  position: relative;
  text-align: center;
  padding: 56px 0 48px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.25;
  animation: orbDrift 12s ease-in-out infinite alternate;
}

.orb-violet {
  width: 300px; height: 300px;
  background: #8b5cf6;
  top: -60px; left: 10%;
  animation-delay: 0s;
}

.orb-blue {
  width: 250px; height: 250px;
  background: #3b82f6;
  top: 20%; right: 5%;
  animation-delay: -4s;
}

.orb-emerald {
  width: 200px; height: 200px;
  background: #10b981;
  bottom: -40px; left: 40%;
  animation-delay: -8s;
}

@keyframes orbDrift {
  0% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.1); }
  66% { transform: translate(-20px, 30px) scale(0.95); }
  100% { transform: translate(10px, -10px) scale(1.05); }
}

.hero-content { position: relative; z-index: 1; }

.hero-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 18px;
  border-radius: 24px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.15);
  margin-bottom: 28px;
  animation: fadeInUp 0.6s ease;
}

.eyebrow-icon { color: #a78bfa; animation: boltPulse 2s ease infinite; }
@keyframes boltPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

.hero-title {
  font-size: 2.8rem;
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.18;
  color: var(--text-primary);
  margin-bottom: 22px;
  animation: fadeInUp 0.6s ease 0.1s both;
}

.title-highlight {
  position: relative;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.svga-hl { background-image: linear-gradient(135deg, #a78bfa, #c084fc); }
.webm-hl { background-image: linear-gradient(135deg, #60a5fa, #38bdf8); }
.hevc-hl { background-image: linear-gradient(135deg, #34d399, #2dd4bf); }

.hero-desc {
  max-width: 600px;
  margin: 0 auto 32px;
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--text-secondary);
  animation: fadeInUp 0.6s ease 0.2s both;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ── CTAs ──────────────────────────────── */
.hero-ctas {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 36px;
  animation: fadeInUp 0.6s ease 0.3s both;
}

.cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.92rem;
  color: white;
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  text-decoration: none;
  position: relative;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);
}

.cta-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(124, 58, 237, 0.4);
}

.cta-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
  transform: translateX(-100%);
  animation: shimmer 3s ease infinite;
}

@keyframes shimmer {
  0%, 100% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
}

.cta-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--text-secondary);
  background: rgba(30, 41, 70, 0.5);
  border: 1px solid rgba(56, 78, 120, 0.3);
  text-decoration: none;
  transition: all 0.2s;
}

.cta-secondary:hover { color: var(--text-primary); border-color: rgba(139, 92, 246, 0.3); }

/* ── Format Flow ──────────────────── */
.format-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  animation: fadeInUp 0.6s ease 0.4s both;
}

.flow-chip {
  padding: 5px 14px;
  border-radius: 8px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid;
}

.flow-chip.svga { background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.25); color: #a78bfa; }
.flow-chip.json { background: rgba(139,92,246,0.06); border-color: rgba(139,92,246,0.15); color: #c4b5fd; }
.flow-chip.mp4 { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.25); color: #60a5fa; }
.flow-chip.webm { background: rgba(59,130,246,0.06); border-color: rgba(59,130,246,0.15); color: #93c5fd; }
.flow-chip.hevc { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.25); color: #34d399; }

.flow-arrow { color: rgba(100,116,139,0.4); flex-shrink: 0; }
.flow-sep { color: rgba(100,116,139,0.3); margin: 0 4px; }

/* ═══════════════════════════════════════════════════════════ */
/* FEATURE CARDS                                              */
/* ═══════════════════════════════════════════════════════════ */
.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 56px;
}

.feature-card {
  position: relative;
  padding: 28px 24px 22px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(56, 78, 120, 0.15);
  border-radius: 16px;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.feature-card:hover {
  transform: translateY(-6px);
  border-color: rgba(139, 92, 246, 0.2);
}

.feature-border-glow {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  opacity: 0;
  transition: opacity 0.35s;
}

.feature-card:hover .feature-border-glow { opacity: 1; }

.svga-glow { background: linear-gradient(90deg, transparent, #8b5cf6, transparent); }
.webm-glow { background: linear-gradient(90deg, transparent, #3b82f6, transparent); }
.hevc-glow { background: linear-gradient(90deg, transparent, #10b981, transparent); }

.feature-card.glow::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  pointer-events: none;
}

.feature-icon-wrap {
  width: 52px; height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  margin-bottom: 18px;
  transition: transform 0.3s ease;
}

.feature-card:hover .feature-icon-wrap { transform: scale(1.08) rotate(-3deg); }

.svga-bg { background: rgba(139,92,246,0.12); color: #a78bfa; }
.webm-bg { background: rgba(59,130,246,0.12); color: #60a5fa; }
.hevc-bg { background: rgba(16,185,129,0.12); color: #34d399; }

.feature-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
  letter-spacing: -0.01em;
}

.feature-desc {
  font-size: 0.86rem;
  color: var(--text-secondary);
  line-height: 1.65;
  margin-bottom: 16px;
}

.feature-desc strong { color: var(--text-primary); }

.feature-flow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.mini-badge {
  padding: 3px 10px;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  border: 1px solid;
}

.mini-badge.svga { background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.2); color: #a78bfa; }
.mini-badge.webm { background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.2); color: #60a5fa; }
.mini-badge.hevc { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.2); color: #34d399; }
.mini-badge.neutral { background: rgba(30,41,70,0.5); border-color: rgba(56,78,120,0.2); color: var(--text-secondary); }
.mini-arrow { color: var(--text-muted); font-size: 0.85rem; }

.feature-platforms {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.feature-cta {
  display: inline-flex;
  align-items: center;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
}

.feature-cta:hover { transform: translateX(4px); }

.svga-cta { color: #a78bfa; }
.webm-cta { color: #60a5fa; }
.hevc-cta { color: #34d399; }

/* ═══════════════════════════════════════════════════════════ */
/* HOW IT WORKS                                               */
/* ═══════════════════════════════════════════════════════════ */
.how-section { margin-bottom: 56px; }

.section-heading {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 28px;
  color: var(--text-primary);
}

.pipeline {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0;
}

.pipe-step {
  text-align: center;
  padding: 24px 28px;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(56, 78, 120, 0.15);
  border-radius: 14px;
  min-width: 160px;
  transition: all 0.25s;
}

.pipe-step:hover {
  border-color: rgba(139, 92, 246, 0.2);
  transform: translateY(-3px);
}

.pipe-num {
  width: 44px; height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  margin: 0 auto 10px;
  background: rgba(30, 41, 70, 0.6);
  color: var(--text-muted);
  transition: all 0.25s;
}

.pipe-step:hover .pipe-num { color: var(--text-primary); background: rgba(139, 92, 246, 0.1); }
.pipe-num.active { background: linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.15)); color: #a78bfa; }

.pipe-label { font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.pipe-sub { font-size: 0.78rem; color: var(--text-muted); }

.pipe-connector {
  display: flex;
  align-items: center;
  padding-top: 32px;
  width: 40px;
  flex-shrink: 0;
}

.pipe-line { width: 100%; height: 1px; background: rgba(56, 78, 120, 0.2); }

/* ═══════════════════════════════════════════════════════════ */
/* FORMAT TABLE                                               */
/* ═══════════════════════════════════════════════════════════ */
.formats-section { margin-bottom: 56px; }

.formats-card {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(56, 78, 120, 0.15);
  border-radius: 14px;
  padding: 4px;
  overflow: hidden;
}

.fmt {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 600;
}

.fmt.svga { background: rgba(139,92,246,0.1); color: #a78bfa; }
.fmt.webm { background: rgba(59,130,246,0.1); color: #60a5fa; }
.fmt.hevc { background: rgba(16,185,129,0.1); color: #34d399; }
.fmt.neutral { background: rgba(30,41,70,0.5); color: var(--text-secondary); }

.plat-cell { display: flex; align-items: center; gap: 6px; color: var(--text-secondary); }

/* ═══════════════════════════════════════════════════════════ */
/* iOS CALLOUT                                                */
/* ═══════════════════════════════════════════════════════════ */
.ios-callout { margin-bottom: 48px; }

.ios-inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 32px;
  background: rgba(16, 185, 129, 0.04);
  border: 1px solid rgba(16, 185, 129, 0.15);
  border-radius: 16px;
  overflow: hidden;
  transition: border-color 0.3s;
}

.ios-inner:hover { border-color: rgba(16, 185, 129, 0.3); }

.ios-glow {
  position: absolute;
  top: -50px; right: -50px;
  width: 200px; height: 200px;
  background: #10b981;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.08;
  animation: orbDrift 10s ease-in-out infinite alternate;
}

.ios-text { flex: 1; position: relative; z-index: 1; }

.ios-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #34d399;
  margin-bottom: 12px;
}

.ios-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  margin-bottom: 10px;
}

.ios-desc {
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 18px;
}

.ios-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.85rem;
  color: white;
  background: linear-gradient(135deg, #059669, #10b981);
  text-decoration: none;
  transition: all 0.25s;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25);
}

.ios-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3); }

.ios-visual { flex-shrink: 0; position: relative; z-index: 1; }

.apple-badges {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.apple-badge {
  padding: 9px 22px;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  background: rgba(16, 185, 129, 0.08);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.15);
  text-align: center;
  transition: all 0.2s;
}

.apple-badge:hover {
  background: rgba(16, 185, 129, 0.14);
  transform: translateX(-4px);
}
</style>