<template>
  <nav class="sidebar">
    <div class="sidebar-header">
      <div class="sidebar-logo">
        <span class="sidebar-logo-icon">⚡</span>
        <div>
          <div class="sidebar-logo-text">FlyLive</div>
          <div class="sidebar-logo-sub">Asset Pipeline</div>
        </div>
      </div>
    </div>

    <div class="sidebar-nav">
      <NuxtLink to="/" class="nav-item" :class="{active: route.path === '/'}">
        <span class="nav-icon">📊</span>
        <span>Dashboard</span>
      </NuxtLink>

      <div class="nav-section-label">Converters</div>

      <NuxtLink to="/video" class="nav-item" :class="{active: route.path === '/video'}">
        <span class="nav-icon">🎬</span>
        <span>Video (MP4)</span>
      </NuxtLink>
      <NuxtLink to="/svga" class="nav-item" :class="{active: route.path === '/svga'}">
        <span class="nav-icon">✨</span>
        <span>SVGA</span>
      </NuxtLink>

      <div class="nav-section-label">Management</div>

      <NuxtLink to="/history" class="nav-item" :class="{active: route.path.startsWith('/history')}">
        <span class="nav-icon">📁</span>
        <span>History</span>
      </NuxtLink>
      <NuxtLink to="/settings" class="nav-item" :class="{active: route.path === '/settings'}">
        <span class="nav-icon">⚙️</span>
        <span>CDN Settings</span>
      </NuxtLink>
    </div>

    <div class="sidebar-footer">
      <div class="sidebar-env">
        <span class="status-dot" :class="isLinux ? 'pending' : 'success'"></span>
        <span>{{ isLinux ? 'Linux (WebM only)' : 'macOS (Full)' }}</span>
      </div>
      <div class="sidebar-version">v2.0.0</div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
const isLinux = ref(true)
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  z-index: 100;
  overflow-y: auto;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-logo-icon {
  font-size: 1.75rem;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-blue);
  border-radius: var(--radius-md);
}

.sidebar-logo-text {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

.sidebar-logo-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-section-label {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  padding: 16px 14px 6px;
  opacity: 0.6;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all var(--transition-fast);
  position: relative;
}

.nav-item:hover {
  background: rgba(59, 130, 246, 0.08);
  color: var(--text-primary);
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.12);
  color: var(--accent-blue);
  font-weight: 600;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  width: 3px;
  height: 24px;
  background: var(--accent-blue);
  border-radius: 0 3px 3px 0;
}

.nav-icon {
  font-size: 1.15rem;
  width: 24px;
  text-align: center;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-subtle);
}

.sidebar-env {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.sidebar-version {
  font-size: 0.7rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}
</style>
