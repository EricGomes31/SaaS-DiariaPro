import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
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
