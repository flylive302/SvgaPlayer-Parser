<template>
  <div class="app-layout">
    <LayoutSidebar />
    <main class="app-main">
      <NuxtPage />
    </main>
    <!-- Toasts -->
    <div class="toast-container" v-if="toasts.length">
      <div v-for="t in toasts" :key="t.id" :class="['toast', `toast-${t.type}`]">
        <span>{{ t.icon }}</span>
        <span>{{ t.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const toasts = useState<Array<{id: number, type: string, message: string, icon: string}>>('toasts', () => [])

// Provide toast function globally
const addToast = (type: string, message: string) => {
  const icons: Record<string, string> = { success: '✅', error: '❌', info: 'ℹ️' }
  const id = Date.now()
  toasts.value.push({ id, type, message, icon: icons[type] || 'ℹ️' })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 4000)
}

provide('addToast', addToast)
</script>
