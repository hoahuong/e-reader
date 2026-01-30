#!/usr/bin/env node
/**
 * Script để test API route /api/kv-metadata local với vercel dev
 * Usage: node scripts/test-api-local.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env vars từ .env.local hoặc .env
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

async function testAPILocal() {
  console.log('🧪 Testing /api/kv-metadata locally...\n');
  
  const env = loadEnv();
  const apiUrl = process.env.VERCEL_DEV_URL || 'http://localhost:3000';
  
  console.log(`📡 API URL: ${apiUrl}/api/kv-metadata\n`);
  
  // Test 1: GET request
  console.log('🧪 Test 1: GET /api/kv-metadata');
  try {
    const startTime = Date.now();
    const response = await fetch(`${apiUrl}/api/kv-metadata`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const duration = Date.now() - startTime;
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Duration: ${duration}ms`);
    
    const data = await response.json();
    console.log(`  Response:`, JSON.stringify(data, null, 2).substring(0, 200));
    
    if (response.ok) {
      console.log('  ✅ GET request thành công\n');
    } else {
      console.log('  ❌ GET request failed\n');
    }
  } catch (error) {
    console.error(`  ❌ GET request error: ${error.message}\n`);
  }
  
  // Test 2: POST request
  console.log('🧪 Test 2: POST /api/kv-metadata');
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
    
    const startTime = Date.now();
    const response = await fetch(`${apiUrl}/api/kv-metadata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });
    const duration = Date.now() - startTime;
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Duration: ${duration}ms`);
    
    const data = await response.json();
    console.log(`  Response:`, JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('  ✅ POST request thành công\n');
    } else {
      console.log('  ❌ POST request failed\n');
    }
  } catch (error) {
    console.error(`  ❌ POST request error: ${error.message}\n`);
  }
  
  console.log('✅ Test hoàn tất!');
}

testAPILocal().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
