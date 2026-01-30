/**
 * API route để lưu/đọc metadata từ Redis
 * GET /api/kv-metadata - Đọc metadata
 * POST /api/kv-metadata - Lưu metadata
 * 
 * Hỗ trợ 2 loại Redis:
 * 1. Upstash Redis (qua Vercel Marketplace) - Dùng REST API
 *    - KV_REST_API_URL (Upstash REST API URL)
 *    - KV_REST_API_TOKEN (Upstash REST API Token)
 * 
 * 2. Redis Labs hoặc Redis khác - Dùng Redis Client
 *    - REDIS_URL (Redis connection string, ví dụ: redis://...)
 */

export const config = {
  runtime: 'nodejs',
  maxDuration: 15, // Tăng lên 15s để đủ thời gian cho Upstash REST API
};

const METADATA_KEY = 'pdf-metadata';

// Lazy load Redis client (chỉ load khi cần)
let redisClient = null;

async function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  // Nếu có REDIS_URL, dùng Redis client (Redis Labs hoặc Redis khác)
  if (process.env.REDIS_URL) {
    const { createClient } = await import('redis');
    redisClient = createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();
    return redisClient;
  }

  return null;
}

/**
 * Helper function để gọi Upstash Redis REST API
 */
async function redisGetUpstash(key) {
  try {
    // Upstash REST API: GET command format
    // https://{region}-{database-name}-{id}.upstash.io/get/{key}
    const url = `${process.env.KV_REST_API_URL}/get/${key}`;
    console.log(`[KV Metadata] GET request to: ${url.substring(0, 50)}...`);
    console.log(`[KV Metadata] Token present: ${!!process.env.KV_REST_API_TOKEN}`);
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
      },
      // Add timeout để tránh hang
      signal: AbortSignal.timeout(10000), // 10s timeout để match với client
    });
    
    const duration = Date.now() - startTime;
    console.log(`[KV Metadata] GET response status: ${response.status}, ok: ${response.ok}, duration: ${duration}ms`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Redis GET failed: ${response.status} - ${errorText}`);
    }

    // Check content-type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[KV Metadata] Response không phải JSON:', text.substring(0, 200));
      throw new Error('Invalid response format from Redis API');
    }

    const data = await response.json();
    
    // Handle different Upstash response formats
    if (data && typeof data === 'object') {
      if (data.result !== undefined) {
        // Upstash returns { result: "stringified JSON" } or { result: object }
        try {
          if (typeof data.result === 'string') {
            return JSON.parse(data.result);
          } else if (typeof data.result === 'object') {
            return data.result;
          }
        } catch (parseError) {
          console.error('[KV Metadata] Error parsing Redis result:', parseError);
          return null;
        }
      }
      // Direct object response
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('[KV Metadata] Redis GET error:', error);
    // Handle timeout và network errors
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error('Redis request timeout - có thể do network hoặc Redis không khả dụng');
    }
    throw error;
  }
}

async function redisSetUpstash(key, value) {
  try {
    const valueStr = JSON.stringify(value);
    
    // Upstash REST API hỗ trợ POST với body cho JSON/binary values
    // Đây là cách tốt hơn cho payload lớn thay vì dùng GET với URL path
    // Theo docs: "To post a JSON or a binary value, you can use an HTTP POST request and set value as the request body"
    const response = await fetch(`${process.env.KV_REST_API_URL}/set/${key}`, {
      method: 'POST', // Dùng POST với body thay vì GET với URL path
      headers: {
        'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: valueStr, // Value trong body, không cần encode trong URL
      // Add timeout để tránh hang
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[KV Metadata] Redis SET failed: ${response.status} - ${errorText}`);
      throw new Error(`Redis SET failed: ${response.status} - ${errorText}`);
    }

    // Check content-type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[KV Metadata] SET response không phải JSON:', text.substring(0, 200));
      throw new Error('Invalid response format from Redis SET API');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('[KV Metadata] Redis SET error:', error);
    // Handle timeout và network errors
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error('Redis SET request timeout - có thể do network hoặc Redis không khả dụng');
    }
    throw error;
  }
}

/**
 * Unified Redis GET - Auto-detect Redis type
 */
async function redisGet(key) {
  // Nếu có REDIS_URL, dùng Redis client
  if (process.env.REDIS_URL) {
    try {
      const client = await getRedisClient();
      const value = await client.get(key);
      if (!value) return null;
      return JSON.parse(value);
    } catch (error) {
      console.error('[KV Metadata] Redis client GET error:', error);
      throw error;
    }
  }

  // Nếu có Upstash REST API credentials, dùng REST API
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return await redisGetUpstash(key);
  }

  throw new Error('No Redis configuration found. Need either REDIS_URL or KV_REST_API_URL + KV_REST_API_TOKEN');
}

/**
 * Unified Redis SET - Auto-detect Redis type
 */
async function redisSet(key, value) {
  // Nếu có REDIS_URL, dùng Redis client
  if (process.env.REDIS_URL) {
    try {
      const client = await getRedisClient();
      await client.set(key, JSON.stringify(value));
      return { success: true };
    } catch (error) {
      console.error('[KV Metadata] Redis client SET error:', error);
      throw error;
    }
  }

  // Nếu có Upstash REST API credentials, dùng REST API
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return await redisSetUpstash(key, value);
  }

  throw new Error('No Redis configuration found. Need either REDIS_URL or KV_REST_API_URL + KV_REST_API_TOKEN');
}

export default async function handler(request) {
  // Kiểm tra Redis đã được setup chưa
  const hasRedisUrl = !!process.env.REDIS_URL;
  const hasUpstash = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

  // Debug logging để điều tra nguyên nhân
  console.log('[KV Metadata] Handler called:', {
    method: request.method,
    hasRedisUrl,
    hasUpstash,
    kvUrl: process.env.KV_REST_API_URL ? `${process.env.KV_REST_API_URL.substring(0, 30)}...` : 'NOT SET',
    kvToken: process.env.KV_REST_API_TOKEN ? 'SET' : 'NOT SET',
  });

  if (!hasRedisUrl && !hasUpstash) {
    return new Response(
      JSON.stringify({ 
        error: 'Redis chưa được setup',
        details: 'Cần setup Redis bằng một trong các cách sau',
        options: [
          {
            name: 'Redis Labs hoặc Redis khác',
            envVars: ['REDIS_URL'],
            example: 'REDIS_URL=redis://default:password@host:port',
            instructions: [
              '1. Set REDIS_URL trong Vercel Dashboard → Settings → Environment Variables',
              '2. Format: redis://default:password@host:port',
              '3. Redeploy project'
            ]
          },
          {
            name: 'Upstash Redis (Vercel Marketplace)',
            envVars: ['KV_REST_API_URL', 'KV_REST_API_TOKEN'],
            instructions: [
              '1. Vào Vercel Dashboard → Project → Storage',
              '2. Click "Create Database" → "Upstash Redis"',
              '3. Connect với project',
              '4. Vercel sẽ tự động thêm env vars',
              '5. Redeploy project'
            ]
          }
        ]
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (request.method === 'GET') {
    try {
      console.log('[KV Metadata] GET request - Đang lấy metadata từ Redis...');
      
      const metadata = await redisGet(METADATA_KEY);
      
      if (metadata && typeof metadata === 'object') {
        console.log('[KV Metadata] Tìm thấy metadata trên Redis');
        return new Response(
          JSON.stringify(metadata),
          { 
            status: 200, 
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            } 
          }
        );
      } else {
        console.log('[KV Metadata] Không có metadata trên Redis, trả về empty');
        return new Response(
          JSON.stringify({
            catalogs: [],
            files: [],
            lastSync: null,
          }),
          { 
            status: 200, 
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache'
            } 
          }
        );
      }
    } catch (error) {
      console.error('[KV Metadata] Lỗi khi đọc:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      return new Response(
        JSON.stringify({ 
          error: 'Không thể đọc metadata từ Redis',
          details: errorMessage
        }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          } 
        }
      );
    }
  }

  if (request.method === 'POST') {
    try {
      const data = await request.json();
      const { catalogs, files, lastSync } = data;

      const metadata = {
        catalogs: catalogs || [],
        files: files || [],
        lastSync: lastSync || Date.now(),
        version: 1,
      };

      console.log('[KV Metadata] Đang lưu metadata lên Redis...');
      await redisSet(METADATA_KEY, metadata);
      
      console.log('[KV Metadata] Lưu thành công');
      return new Response(
        JSON.stringify({
          success: true,
          lastSync: metadata.lastSync,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('[KV Metadata] Lỗi khi lưu:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Không thể lưu metadata lên Redis',
          details: error.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: 'Method not allowed' }),
    { status: 405, headers: { 'Content-Type': 'application/json' } }
  );
}
