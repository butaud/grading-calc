import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: ['butaud-hp-spectre-silver', '.ts.net'],
    hmr: {
      clientPort: 5173,
    },
  },
})
