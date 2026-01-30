#!/usr/bin/env node
/**
 * Script để test API route /api/kv-metadata trên production
 * Usage: node scripts/test-api-production.js
 */

async function testAPIProduction() {
  const apiUrl = 'https://reader-online.vercel.app/api/kv-metadata';
  
  console.log('🧪 Testing /api/kv-metadata trên production...\n');
  console.log(`📡 API URL: ${apiUrl}\n`);
  
  // Test 1: GET request
  console.log('🧪 Test 1: GET /api/kv-metadata');
  try {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Headers:`, Object.fromEntries(response.headers.entries()));
    
    // Đọc response body
    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
      console.log(`  Response (JSON):`, JSON.stringify(data, null, 2).substring(0, 500));
    } else {
      const text = await response.text();
      console.log(`  Response (text):`, text.substring(0, 500));
      try {
        data = JSON.parse(text);
        console.log(`  Parsed JSON:`, JSON.stringify(data, null, 2).substring(0, 500));
      } catch (e) {
        console.log(`  Không phải JSON, giữ nguyên text`);
      }
    }
    
    if (response.ok) {
      console.log('  ✅ GET request thành công\n');
    } else {
      console.log('  ❌ GET request failed\n');
    }
  } catch (error) {
    console.error(`  ❌ GET request error:`, {
      message: error.message,
      name: error.name,
      cause: error.cause,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
    });
    console.log('');
  }
  
  // Test 2: POST request với test payload
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
    
    const payloadSize = JSON.stringify(testPayload).length;
    console.log(`  Payload size: ${payloadSize} bytes (${(payloadSize/1024).toFixed(2)} KB)`);
    
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout cho POST
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Headers:`, Object.fromEntries(response.headers.entries()));
    
    // Đọc response body
    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
      console.log(`  Response (JSON):`, JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log(`  Response (text):`, text);
      try {
        data = JSON.parse(text);
        console.log(`  Parsed JSON:`, JSON.stringify(data, null, 2));
      } catch (e) {
        console.log(`  Không phải JSON, giữ nguyên text`);
        data = { rawText: text };
      }
    }
    
    if (response.ok) {
      console.log('  ✅ POST request thành công\n');
    } else {
      console.log('  ❌ POST request failed\n');
    }
  } catch (error) {
    console.error(`  ❌ POST request error:`, {
      message: error.message,
      name: error.name,
      cause: error.cause,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
    });
    console.log('');
  }
  
  console.log('✅ Test hoàn tất!');
}

testAPIProduction().catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});
