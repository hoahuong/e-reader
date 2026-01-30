/**
 * API route để lưu/đọc metadata từ Vercel KV (Upstash Redis)
 * GET /api/kv-metadata - Đọc metadata
 * POST /api/kv-metadata - Lưu metadata
 * 
 * Sử dụng @vercel/kv SDK - Đơn giản và đáng tin cậy hơn REST API
 */

import { kv } from '@vercel/kv';

export const config = {
  runtime: 'nodejs',
  maxDuration: 60, // 60s (max cho Hobby plan)
};

const METADATA_KEY = 'pdf-metadata';

export default async function handler(request) {
  console.log('[KV Metadata] ========== HANDLER START ==========');
  console.log('[KV Metadata] Handler entry time:', new Date().toISOString());
  console.log('[KV Metadata] Request method:', request?.method);
  
  const handlerEntryTime = Date.now();
  
  try {
    // Kiểm tra KV đã được setup chưa
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.error('[KV Metadata] KV chưa được setup');
      return new Response(
        JSON.stringify({ 
          error: 'Vercel KV chưa được setup',
          details: 'Cần tạo Upstash Redis trong Vercel Dashboard → Storage → Create Database',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (request.method === 'GET') {
      console.log('[KV Metadata] GET request - Đang lấy metadata...');
      const startTime = Date.now();
      
      try {
        const metadata = await kv.get(METADATA_KEY);
        const duration = Date.now() - startTime;
        
        if (metadata) {
          console.log(`[KV Metadata] ✅ GET thành công trong ${duration}ms`);
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
          console.log(`[KV Metadata] Không có metadata (${duration}ms)`);
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
        const duration = Date.now() - startTime;
        console.error(`[KV Metadata] ❌ GET error sau ${duration}ms:`, {
          error: error.message,
          name: error.name,
        });
        return new Response(
          JSON.stringify({ 
            error: 'Không thể đọc metadata từ KV',
            details: error.message
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
      console.log('[KV Metadata] POST request - Bắt đầu xử lý...');
      const postStartTime = Date.now();
      
      try {
        // Đọc body từ request - Đơn giản với SDK
        let data;
        try {
          // Thử request.json() trước
          if (typeof request?.json === 'function') {
            console.log('[KV Metadata] Using request.json()...');
            data = await request.json();
          }
          // Fallback: request.body nếu là object
          else if (request?.body && typeof request.body === 'object' && !(request.body instanceof ReadableStream)) {
            console.log('[KV Metadata] Using request.body...');
            data = request.body;
          }
          // Fallback: Parse từ string
          else if (typeof request?.body === 'string') {
            console.log('[KV Metadata] Parsing request.body string...');
            data = JSON.parse(request.body);
          }
          else {
            throw new Error('Không thể đọc request body');
          }
        } catch (parseError) {
          console.error('[KV Metadata] ❌ Error parsing body:', parseError.message);
          return new Response(
            JSON.stringify({ 
              error: 'Không thể đọc request body',
              details: parseError.message
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        console.log('[KV Metadata] Body parsed:', {
          catalogsCount: data?.catalogs?.length || 0,
          filesCount: data?.files?.length || 0,
        });
        
        const { catalogs, files, lastSync } = data;
        const metadata = {
          catalogs: catalogs || [],
          files: files || [],
          lastSync: lastSync || Date.now(),
          version: 1,
        };
        
        // Lưu vào KV - Đơn giản với SDK
        console.log('[KV Metadata] Đang lưu vào KV...');
        const setStartTime = Date.now();
        await kv.set(METADATA_KEY, metadata);
        const setDuration = Date.now() - setStartTime;
        
        const totalDuration = Date.now() - postStartTime;
        console.log(`[KV Metadata] ✅ SET thành công trong ${setDuration}ms (total: ${totalDuration}ms)`);
        
        return new Response(
          JSON.stringify({
            success: true,
            lastSync: metadata.lastSync,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        const errorDuration = Date.now() - postStartTime;
        console.error(`[KV Metadata] ❌ POST error sau ${errorDuration}ms:`, {
          error: error.message,
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'),
        });
        
        return new Response(
          JSON.stringify({ 
            error: 'Không thể lưu metadata lên KV',
            details: error.message
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (handlerError) {
    const handlerDuration = Date.now() - handlerEntryTime;
    console.error(`[KV Metadata] ❌ UNHANDLED ERROR sau ${handlerDuration}ms:`, {
      error: handlerError.message,
      name: handlerError.name,
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: handlerError.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    const totalDuration = Date.now() - handlerEntryTime;
    console.log(`[KV Metadata] ========== HANDLER END ========== (${totalDuration}ms)`);
  }
}
