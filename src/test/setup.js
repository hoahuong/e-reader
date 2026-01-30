// Import polyfills trước tiên
import './polyfills.js';

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup sau mỗi test
afterEach(() => {
  cleanup();
});

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
