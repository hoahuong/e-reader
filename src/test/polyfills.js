/**
 * Polyfills cho test environment
 * Load trước setup.js để fix webidl-conversions/whatwg-url errors
 * 
 * Lỗi "Cannot read properties of undefined (reading 'get')" xảy ra vì
 * webidl-conversions cần URL và URLSearchParams globals trước khi jsdom load
 */

// Polyfill URL và URLSearchParams cho Node.js environment
// Phải được execute synchronously, không dùng async/await
(function setupPolyfills() {
  if (typeof globalThis === 'undefined') return;
  
  // Polyfill cho URL - sử dụng Node.js built-in nếu có
  if (!globalThis.URL) {
    try {
      // Thử dùng require (CommonJS) - hoạt động trong Node.js
      const urlModule = typeof require !== 'undefined' ? require('url') : null;
      if (urlModule && urlModule.URL) {
        globalThis.URL = urlModule.URL;
        if (typeof global !== 'undefined') {
          global.URL = urlModule.URL;
        }
      } else {
        throw new Error('require not available');
      }
    } catch (e) {
      // Fallback: tạo mock URL class
      globalThis.URL = class URL {
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
      if (typeof global !== 'undefined') {
        global.URL = globalThis.URL;
      }
    }
  }
  
  // Polyfill cho URLSearchParams
  if (!globalThis.URLSearchParams) {
    try {
      // Thử dùng require (CommonJS) - hoạt động trong Node.js
      const urlModule = typeof require !== 'undefined' ? require('url') : null;
      if (urlModule && urlModule.URLSearchParams) {
        globalThis.URLSearchParams = urlModule.URLSearchParams;
        if (typeof global !== 'undefined') {
          global.URLSearchParams = urlModule.URLSearchParams;
        }
      } else {
        throw new Error('require not available');
      }
    } catch (e) {
      // Fallback: tạo mock URLSearchParams class
      globalThis.URLSearchParams = class URLSearchParams {
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
      if (typeof global !== 'undefined') {
        global.URLSearchParams = globalThis.URLSearchParams;
      }
    }
  }
})();

// Export để có thể import trong setup.js
export {};
