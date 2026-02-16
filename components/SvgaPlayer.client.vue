<template>
  <div class="svga-player-wrapper">
    <canvas
      ref="canvasRef"
      class="svga-canvas"
      :style="canvasStyle"
    />
    <div class="svga-controls">
      <button class="svga-btn" @click="togglePlay" :title="isPlaying ? 'Pause' : 'Play'">
        {{ isPlaying ? '⏸' : '▶️' }}
      </button>
      <button class="svga-btn" @click="restart" title="Restart">🔄</button>
      <span class="svga-status">
        {{ isPlaying ? 'Playing' : 'Paused' }}
        <span v-if="fps"> · {{ fps }}fps</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  jsonUrl: string
  maxWidth?: number
  maxHeight?: number
}>()

const canvasRef = ref<HTMLCanvasElement>()
const isPlaying = ref(false)
const fps = ref(0)
const videoSize = ref({ width: 300, height: 300 })

// Compute canvas display size respecting maxWidth/maxHeight while keeping aspect ratio
const canvasStyle = computed(() => {
  const w = videoSize.value.width
  const h = videoSize.value.height
  const maxW = props.maxWidth || 400
  const maxH = props.maxHeight || 400

  let displayW = w
  let displayH = h

  if (displayW > maxW) {
    const scale = maxW / displayW
    displayW = maxW
    displayH = Math.round(h * scale)
  }
  if (displayH > maxH) {
    const scale = maxH / displayH
    displayH = maxH
    displayW = Math.round(displayW * scale)
  }

  return {
    width: `${displayW}px`,
    height: `${displayH}px`,
  }
})

let player: any = null

const initPlayer = async () => {
  if (!canvasRef.value) return

  try {
    // Dynamic import of svga player (client-side only)
    const svgaModule = await import('svga')
    const Player = svgaModule.Player

    // Fetch the pre-parsed JSON (already in Video format)
    const videoData = await $fetch<any>(props.jsonUrl)

    if (!videoData || !videoData.size) {
      console.error('Invalid SVGA data:', videoData)
      return
    }

    // Set canvas size
    videoSize.value = {
      width: videoData.size.width || 300,
      height: videoData.size.height || 300,
    }
    fps.value = videoData.fps || 20

    // Set actual canvas res
    canvasRef.value.width = videoData.size.width || 300
    canvasRef.value.height = videoData.size.height || 300

    // Create player
    player = new Player(canvasRef.value)

    // Handle images: convert base64 strings back to ImageBitmap for the player
    if (videoData.images) {
      const processedImages: Record<string, ImageBitmap | string> = {}
      for (const [key, value] of Object.entries(videoData.images)) {
        if (typeof value === 'string' && value.length > 0) {
          try {
            // Convert base64 to Blob then to ImageBitmap
            const binaryStr = atob(value as string)
            const bytes = new Uint8Array(binaryStr.length)
            for (let i = 0; i < binaryStr.length; i++) {
              bytes[i] = binaryStr.charCodeAt(i)
            }
            const blob = new Blob([bytes])
            const bitmap = await createImageBitmap(blob)
            processedImages[key] = bitmap
          } catch {
            // If ImageBitmap fails, fall back to base64 string
            processedImages[key] = value as string
          }
        }
      }
      videoData.images = processedImages
    }

    await player.mount(videoData)
    player.start()
    isPlaying.value = true
  } catch (err) {
    console.error('SVGA Player init error:', err)
  }
}

const togglePlay = () => {
  if (!player) return
  if (isPlaying.value) {
    player.pause()
    isPlaying.value = false
  } else {
    player.start()
    isPlaying.value = true
  }
}

const restart = () => {
  if (!player) return
  player.stop()
  player.start()
  isPlaying.value = true
}

onMounted(() => {
  nextTick(initPlayer)
})

onBeforeUnmount(() => {
  if (player) {
    try { player.destroy() } catch {}
    player = null
  }
})

// Watch for URL changes
watch(() => props.jsonUrl, () => {
  if (player) {
    try { player.destroy() } catch {}
    player = null
  }
  isPlaying.value = false
  nextTick(initPlayer)
})
</script>

<style scoped>
.svga-player-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: var(--radius-lg, 12px);
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
}

.svga-canvas {
  border-radius: var(--radius-md, 8px);
  background: transparent;
  image-rendering: auto;
}

.svga-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.svga-btn {
  padding: 4px 12px;
  background: var(--bg-tertiary, rgba(255,255,255,0.06));
  border: 1px solid var(--border-subtle, rgba(255,255,255,0.08));
  border-radius: 20px;
  color: var(--text-primary, #fff);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.svga-btn:hover {
  background: var(--accent-violet, #8b5cf6);
  border-color: var(--accent-violet, #8b5cf6);
}

.svga-status {
  font-size: 0.75rem;
  color: var(--text-muted, rgba(255,255,255,0.5));
  font-weight: 500;
}
</style>
