# SVGA Player Integration (Nuxt 4 SPA)

## Context
- The only viable web implementation relies on `svga@2.1.1`; the package is archived and bundles both parser and player logic.
- The new Nuxt project runs as an SPA (`ssr: false`), so all SVGA work must execute on the client while still avoiding unnecessary bundle weight.
- Upstream will not ship fixes: lock the version, document the dependency risk, and audit it periodically (e.g. `npm audit` in CI).

## Installation & Configuration
1. Add the dependency and pin it: `npm install svga@2.1.1 --save-exact`.
2. In `nuxt.config.ts` enforce SPA mode and help Vite pre-optimize the ESM build:
   ```ts
   export default defineNuxtConfig({
     ssr: false,
     spaLoadingTemplate: 'app/spa-loading-template.html',
     vite: {
       optimizeDeps: { include: ['svga/dist/index.esm.min.js'] },
       build: {
         rollupOptions: {
           output: { manualChunks: { svga: ['svga/dist/index.esm.min.js'] } }
         }
       }
     }
   });
   ```
3. Place parsed animation JSON in `public/parsedAnimations`. Runtime fetches keep Vite from choking on dynamic imports.

## Plugin (Client Only)
Create `plugins/svga-player.client.ts`:
```ts
export default defineNuxtPlugin(async () => {
  const { Player } = await import('svga/dist/index.esm.min.js');

  const cache = new Map<string, Promise<any>>();
  const fetchAnimation = (name: string) => {
    if (!cache.has(name)) {
      cache.set(name, $fetch(`/parsedAnimations/${name}.json`));
    }
    return cache.get(name)!;
  };

  const createSvgaPlayer = async (options: {
    canvas: HTMLCanvasElement;
    name: string;
    loop?: number;
    autoplay?: boolean;
  }) => {
    const player = new Player({
      container: options.canvas,
      loop: options.loop ?? 0
    });
    const data = await fetchAnimation(options.name);
    await player.mount(data);
    if (options.autoplay ?? true) player.start();
    return player;
  };

  return {
    provide: { svga: { createSvgaPlayer } }
  };
});
```
- Lazily imports the ESM bundle so nothing runs during hydration bootstrap.
- Caches animation JSON to prevent repeat downloads.
- Only exposes player construction, leaving parser code untouched at runtime.

## Composable
`composables/useSvgaPlayer.ts`:
```ts
export const useSvgaPlayer = (canvas: Ref<HTMLCanvasElement | null>, options: {
  name: Ref<string>;
  loop?: Ref<number>;
  autoplay?: Ref<boolean>;
}) => {
  if (!import.meta.client) return { player: null };

  const player = shallowRef<Awaited<ReturnType<App['$svga']['createSvgaPlayer']>> | null>(null);
  const nuxtApp = useNuxtApp();

  const load = async () => {
    if (!canvas.value) return;
    player.value?.destroy();
    player.value = await nuxtApp.$svga.createSvgaPlayer({
      canvas: canvas.value,
      name: options.name.value,
      loop: options.loop?.value,
      autoplay: options.autoplay?.value
    });
  };

  watch([options.name, options.loop ?? ref(), options.autoplay ?? ref()], load);
  onMounted(load);
  onBeforeUnmount(() => player.value?.destroy());

  return { player, reload: load };
};
```

## Component
`components/SvgaPlayer.client.vue`:
```vue
<template>
  <canvas ref="canvas" :style="{ width, height }" />
  <slot />
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  name: string;
  width?: string;
  height?: string;
  loop?: number;
  autoplay?: boolean;
}>(), {
  width: '100%',
  height: '100%',
  loop: 0,
  autoplay: true
});

const canvas = ref<HTMLCanvasElement | null>(null);
const { reload } = useSvgaPlayer(canvas, {
  name: toRef(props, 'name'),
  loop: toRef(props, 'loop'),
  autoplay: toRef(props, 'autoplay')
});

defineExpose({ reload });
</script>
```

## Bundle Hygiene
- Tree shaking: importing `svga/dist/index.esm.min.js` lets Vite drop the parser; confirm via `npx vite-bundle-visualizer`.
- If parser code still appears, vendor a stripped build (e.g. copy the upstream ESM file to `vendor/svga-player-only.js` after pruning exports) and alias `"svga"` to it in `nuxt.config.ts`.
- Because the package is frozen, capture the SHA of the tarball and add it as a comment in `package.json` to detect tampering.

## Operational Notes
- Run a simple smoke test in CI that mounts the component in the SPA and plays one loop; this guards against accidental breakage when refactoring the plugin/composable.
- Document the dependency risk in the project README so future maintainers know why `svga` is pinned and how to replace it if a maintained fork appears.
- Periodically verify that parsed animation JSON still matches the expected schema, since you rely on the bundled parser during preprocessing even though the runtime only needs the player.
