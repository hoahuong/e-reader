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
    // Headers để tránh COOP error với Google Picker
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups', // Cho phép popup từ same origin
      'Cross-Origin-Embedder-Policy': 'unsafe-none', // Không block cross-origin embeds
    },
    // Proxy API routes đến Vercel dev server nếu đang chạy
    // Hoặc sẽ fallback về mock/error nếu không có Vercel dev
    proxy: {
      '/api': {
        target: process.env.VERCEL_DEV_URL || 'http://localhost:3000',
        changeOrigin: true,
        // Nếu Vercel dev không chạy, sẽ trả về 404
        // Client code sẽ handle fallback về IndexedDB
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.warn('[Vite Proxy] API route không khả dụng, app sẽ fallback về IndexedDB');
            // Không cần làm gì, client sẽ handle
          });
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
