import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/upload':  { target: 'http://localhost:8001', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8001', changeOrigin: true },
    }
  }
})
