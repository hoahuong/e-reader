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
  maxDuration: 25, // Tăng lên 25s để đủ thời gian cho Upstash REST API (có buffer cho large payloads)
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('[KV Metadata] Aborting GET request due to timeout');
    controller.abort();
  }, 10000); // 10s timeout
  
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
      signal: controller.signal,
    });
    
    // Cleanup timeout ngay khi có response
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    console.log(`[KV Metadata] GET response status: ${response.status}, ok: ${response.ok}, duration: ${duration}ms`);

    if (!response.ok) {
      if (response.status === 404) {
        // Consume body để đảm bảo connection được đóng
        await response.text().catch(() => null);
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
    // Đảm bảo cleanup timeout trong catch
    clearTimeout(timeoutId);
    console.error('[KV Metadata] Redis GET error:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
      url: `${process.env.KV_REST_API_URL}/get/${key}`,
      hasToken: !!process.env.KV_REST_API_TOKEN,
    });
    // Handle timeout và network errors
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error('Redis request timeout - có thể do network hoặc Redis không khả dụng');
    }
    throw error;
  }
}

async function redisSetUpstash(key, value) {
  // Kiểm tra env vars trước
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error('KV_REST_API_URL hoặc KV_REST_API_TOKEN chưa được set');
  }
  
  // Kiểm tra URL format
  const baseUrl = process.env.KV_REST_API_URL;
  if (!baseUrl.startsWith('https://')) {
    throw new Error(`KV_REST_API_URL không hợp lệ (phải bắt đầu bằng https://): ${baseUrl}`);
  }
  if (baseUrl.includes('/get/') || baseUrl.includes('/set/')) {
    throw new Error(`KV_REST_API_URL không nên chứa /get/ hoặc /set/: ${baseUrl}`);
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error('[KV Metadata] ⚠️ SET request TIMEOUT sau 5s - có thể do connection issue');
    controller.abort();
  }, 5000); // Giảm xuống 5s để phát hiện sớm connection issues
  
  try {
    const valueStr = JSON.stringify(value);
    const valueSize = new Blob([valueStr]).size;
    console.log(`[KV Metadata] SET request - key: ${key}, value size: ${valueSize} bytes (${(valueSize/1024).toFixed(2)} KB)`);
    
    const url = `${baseUrl}/set/${key}`;
    console.log(`[KV Metadata] SET URL: ${url}`);
    console.log(`[KV Metadata] Token length: ${process.env.KV_REST_API_TOKEN?.length || 0} chars`);
    
    // Log request details
    const requestDetails = {
      url: url,
      method: 'POST',
      hasBody: !!valueStr,
      bodySize: valueSize,
      hasToken: !!process.env.KV_REST_API_TOKEN,
      tokenPrefix: process.env.KV_REST_API_TOKEN?.substring(0, 10) || 'none',
    };
    console.log('[KV Metadata] Request details:', requestDetails);
    
    const startTime = Date.now();
    console.log(`[KV Metadata] ⏱️ Starting fetch at ${new Date().toISOString()}`);
    
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
          'Content-Type': 'text/plain',
        },
        body: valueStr,
        signal: controller.signal,
      });
      console.log(`[KV Metadata] ✅ Fetch completed in ${Date.now() - startTime}ms`);
    } catch (fetchError) {
      const fetchDuration = Date.now() - startTime;
      console.error(`[KV Metadata] ❌ Fetch failed after ${fetchDuration}ms:`, {
        error: fetchError.message,
        name: fetchError.name,
        cause: fetchError.cause,
      });
      throw fetchError;
    }
    
    // Cleanup timeout ngay khi có response
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    console.log(`[KV Metadata] SET response status: ${response.status}, ok: ${response.ok}, duration: ${duration}ms`);
    
    // Log response headers để debug
    console.log('[KV Metadata] Response headers:', {
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      status: response.status,
      statusText: response.statusText,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`[KV Metadata] ❌ Redis SET failed: ${response.status} - ${errorText.substring(0, 500)}`);
      
      // Log chi tiết về error response
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed (${response.status}): Token có thể không đúng hoặc hết hạn`);
      } else if (response.status === 400) {
        throw new Error(`Bad request (400): ${errorText.substring(0, 200)}`);
      } else if (response.status >= 500) {
        throw new Error(`Upstash server error (${response.status}): ${errorText.substring(0, 200)}`);
      }
      
      throw new Error(`Redis SET failed: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    // Check content-type
    const contentType = response.headers.get('content-type') || '';
    console.log(`[KV Metadata] Response content-type: ${contentType}`);
    
    if (!contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[KV Metadata] ⚠️ Response không phải JSON:', text.substring(0, 500));
      throw new Error(`Invalid response format from Redis SET API: ${contentType} - ${text.substring(0, 100)}`);
    }

    const result = await response.json();
    console.log(`[KV Metadata] ✅ SET thành công:`, result);
    return result;
  } catch (error) {
    // Đảm bảo cleanup timeout trong catch
    clearTimeout(timeoutId);
    
    // Phân loại error để debug dễ hơn
    const errorInfo = {
      error: error.message,
      name: error.name,
      cause: error.cause,
      url: `${process.env.KV_REST_API_URL}/set/${key}`,
      hasToken: !!process.env.KV_REST_API_TOKEN,
      tokenLength: process.env.KV_REST_API_TOKEN?.length || 0,
      valueSize: valueSize,
      valueSizeKB: (valueSize / 1024).toFixed(2),
    };
    
    console.error('[KV Metadata] ❌ Redis SET error:', errorInfo);
    
    // Handle timeout và network errors với message rõ ràng hơn
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error(`Redis SET request timeout sau 5s - Kiểm tra: 1) Connection đến Upstash, 2) Token có đúng không, 3) URL format có đúng không`);
    }
    
    // Handle network errors
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
      throw new Error(`Không thể kết nối đến Upstash Redis: ${error.message}. Kiểm tra KV_REST_API_URL có đúng không.`);
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
  // Log ngay đầu function để verify function được gọi
  console.log('[KV Metadata] ========== HANDLER START ==========');
  console.log('[KV Metadata] Handler entry time:', new Date().toISOString());
  
  const handlerEntryTime = Date.now();
  
  try {
    // Kiểm tra Redis đã được setup chưa
    const hasRedisUrl = !!process.env.REDIS_URL;
    const hasUpstash = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

    // Debug logging chi tiết để điều tra
    console.log('[KV Metadata] Handler called:', {
      method: request.method,
      hasRedisUrl,
      hasUpstash,
      kvUrl: process.env.KV_REST_API_URL ? `${process.env.KV_REST_API_URL.substring(0, 30)}...` : 'NOT SET',
      kvToken: process.env.KV_REST_API_TOKEN ? 'SET' : 'NOT SET',
      timestamp: handlerEntryTime,
    });
    
    // Debug request object properties
    console.log('[KV Metadata] Request object debug:', {
      type: typeof request,
      constructor: request?.constructor?.name,
      isRequest: request instanceof Request,
      hasJson: typeof request?.json === 'function',
      hasText: typeof request?.text === 'function',
      hasBody: !!request?.body,
      bodyType: typeof request?.body,
      method: request?.method,
      url: request?.url,
      headers: request?.headers ? Object.fromEntries(request.headers.entries()) : 'no headers',
    });
  
  // Kiểm tra format của KV_REST_API_URL
  if (process.env.KV_REST_API_URL) {
    const url = process.env.KV_REST_API_URL;
    if (!url.startsWith('https://')) {
      console.error('[KV Metadata] WARNING: KV_REST_API_URL không bắt đầu bằng https://');
    }
    if (url.includes('/get/') || url.includes('/set/')) {
      console.error('[KV Metadata] WARNING: KV_REST_API_URL không nên chứa /get/ hoặc /set/');
    }
  }

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
    const handlerStartTime = Date.now();
    try {
      console.log('[KV Metadata] GET request - Đang lấy metadata từ Redis...');
      
      const metadata = await redisGet(METADATA_KEY);
      const handlerDuration = Date.now() - handlerStartTime;
      
      if (metadata && typeof metadata === 'object') {
        console.log(`[KV Metadata] Tìm thấy metadata trên Redis (handler duration: ${handlerDuration}ms)`);
        // Return ngay lập tức, không log sau khi tạo response
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
        console.log(`[KV Metadata] Không có metadata trên Redis, trả về empty (handler duration: ${handlerDuration}ms)`);
        // Return ngay lập tức, không log sau khi tạo response
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
      const handlerDuration = Date.now() - handlerStartTime;
      console.error(`[KV Metadata] Lỗi khi đọc (handler duration: ${handlerDuration}ms):`, {
        error: error.message,
        stack: error.stack,
        name: error.name,
        handlerDuration,
        totalDuration: Date.now() - handlerEntryTime,
      });
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      // Return ngay lập tức, không log sau khi tạo response
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
    const postStartTime = Date.now();
    try {
      console.log('[KV Metadata] POST request - Bắt đầu xử lý...');
      
      // Đọc body từ request với timeout protection
      console.log('[KV Metadata] Reading request body...');
      let data;
      try {
        // Wrap trong Promise.race để có timeout
        const jsonPromise = request.json();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request body parsing timeout sau 3s')), 3000)
        );
        data = await Promise.race([jsonPromise, timeoutPromise]);
        console.log('[KV Metadata] Request body parsed successfully');
      } catch (parseError) {
        console.error('[KV Metadata] ❌ Error parsing request body:', {
          error: parseError.message,
          name: parseError.name,
        });
        throw new Error(`Không thể đọc request body: ${parseError.message}`);
      }
      
      console.log('[KV Metadata] POST request - Body parsed successfully:', {
        catalogsCount: data?.catalogs?.length || 0,
        filesCount: data?.files?.length || 0,
        hasLastSync: !!data?.lastSync,
        parseDuration: Date.now() - postStartTime,
      });
      
      const { catalogs, files, lastSync } = data;

      const metadata = {
        catalogs: catalogs || [],
        files: files || [],
        lastSync: lastSync || Date.now(),
        version: 1,
      };

      // Log payload size để debug
      const payloadSize = JSON.stringify(metadata).length;
      const payloadSizeKB = (payloadSize / 1024).toFixed(2);
      console.log(`[KV Metadata] Đang lưu metadata lên Redis... (size: ${payloadSizeKB} KB, ${metadata.catalogs.length} catalogs, ${metadata.files.length} files)`);
      
      const redisSetStartTime = Date.now();
      await redisSet(METADATA_KEY, metadata);
      const redisSetDuration = Date.now() - redisSetStartTime;
      
      console.log(`[KV Metadata] Lưu thành công (Redis SET duration: ${redisSetDuration}ms, total POST duration: ${Date.now() - postStartTime}ms)`);
      return new Response(
        JSON.stringify({
          success: true,
          lastSync: metadata.lastSync,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      const errorDuration = Date.now() - postStartTime;
      console.error('[KV Metadata] Lỗi khi lưu:', {
        error: error.message,
        stack: error.stack,
        name: error.name,
        duration: errorDuration,
        requestMethod: request?.method,
        requestType: typeof request,
        hasJson: typeof request?.json === 'function',
        handlerDuration: Date.now() - handlerEntryTime,
      });
      
      // Log chi tiết về error để debug
      if (error.message.includes('json is not a function')) {
        console.error('[KV Metadata] DETAILED DEBUG - Request object inspection:', {
          type: typeof request,
          constructor: request?.constructor?.name,
          prototype: Object.getPrototypeOf(request || {})?.constructor?.name,
          keys: Object.keys(request || {}),
          hasJson: typeof request?.json,
          hasText: typeof request?.text,
          hasBody: !!request?.body,
          bodyType: typeof request?.body,
          isRequest: request instanceof Request,
          requestStringified: JSON.stringify(request, null, 2).substring(0, 500),
        });
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Không thể lưu metadata lên Redis',
          details: error.message,
          debug: {
            errorName: error.name,
            errorType: typeof error,
            requestType: typeof request,
            hasJsonMethod: typeof request?.json === 'function',
          }
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (handlerError) {
    // Catch mọi lỗi không được handle
    console.error('[KV Metadata] ❌ UNHANDLED ERROR trong handler:', {
      error: handlerError.message,
      stack: handlerError.stack,
      name: handlerError.name,
      handlerDuration: Date.now() - handlerEntryTime,
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: handlerError.message,
        debug: {
          errorName: handlerError.name,
          handlerDuration: Date.now() - handlerEntryTime,
        }
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    console.log('[KV Metadata] ========== HANDLER END ==========');
    console.log('[KV Metadata] Total handler duration:', Date.now() - handlerEntryTime, 'ms');
  }
}
