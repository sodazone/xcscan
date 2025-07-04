import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

import { viteEjsPlugin } from './vite.ejs.js'

export default defineConfig({
  plugins: [viteEjsPlugin(), tailwindcss()],
  build: {
    target: 'es2019',
    sourcemap: true,
    emptyOutDir: true,
    rollupOptions: {
      treeshake: 'recommended',
      input: {
        home: 'index.html',
        analytics: 'analytics/index.html',
        tx: 'tx/index.html',
        network: 'network/index.html',
      },
    },
  },
})
