// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  app: {
    head: {
      title: 'AlphaConvert — SVGA Parser, WebM VP9 & HEVC Alpha Video Converter',
      meta: [
        { name: 'description', content: 'Convert SVGA animations, alpha-packed MP4 to WebM VP9, and HEVC for iOS. The alpha video toolkit for Web & iOS.' },
        { name: 'keywords', content: 'SVGA converter, SVGA parser, alpha video, WebM VP9, HEVC alpha, transparent video, iOS video, alpha channel' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap'
        }
      ]
    }
  },
  css: ['~/assets/css/main.css'],
  nitro: {
    experimental: {
      openAPI: true
    }
  }
})
