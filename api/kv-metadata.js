/**
 * API route để lưu/đọc metadata từ Upstash Redis (qua Vercel Marketplace)
 * GET /api/kv-metadata - Đọc metadata
 * POST /api/kv-metadata - Lưu metadata
 * 
 * Cần Upstash Redis đã được setup qua Vercel Marketplace:
 * - KV_REST_API_URL (Upstash REST API URL)
 * - KV_REST_API_TOKEN (Upstash REST API Token)
 */

export const config = {
  runtime: 'nodejs',
  maxDuration: 10, // Redis rất nhanh, chỉ cần 10s
};

const METADATA_KEY = 'pdf-metadata';

/**
 * Helper function để gọi Upstash Redis REST API
 */
async function redisGet(key) {
  const response = await fetch(`${process.env.KV_REST_API_URL}/get/${key}`, {
    headers: {
      'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Redis GET failed: ${response.status}`);
  }

  const data = await response.json();
  return data.result ? JSON.parse(data.result) : null;
}

async function redisSet(key, value) {
  const response = await fetch(`${process.env.KV_REST_API_URL}/set/${key}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });

  if (!response.ok) {
    throw new Error(`Redis SET failed: ${response.status}`);
  }

  return await response.json();
}

export default async function handler(request) {
  // Kiểm tra Redis đã được setup chưa
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return new Response(
      JSON.stringify({ 
        error: 'Upstash Redis chưa được setup',
        details: 'Cần tạo Upstash Redis qua Vercel Marketplace và set KV_REST_API_URL, KV_REST_API_TOKEN'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (request.method === 'GET') {
    try {
      console.log('[KV Metadata] GET request - Đang lấy metadata từ Redis...');
      
      const metadata = await redisGet(METADATA_KEY);
      
      if (metadata) {
        console.log('[KV Metadata] Tìm thấy metadata trên Redis');
        return new Response(
          JSON.stringify(metadata),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        console.log('[KV Metadata] Không có metadata trên Redis, trả về empty');
        return new Response(
          JSON.stringify({
            catalogs: [],
            files: [],
            lastSync: null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('[KV Metadata] Lỗi khi đọc:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Không thể đọc metadata từ Redis',
          details: error.message 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
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
