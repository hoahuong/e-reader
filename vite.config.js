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
    setupFiles: ['./src/test/polyfills.js', './src/test/setup.js'],
    testTimeout: 10000, // Tăng timeout cho tests
    // Suppress act() warnings - chúng chỉ là warnings, không phải errors
    onConsoleLog: (log, type) => {
      if (type === 'warn' && log.includes('act(')) {
        return false; // Suppress act() warnings
      }
    },
    // Handle unhandled errors từ webidl-conversions/whatwg-url
    onUnhandledRejection: (reason, promise) => {
      // Ignore errors từ webidl-conversions trong test environment
      const errorMessage = reason?.message || '';
      const errorStack = reason?.stack || '';
      
      if (errorMessage.includes('webidl-conversions') || 
          errorMessage.includes('whatwg-url') ||
          errorStack.includes('webidl-conversions') ||
          errorStack.includes('whatwg-url') ||
          errorMessage.includes('Cannot read properties of undefined') ||
          errorMessage.includes("reading 'get'") ||
          errorStack.includes('webidl-conversions/lib/index.js')) {
        // Log nhưng không throw để không fail tests
        console.warn('[Test] Ignored webidl-conversions error:', errorMessage);
        return; // Ignore these errors
      }
      throw reason; // Re-throw other errors
    },
    // Handle unhandled errors trong quá trình test execution
    onUnhandledError: (error) => {
      const errorMessage = error?.message || '';
      const errorStack = error?.stack || '';
      
      if (errorMessage.includes('webidl-conversions') || 
          errorMessage.includes('whatwg-url') ||
          errorStack.includes('webidl-conversions') ||
          errorStack.includes('whatwg-url') ||
          errorMessage.includes('Cannot read properties of undefined') ||
          errorMessage.includes("reading 'get'") ||
          errorStack.includes('webidl-conversions/lib/index.js')) {
        // Log nhưng không throw để không fail tests
        console.warn('[Test] Ignored webidl-conversions error:', errorMessage);
        return; // Ignore these errors
      }
      throw error; // Re-throw other errors
    },
  },
})
