import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup sau mỗi test
afterEach(() => {
  cleanup();
});

// Fix webidl-conversions và whatwg-url errors trong Node.js environment
// Các globals này cần được định nghĩa trước khi jsdom load
if (typeof globalThis !== 'undefined') {
  // Polyfill cho webidl-conversions
  if (!globalThis.URL) {
    globalThis.URL = class URL {
      constructor(url, base) {
        this.href = url;
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
  }
  
  if (!globalThis.URLSearchParams) {
    globalThis.URLSearchParams = class URLSearchParams {
      constructor() {
        this.params = new Map();
      }
      get(key) { return this.params.get(key); }
      set(key, value) { this.params.set(key, value); }
      has(key) { return this.params.has(key); }
      delete(key) { this.params.delete(key); }
      append(key, value) { this.params.set(key, value); }
    };
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock window.gapi cho Google Drive
if (typeof window !== 'undefined') {
  window.gapi = {
    client: {
      getToken: vi.fn(() => ({ access_token: 'mock-token' })),
    },
  };
}

// Mock DOMMatrix for pdfjs-dist
global.DOMMatrix = class DOMMatrix {
  constructor() {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
  }
  multiply() { return this; }
  translate() { return this; }
  scale() { return this; }
};
