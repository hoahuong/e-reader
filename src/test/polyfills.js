/**
 * Polyfills cho test environment
 * Load trước setup.js để fix webidl-conversions/whatwg-url errors
 * 
 * Lỗi "Cannot read properties of undefined (reading 'get')" xảy ra vì
 * webidl-conversions cần URL và URLSearchParams globals trước khi jsdom load
 * 
 * IMPORTANT: File này phải được load TRƯỚC khi jsdom environment được initialize
 */

// Polyfill URL và URLSearchParams cho Node.js environment
// Phải được execute synchronously, không dùng async/await
(function setupPolyfills() {
  // Set globals cho cả globalThis và global
  const globals = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : {});
  
  // Polyfill cho URL - sử dụng Node.js built-in nếu có
  if (!globals.URL) {
    try {
      // Thử dùng require (CommonJS) - hoạt động trong Node.js
      // Sử dụng createRequire để tương thích với ESM
      let urlModule = null;
      if (typeof require !== 'undefined') {
        urlModule = require('url');
      } else if (typeof createRequire !== 'undefined') {
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        urlModule = require('url');
      }
      
      if (urlModule && urlModule.URL) {
        globals.URL = urlModule.URL;
        if (typeof global !== 'undefined' && global !== globals) {
          global.URL = urlModule.URL;
        }
        if (typeof globalThis !== 'undefined' && globalThis !== globals) {
          globalThis.URL = urlModule.URL;
        }
      } else {
        throw new Error('URL module not available');
      }
    } catch (e) {
      // Fallback: tạo mock URL class
      const MockURL = class URL {
        constructor(url, base) {
          this.href = String(url);
          this.origin = '';
          this.protocol = '';
          this.host = '';
          this.hostname = '';
          this.port = '';
          this.pathname = '';
          this.search = '';
          this.hash = '';
        }
        toString() { return this.href; }
      };
      globals.URL = MockURL;
      if (typeof global !== 'undefined' && global !== globals) {
        global.URL = MockURL;
      }
      if (typeof globalThis !== 'undefined' && globalThis !== globals) {
        globalThis.URL = MockURL;
      }
    }
  }
  
  // Polyfill cho URLSearchParams
  if (!globals.URLSearchParams) {
    try {
      // Thử dùng require (CommonJS) - hoạt động trong Node.js
      let urlModule = null;
      if (typeof require !== 'undefined') {
        urlModule = require('url');
      } else if (typeof createRequire !== 'undefined') {
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        urlModule = require('url');
      }
      
      if (urlModule && urlModule.URLSearchParams) {
        globals.URLSearchParams = urlModule.URLSearchParams;
        if (typeof global !== 'undefined' && global !== globals) {
          global.URLSearchParams = urlModule.URLSearchParams;
        }
        if (typeof globalThis !== 'undefined' && globalThis !== globals) {
          globalThis.URLSearchParams = urlModule.URLSearchParams;
        }
      } else {
        throw new Error('URLSearchParams module not available');
      }
    } catch (e) {
      // Fallback: tạo mock URLSearchParams class
      const MockURLSearchParams = class URLSearchParams {
        constructor(init) {
          this.params = new Map();
          if (init) {
            if (typeof init === 'string') {
              init.split('&').forEach(pair => {
                const [key, value] = pair.split('=');
                if (key) this.params.set(key, value || '');
              });
            } else if (Array.isArray(init)) {
              init.forEach(([key, value]) => this.params.set(key, value));
            }
          }
        }
        get(key) { return this.params.get(key); }
        set(key, value) { this.params.set(key, value); }
        has(key) { return this.params.has(key); }
        delete(key) { this.params.delete(key); }
        append(key, value) { this.params.set(key, value); }
        toString() {
          return Array.from(this.params.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join('&');
        }
      };
      globals.URLSearchParams = MockURLSearchParams;
      if (typeof global !== 'undefined' && global !== globals) {
        global.URLSearchParams = MockURLSearchParams;
      }
      if (typeof globalThis !== 'undefined' && globalThis !== globals) {
        globalThis.URLSearchParams = MockURLSearchParams;
      }
    }
  }
})();

// Export để có thể import trong setup.js
export {};
