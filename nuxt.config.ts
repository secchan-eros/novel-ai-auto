export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['nuxt-primevue', '@vueuse/nuxt', 'nuxt-electron'],
  primevue: {
    components: {
      prefix: 'Prime',
    },
    cssLayerOrder: 'tailwind-base, primevue, tailwind-utilities',
  },
  css: [
    'primevue/resources/themes/nano/theme.css',
    'primeicons/primeicons.css',
    '~/assets/css/tailwind.css',
  ],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  nitro: {
    serveStatic: true,
    devProxy: {
      '/ai': {
        target: 'https://image.novelai.net/ai',
        changeOrigin: true,
        secure: true,
        ws: true,
      },
    },
  },
  runtimeConfig: {
    public: {
      novelaiToken: process.env.NUXT_PUBLIC_NOVELAI_TOKEN,
      downloadDir: process.env.NUXT_PUBLIC_DOWNLOAD_DIR,
    },
  },
  vite: {
    build: {
      target: 'esnext',
    },
  },
  electron: {
    build: [
      {
        // Main-Process entry file of the Electron App.
        entry: 'electron/main.ts',
      },
    ],
  },
})
