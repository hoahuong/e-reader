#!/usr/bin/env node

/**
 * Script test kết nối Upstash Redis trước khi deploy
 * Chạy: node scripts/test-kv-connection.js
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

async function testConnection() {
  console.log('🔍 Testing Upstash Redis Connection...\n');
  
  // Load env vars
  const env = loadEnv();
  const kvUrl = process.env.KV_REST_API_URL || env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || env.KV_REST_API_TOKEN;
  
  // Check env vars
  console.log('📋 Environment Variables Check:');
  console.log(`  KV_REST_API_URL: ${kvUrl ? '✅ SET' : '❌ NOT SET'}`);
  console.log(`  KV_REST_API_TOKEN: ${kvToken ? '✅ SET' : '❌ NOT SET'}`);
  
  if (!kvUrl || !kvToken) {
    console.error('\n❌ Missing environment variables!');
    console.error('Please set KV_REST_API_URL and KV_REST_API_TOKEN in .env.local');
    console.error('\nExample:');
    console.error('KV_REST_API_URL=https://your-region-your-name-your-id.upstash.io');
    console.error('KV_REST_API_TOKEN=your-token-here');
    process.exit(1);
  }
  
  // Check URL format
  console.log('\n🔗 URL Format Check:');
  if (!kvUrl.startsWith('https://')) {
    console.error(`❌ URL không bắt đầu bằng https://: ${kvUrl.substring(0, 50)}`);
    process.exit(1);
  }
  if (kvUrl.includes('/get/') || kvUrl.includes('/set/')) {
    console.error(`❌ URL không nên chứa /get/ hoặc /set/: ${kvUrl}`);
    process.exit(1);
  }
  console.log(`✅ URL format hợp lệ: ${kvUrl.substring(0, 40)}...`);
  
  // Test 1: GET request
  console.log('\n🧪 Test 1: GET Request');
  try {
    const testKey = 'test-connection';
    const url = `${kvUrl}/get/${testKey}`;
    console.log(`  Requesting: ${url.substring(0, 60)}...`);
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${kvToken}`,
      },
      signal: AbortSignal.timeout(5000), // 5s timeout
    });
    
    const duration = Date.now() - startTime;
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Duration: ${duration}ms`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ GET request thành công`);
      console.log(`  Response: ${JSON.stringify(data).substring(0, 100)}`);
    } else if (response.status === 404) {
      console.log(`  ✅ GET request thành công (404 = key không tồn tại, đây là bình thường)`);
    } else {
      const errorText = await response.text();
      console.error(`  ❌ GET request failed: ${errorText.substring(0, 200)}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`  ❌ GET request error: ${error.message}`);
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      console.error('  ⚠️  Request timeout - có thể do network hoặc Upstash không khả dụng');
    }
    process.exit(1);
  }
  
  // Test 2: SET request
  console.log('\n🧪 Test 2: SET Request');
  try {
    const testKey = 'test-connection';
    const testValue = JSON.stringify({ 
      test: true, 
      timestamp: Date.now(),
      message: 'Test connection từ local script'
    });
    const url = `${kvUrl}/set/${testKey}`;
    console.log(`  Requesting: ${url.substring(0, 60)}...`);
    console.log(`  Value size: ${new Blob([testValue]).size} bytes`);
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kvToken}`,
        'Content-Type': 'text/plain',
      },
      body: testValue,
      signal: AbortSignal.timeout(5000), // 5s timeout
    });
    
    const duration = Date.now() - startTime;
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Duration: ${duration}ms`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ SET request thành công`);
      console.log(`  Response: ${JSON.stringify(data).substring(0, 100)}`);
    } else {
      const errorText = await response.text();
      console.error(`  ❌ SET request failed: ${errorText.substring(0, 200)}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`  ❌ SET request error: ${error.message}`);
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      console.error('  ⚠️  Request timeout - có thể do network hoặc Upstash không khả dụng');
    }
    process.exit(1);
  }
  
  // Test 3: GET lại để verify SET
  console.log('\n🧪 Test 3: Verify SET (GET lại)');
  try {
    const testKey = 'test-connection';
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
    
    if (response.ok) {
      const data = await response.json();
      if (data.result) {
        const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
        console.log(`  ✅ GET lại thành công trong ${duration}ms`);
        console.log(`  Value: ${JSON.stringify(parsed).substring(0, 100)}`);
        
        if (parsed.test === true) {
          console.log(`  ✅ Value đã được lưu đúng`);
        } else {
          console.error(`  ❌ Value không đúng format`);
          process.exit(1);
        }
      } else {
        console.error(`  ❌ Response không có result field`);
        process.exit(1);
      }
    } else {
      const errorText = await response.text();
      console.error(`  ❌ GET lại failed: ${errorText.substring(0, 200)}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`  ❌ GET lại error: ${error.message}`);
    process.exit(1);
  }
  
  console.log('\n✅ Tất cả tests đều PASS!');
  console.log('🎉 Upstash Redis connection hoạt động tốt.');
  console.log('\n📝 Next steps:');
  console.log('  1. Verify env vars đã được set trên Vercel Dashboard');
  console.log('  2. Deploy code lên Vercel');
  console.log('  3. Test lại với /api/test-kv-connection endpoint');
}

testConnection().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
