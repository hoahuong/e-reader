import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
  server: {
    host: true, // Cho phép truy cập từ mạng local
    port: 5173,
    fs: {
      allow: ['..'],
    },
  },
})
