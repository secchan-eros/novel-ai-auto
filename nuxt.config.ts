import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import pkg from './package.json'

fs.rmSync(path.join(__dirname, 'dist-electron'), {
  recursive: true,
  force: true,
})

const viteElectronBuildConfig = {
  build: {
    minify: process.env.NODE_ENV === 'production',
    rollupOptions: {
      external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
    },
  },
  resolve: {
    alias: {
      '~': __dirname,
    },
  },
}

export default defineNuxtConfig({
  ssr: false,
  devtools: { enabled: true },
  experimental: {
    appManifest: false,
  },
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
        vite: viteElectronBuildConfig,
      },
    ],
    renderer: [
      {
        resolve: {
          'electron-store': { type: 'cjs' },
        },
      },
    ],
  },
})
