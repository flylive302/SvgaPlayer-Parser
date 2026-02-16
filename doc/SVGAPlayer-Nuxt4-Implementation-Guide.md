# SVGA Player Nuxt 4 Implementation Guide

Follow these atomic steps to stand up a fresh Nuxt 4 SPA in a new directory and wire in the SVGA player with lazy loading and cache-aware helpers.

1. `cd /path/to/your/workspace` to pick the parent folder for the new project.
2. `npx nuxi@latest init svga-player-spa` to scaffold the Nuxt 4 project (replace the name if you prefer a different folder).
3. `cd svga-player-spa` to enter the project directory.
4. `npm install` to pull the baseline Nuxt dependencies.
5. `npm install svga@2.1.1 --save-exact` to add and pin the archived SVGA package.
6. Open `package.json` and add a comment in the `svga` dependency block noting the pinned tarball SHA (capture it with `npm view svga@2.1.1 dist.integrity`).
7. Edit `nuxt.config.ts` so the default export matches:
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
8. `mkdir -p app` to ensure the loading-template directory exists.
9. Create `app/spa-loading-template.html` with a lightweight splash screen:
   ```html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="utf-8" />
       <title>Loading…</title>
       <style>
         body {
           margin: 0;
           display: grid;
           place-items: center;
           height: 100vh;
           font-family: system-ui, sans-serif;
           background: #0f172a;
           color: #e2e8f0;
         }
         .spinner {
           width: 48px;
           height: 48px;
           border: 4px solid rgba(226, 232, 240, 0.3);
           border-top-color: #38bdf8;
           border-radius: 50%;
           animation: spin 0.9s linear infinite;
         }
         @keyframes spin {
           to {
             transform: rotate(360deg);
           }
         }
       </style>
     </head>
     <body>
       <div>
         <div class="spinner"></div>
         <p>Preparing the app…</p>
       </div>
     </body>
   </html>
   ```
10. `mkdir -p plugins` to host client-only plugins.
11. Create `plugins/svga-player.client.ts` with:
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
12. `mkdir -p composables` to hold project composables.
13. Create `composables/useSvgaPlayer.ts` with:
    ```ts
    export const useSvgaPlayer = (
      canvas: Ref<HTMLCanvasElement | null>,
      options: {
        name: Ref<string>;
        loop?: Ref<number>;
        autoplay?: Ref<boolean>;
      }
    ) => {
      if (!import.meta.client) return { player: null };

      const player = shallowRef<
        Awaited<ReturnType<App['$svga']['createSvgaPlayer']>> | null
      >(null);
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
14. `mkdir -p components` if the directory is absent.
15. Create `components/SvgaPlayer.client.vue` with:
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
16. `mkdir -p public/parsedAnimations` to host the SVGA JSON payloads.
17. Copy your pre-parsed SVGA animation JSON files into `public/parsedAnimations` (one file per animation named `<animation>.json`).
18. Update any route or page that should render an animation (for example, add a client-only section to `pages/dashboard.vue`) to use the `SvgaPlayer` component:
    ```vue
    <template>
      <SvgaPlayer name="welcome" width="320px" height="320px" />
    </template>

    <script setup lang="ts">
    definePageMeta({ layout: false });
    </script>
    ```
19. `npm run dev` to start the Nuxt development server.
20. Visit `http://localhost:3000/your-route` to confirm the SPA bootstraps, the loading template appears briefly, and SVGA animations play after login.
21. Schedule a recurring `npm audit` (or similar) task in your CI pipeline to monitor the archived `svga@2.1.1` package for new advisories.
22. Document the dependency risk and playback architecture in your project README so future maintainers understand the locked dependency and runtime model.
