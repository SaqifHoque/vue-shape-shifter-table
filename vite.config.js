import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => ({
  plugins: [vue(), ...(mode === 'demo' ? [] : [{
    name: 'package-declarations',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'index.d.ts',
        source: readFileSync(new URL('./types/index.d.ts', import.meta.url), 'utf8'),
      })
    },
  }])],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  publicDir: mode === 'demo' ? 'public' : false,
  build: mode === 'demo'
    ? { outDir: 'demo-dist' }
    : {
        lib: {
          entry: fileURLToPath(new URL('./src/install.js', import.meta.url)),
          formats: ['es'],
          fileName: () => 'vue-shapeshifter-table.js',
        },
        rollupOptions: {
          external: ['vue'],
        },
      },
}))
