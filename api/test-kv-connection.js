/**
 * Test endpoint để kiểm tra kết nối Upstash Redis
 * GET /api/test-kv-connection - Test connection và trả về status
 */

export const config = {
  runtime: 'nodejs',
  maxDuration: 10,
};

export default async function handler(request) {
  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const results = {
    timestamp: new Date().toISOString(),
    envVars: {
      KV_REST_API_URL: process.env.KV_REST_API_URL ? 'SET' : 'NOT SET',
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'SET' : 'NOT SET',
      REDIS_URL: process.env.REDIS_URL ? 'SET' : 'NOT SET',
    },
    tests: [],
  };

  // Test 1: Kiểm tra env vars
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    results.tests.push({
      name: 'Environment Variables',
      status: 'FAIL',
      message: 'KV_REST_API_URL hoặc KV_REST_API_TOKEN chưa được set',
    });
    return new Response(
      JSON.stringify(results, null, 2),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  results.tests.push({
    name: 'Environment Variables',
    status: 'PASS',
    message: 'Tất cả env vars đã được set',
  });

  // Test 2: Kiểm tra URL format
  const url = process.env.KV_REST_API_URL;
  if (!url.startsWith('https://')) {
    results.tests.push({
      name: 'URL Format',
      status: 'FAIL',
      message: `URL không bắt đầu bằng https://: ${url.substring(0, 50)}`,
    });
  } else {
    results.tests.push({
      name: 'URL Format',
      status: 'PASS',
      message: `URL format hợp lệ: ${url.substring(0, 30)}...`,
    });
  }

  // Test 3: Test GET request với key test
  try {
    const testKey = 'test-connection';
    const testUrl = `${url}/get/${testKey}`;
    console.log(`[Test KV] Testing GET to: ${testUrl.substring(0, 50)}...`);
    
    const startTime = Date.now();
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
      },
      signal: AbortSignal.timeout(5000), // 5s timeout cho test
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json().catch(() => null);
      results.tests.push({
        name: 'GET Request',
        status: 'PASS',
        message: `GET request thành công trong ${duration}ms`,
        response: data,
      });
    } else {
      const errorText = await response.text().catch(() => 'Unknown error');
      results.tests.push({
        name: 'GET Request',
        status: response.status === 404 ? 'PASS' : 'FAIL',
        message: `GET request trả về ${response.status}: ${errorText.substring(0, 100)}`,
        duration: `${duration}ms`,
      });
    }
  } catch (error) {
    results.tests.push({
      name: 'GET Request',
      status: 'FAIL',
      message: `GET request failed: ${error.message}`,
      error: error.name,
    });
  }

  // Test 4: Test SET request với test value
  try {
    const testKey = 'test-connection';
    const testValue = JSON.stringify({ test: true, timestamp: Date.now() });
    const testUrl = `${url}/set/${testKey}`;
    console.log(`[Test KV] Testing POST to: ${testUrl.substring(0, 50)}...`);
    
    const startTime = Date.now();
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
        'Content-Type': 'text/plain',
      },
      body: testValue,
      signal: AbortSignal.timeout(5000), // 5s timeout cho test
    });
    
    const duration = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json().catch(() => null);
      results.tests.push({
        name: 'SET Request',
        status: 'PASS',
        message: `SET request thành công trong ${duration}ms`,
        response: data,
      });
    } else {
      const errorText = await response.text().catch(() => 'Unknown error');
      results.tests.push({
        name: 'SET Request',
        status: 'FAIL',
        message: `SET request trả về ${response.status}: ${errorText.substring(0, 100)}`,
        duration: `${duration}ms`,
      });
    }
  } catch (error) {
    results.tests.push({
      name: 'SET Request',
      status: 'FAIL',
      message: `SET request failed: ${error.message}`,
      error: error.name,
    });
  }

  const allPassed = results.tests.every(t => t.status === 'PASS');
  
  return new Response(
    JSON.stringify(results, null, 2),
    { 
      status: allPassed ? 200 : 500,
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}
