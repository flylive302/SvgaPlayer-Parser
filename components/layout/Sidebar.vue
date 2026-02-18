<template>
  <header class="topbar-wrap">
    <nav class="topbar">
      <!-- Logo -->
      <NuxtLink to="/" class="topbar-brand">
        <svg class="brand-mark" width="24" height="24" viewBox="0 0 28 28" fill="none">
          <defs>
            <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#8b5cf6"/><stop offset="50%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#10b981"/>
            </linearGradient>
          </defs>
          <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" fill="url(#hg)" opacity="0.9"/>
          <path d="M14 6L22 10V18L14 22L6 18V10L14 6Z" fill="rgba(0,0,0,0.3)"/>
          <path d="M14 10L18 12V16L14 18L10 16V12L14 10Z" fill="white" opacity="0.9"/>
        </svg>
        <span class="brand-name">Alpha<span class="brand-accent">Convert</span></span>
      </NuxtLink>

      <!-- Center nav links -->
      <div class="topbar-links">
        <NuxtLink to="/convert" class="topbar-link" :class="{active: route.path === '/convert'}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          Convert
        </NuxtLink>
        <NuxtLink to="/cdn-upload" class="topbar-link" :class="{active: route.path === '/cdn-upload'}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16l-4-4-4 4"/><path d="M12 12v9"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
          CDN
        </NuxtLink>
        <NuxtLink to="/history" class="topbar-link" :class="{active: route.path.startsWith('/history')}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          History
        </NuxtLink>
        <NuxtLink to="/settings" class="topbar-link" :class="{active: route.path === '/settings'}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Settings
        </NuxtLink>
      </div>

      <!-- Right: env pill -->
      <div class="topbar-right">
        <span class="env-pill">
          <span class="env-dot" :class="isLinux ? 'warn' : 'ok'"></span>
          {{ isLinux ? 'Linux' : 'macOS' }}
        </span>
      </div>
    </nav>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()
const isLinux = ref(true)
onMounted(() => {
  isLinux.value = typeof navigator !== 'undefined' && !navigator.platform.includes('Mac')
})
</script>

<style scoped>
.topbar-wrap {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  width: calc(100% - 48px);
  max-width: 960px;
  animation: headerDrop 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes headerDrop {
  from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.topbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 20px;
  border-radius: 16px;
  background: rgba(10, 14, 28, 0.78);
  backdrop-filter: blur(24px) saturate(1.6);
  -webkit-backdrop-filter: blur(24px) saturate(1.6);
  border: 1px solid rgba(56, 78, 120, 0.18);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

/* ── Brand ──────────────────────────── */
.topbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.topbar-brand:hover { opacity: 0.85; }

.brand-mark { animation: logoSpin 20s linear infinite; }
@keyframes logoSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.brand-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.brand-accent { color: var(--accent-violet); }

/* ── Links ──────────────────────────── */
.topbar-links {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 0 auto;
}

.topbar-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 550;
  color: var(--text-muted);
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  white-space: nowrap;
}

.topbar-link:hover {
  color: var(--text-primary);
  background: rgba(139, 92, 246, 0.06);
}

.topbar-link.active {
  color: white;
  background: rgba(139, 92, 246, 0.1);
}

.topbar-link.active::after {
  content: '';
  position: absolute;
  bottom: 0; left: 50%;
  transform: translateX(-50%);
  width: 16px; height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, #8b5cf6, #3b82f6);
}

/* ── Right ──────────────────────────── */
.topbar-right { flex-shrink: 0; }

.env-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.5);
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--text-muted);
}

.env-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
}

.env-dot.ok { background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.4); }
.env-dot.warn { background: #f59e0b; box-shadow: 0 0 6px rgba(245,158,11,0.4); }
</style>
