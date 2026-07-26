import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The backend defaults to http://localhost:8000. Override for a different port
// (e.g. if 8000 is taken) with:  VITE_API_TARGET=http://localhost:8008 npm run dev
const target = process.env.VITE_API_TARGET || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target, changeOrigin: true },
    },
  },
})
