export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['nuxt-primevue'],
  primevue: {
    components: {
      prefix: 'Prime',
    },
    cssLayerOrder: 'tailwind-base, primevue, tailwind-utilities',
  },
  css: ['~/assets/css/tailwind.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  nitro: {
    serveStatic: true,
    devProxy: {
      '/novelai': {
        target: 'https://api.novelai.net',
        changeOrigin: true,
        secure: true,
        ws: true,
      },
    },
  },
})
