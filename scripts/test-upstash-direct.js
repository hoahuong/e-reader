#!/usr/bin/env node
/**
 * Script để test Upstash Redis trực tiếp (không qua Vercel API)
 * Để xác định xem vấn đề là ở Upstash hay ở Vercel function
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

async function testUpstashDirect() {
  console.log('🧪 Testing Upstash Redis trực tiếp (không qua Vercel)...\n');
  
  const env = loadEnv();
  const kvUrl = process.env.KV_REST_API_URL || env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || env.KV_REST_API_TOKEN;
  
  if (!kvUrl || !kvToken) {
    console.error('❌ Missing KV_REST_API_URL or KV_REST_API_TOKEN');
    process.exit(1);
  }
  
  const testKey = 'pdf-metadata';
  const testValue = {
    catalogs: [
      { id: 'test-1', name: 'Test Catalog', files: [] }
    ],
    files: [
      { id: 'test-file-1', name: 'test.pdf', catalogId: 'test-1' }
    ],
    lastSync: Date.now(),
    version: 1,
  };
  
  const valueStr = JSON.stringify(testValue);
  const valueSize = new Blob([valueStr]).size;
  console.log(`📦 Test payload size: ${valueSize} bytes (${(valueSize/1024).toFixed(2)} KB)\n`);
  
  // Test SET với POST và body (giống như code trong api/kv-metadata.js)
  console.log('🧪 Test: SET với POST và body (giống như Vercel function)');
  try {
    const url = `${kvUrl}/set/${testKey}`;
    console.log(`  URL: ${url}`);
    console.log(`  Method: POST`);
    console.log(`  Content-Type: text/plain`);
    console.log(`  Body size: ${valueSize} bytes\n`);
    
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('  ⚠️ Timeout sau 5s - aborting...');
      controller.abort();
    }, 5000);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kvToken}`,
        'Content-Type': 'text/plain',
      },
      body: valueStr,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Headers:`, Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`  Response:`, JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log(`  Response (text):`, text.substring(0, 200));
    }
    
    if (response.ok) {
      console.log('  ✅ SET thành công\n');
    } else {
      console.log('  ❌ SET failed\n');
    }
  } catch (error) {
    console.error(`  ❌ SET error:`, {
      message: error.message,
      name: error.name,
      duration: Date.now() - startTime,
    });
    console.log('');
  }
  
  // Test GET
  console.log('🧪 Test: GET để verify');
  try {
    const url = `${kvUrl}/get/${testKey}`;
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${kvToken}`,
      },
      signal: AbortSignal.timeout(5000),
    });
    
    const duration = Date.now() - startTime;
    console.log(`  Status: ${response.status}`);
    console.log(`  Duration: ${duration}ms`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  Response:`, JSON.stringify(data, null, 2).substring(0, 300));
      console.log('  ✅ GET thành công\n');
    } else {
      const text = await response.text();
      console.log(`  Response:`, text.substring(0, 200));
      console.log('  ❌ GET failed\n');
    }
  } catch (error) {
    console.error(`  ❌ GET error:`, error.message);
  }
  
  console.log('✅ Test hoàn tất!');
}

testUpstashDirect().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
