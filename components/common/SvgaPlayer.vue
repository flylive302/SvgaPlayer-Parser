<template>
    <canvas ref="canvas" :style="canvasStyle"></canvas>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue'
import {useSvgaPlayer} from '~/composables/useSvgaPlayer'

const props = defineProps({
    name: { type: String, default: '1' },
    width: { type: String, default: '50vw' },
    height: { type: String, default: '50vw' },
    loop: { type: Number, default: 0 }
})

const canvas = ref<HTMLCanvasElement | null>(null)
const playerInstance = ref<{ destroy: () => void } | null>(null)

const canvasStyle = computed(() => ({
    width: props.width,
    height: props.height
}))

onMounted(async () => {
    if (canvas.value) {
        try {
            playerInstance.value = await useSvgaPlayer(canvas.value, props.name!, props.loop!)
        } catch (error) {
            console.error('Error initializing SVGA player:', error)
        }
    }
})

onUnmounted(() => {
    if (playerInstance.value) {
        // Clean up the player instance to prevent lingering event callbacks.
        playerInstance.value.destroy()
        playerInstance.value = null
    }
})
</script>