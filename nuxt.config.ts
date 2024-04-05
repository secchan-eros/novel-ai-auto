export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['nuxt-primevue', '@vueuse/nuxt'],
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
    },
  },
})
