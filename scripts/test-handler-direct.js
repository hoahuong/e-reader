#!/usr/bin/env node
/**
 * Test handler function trực tiếp (không qua HTTP)
 * Để debug timeout issue ở local
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  const env = {};
  
  for (const file of envFiles) {
    try {
      const content = readFileSync(join(__dirname, '..', file), 'utf-8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          }
        }
      });
    } catch (e) {
      // File không tồn tại, bỏ qua
    }
  }
  
  return env;
}

// Set env vars từ .env.local
const env = loadEnv();
Object.assign(process.env, env);

// Import handler sau khi set env vars
const handlerModule = await import('../api/kv-metadata.js');
const handler = handlerModule.default;

// Mock Request object
class MockRequest {
  constructor(method, body = null) {
    this.method = method;
    this.url = 'http://localhost/api/kv-metadata';
    this.headers = new Map();
    this._body = body;
  }
  
  async json() {
    if (this._body) {
      return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
    }
    return {};
  }
  
  async text() {
    return typeof this._body === 'string' ? this._body : JSON.stringify(this._body);
  }
  
  get body() {
    return this._body;
  }
}

async function testHandler() {
  console.log('🧪 Testing handler function trực tiếp...\n');
  console.log('📋 Environment Variables:');
  console.log(`  KV_REST_API_URL: ${process.env.KV_REST_API_URL ? 'SET' : 'NOT SET'}`);
  console.log(`  KV_REST_API_TOKEN: ${process.env.KV_REST_API_TOKEN ? 'SET' : 'NOT SET'}\n`);
  
  // Test 1: GET request
  console.log('🧪 Test 1: GET request');
  try {
    const request = new MockRequest('GET');
    const startTime = Date.now();
    
    const response = await handler(request);
    const duration = Date.now() - startTime;
    
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Status: ${response.status}`);
    
    const text = await response.text();
    console.log(`  Response:`, text.substring(0, 300));
    
    if (response.ok) {
      console.log('  ✅ GET thành công\n');
    } else {
      console.log('  ❌ GET failed\n');
    }
  } catch (error) {
    console.error(`  ❌ GET error:`, {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    });
    console.log('');
  }
  
  // Test 2: POST request
  console.log('🧪 Test 2: POST request');
  try {
    const testPayload = {
      catalogs: [
        { id: 'test-1', name: 'Test Catalog', files: [] }
      ],
      files: [
        { id: 'test-file-1', name: 'test.pdf', catalogId: 'test-1' }
      ],
      lastSync: Date.now(),
    };
    
    const request = new MockRequest('POST', JSON.stringify(testPayload));
    const startTime = Date.now();
    
    const response = await handler(request);
    const duration = Date.now() - startTime;
    
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Status: ${response.status}`);
    
    const text = await response.text();
    console.log(`  Response:`, text.substring(0, 500));
    
    if (response.ok) {
      console.log('  ✅ POST thành công\n');
    } else {
      console.log('  ❌ POST failed\n');
    }
  } catch (error) {
    console.error(`  ❌ POST error:`, {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    });
    console.log('');
  }
  
  console.log('✅ Test hoàn tất!');
}

testHandler().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
