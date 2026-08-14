import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Carimbo único por build — usado para detectar nova versão publicada
const buildVersion = String(Date.now())

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion),
  },
  plugins: [
    tailwindcss(),
    react(),
    {
      name: 'landing-page-root',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url === '') {
            res.writeHead(302, { Location: '/apresentacao-diaria-pro.html' })
            res.end()
          } else {
            next()
          }
        })
      },
    },
    {
      // Grava dist/version.json com o mesmo carimbo embutido no bundle —
      // o app compara os dois para avisar quando há atualização no servidor
      name: 'version-json',
      apply: 'build',
      closeBundle() {
        writeFileSync(resolve('dist', 'version.json'), JSON.stringify({ version: buildVersion }))
      },
    },
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'react-vendor'
          if (id.includes('node_modules/framer-motion')) return 'motion'
          if (id.includes('node_modules/recharts')) return 'charts'
          if (id.includes('node_modules/date-fns')) return 'date'
          if (id.includes('node_modules/@supabase')) return 'supabase'
        },
      },
    },
  },
})
