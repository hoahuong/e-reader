/**
 * API route để lưu/đọc metadata từ Supabase Database
 * GET /api/supabase-metadata - Đọc metadata
 * POST /api/supabase-metadata - Lưu metadata
 * 
 * Sử dụng Supabase REST API - Đơn giản và đáng tin cậy
 */

export const config = {
  runtime: 'nodejs',
  maxDuration: 60, // 60s (max cho Hobby plan)
};

const METADATA_KEY = 'pdf-metadata';

/**
 * Helper để gọi Supabase REST API
 */
async function supabaseRequest(method, path, body = null) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase chưa được setup. Cần SUPABASE_URL và SUPABASE_ANON_KEY');
  }
  
  const url = `${supabaseUrl}/rest/v1/${path}`;
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };
  
  const options = {
    method,
    headers,
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Supabase API error: ${response.status} - ${errorText}`);
  }
  
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }
  
  return await response.json();
}

export default async function handler(request) {
  console.log('[Supabase Metadata] ========== HANDLER START ==========');
  console.log('[Supabase Metadata] Handler entry time:', new Date().toISOString());
  console.log('[Supabase Metadata] Request method:', request?.method);
  
  const handlerEntryTime = Date.now();
  
  try {
    // Kiểm tra Supabase đã được setup chưa
    if (!process.env.SUPABASE_URL || !(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY)) {
      console.error('[Supabase Metadata] Supabase chưa được setup');
      return new Response(
        JSON.stringify({ 
          error: 'Supabase chưa được setup',
          details: 'Cần tạo Supabase project và set SUPABASE_URL và SUPABASE_ANON_KEY trong Vercel environment variables',
          instructions: [
            '1. Tạo project tại https://supabase.com',
            '2. Vào Project Settings → API',
            '3. Copy Project URL → set SUPABASE_URL',
            '4. Copy anon/public key → set SUPABASE_ANON_KEY',
            '5. Tạo table: CREATE TABLE metadata (key TEXT PRIMARY KEY, value JSONB)',
            '6. Redeploy project'
          ]
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (request.method === 'GET') {
      console.log('[Supabase Metadata] GET request - Đang lấy metadata...');
      const startTime = Date.now();
      
      try {
        // Query từ Supabase table
        const result = await supabaseRequest('GET', `metadata?key=eq.${METADATA_KEY}&select=value`);
        const duration = Date.now() - startTime;
        
        if (result && Array.isArray(result) && result.length > 0 && result[0].value) {
          const metadata = result[0].value;
          console.log(`[Supabase Metadata] ✅ GET thành công trong ${duration}ms`);
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
          console.log(`[Supabase Metadata] Không có metadata (${duration}ms)`);
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
        console.error(`[Supabase Metadata] ❌ GET error sau ${duration}ms:`, {
          error: error.message,
          name: error.name,
        });
        return new Response(
          JSON.stringify({ 
            error: 'Không thể đọc metadata từ Supabase',
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
      console.log('[Supabase Metadata] POST request - Bắt đầu xử lý...');
      const postStartTime = Date.now();
      
      try {
        // Đọc body từ request
        let data;
        try {
          if (typeof request?.json === 'function') {
            data = await request.json();
          } else if (request?.body && typeof request.body === 'object' && !(request.body instanceof ReadableStream)) {
            data = request.body;
          } else if (typeof request?.body === 'string') {
            data = JSON.parse(request.body);
          } else {
            throw new Error('Không thể đọc request body');
          }
        } catch (parseError) {
          console.error('[Supabase Metadata] ❌ Error parsing body:', parseError.message);
          return new Response(
            JSON.stringify({ 
              error: 'Không thể đọc request body',
              details: parseError.message
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        console.log('[Supabase Metadata] Body parsed:', {
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
        
        // Lưu vào Supabase - Upsert (insert hoặc update)
        console.log('[Supabase Metadata] Đang lưu vào Supabase...');
        const setStartTime = Date.now();
        
        // Dùng UPSERT với ON CONFLICT để tự động insert hoặc update
        // Supabase REST API hỗ trợ upsert với header Prefer: resolution=merge-duplicates
        const upsertHeaders = {
          'apikey': process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates', // Upsert: merge nếu conflict
        };
        
        const upsertUrl = `${process.env.SUPABASE_URL}/rest/v1/metadata`;
        const upsertResponse = await fetch(upsertUrl, {
          method: 'POST',
          headers: upsertHeaders,
          body: JSON.stringify({
            key: METADATA_KEY,
            value: metadata,
          }),
        });
        
        if (!upsertResponse.ok) {
          // Nếu upsert fail, thử update trực tiếp
          console.log('[Supabase Metadata] Upsert failed, thử update...');
          await supabaseRequest('PATCH', `metadata?key=eq.${METADATA_KEY}`, {
            value: metadata,
          });
        }
        
        const setDuration = Date.now() - setStartTime;
        const totalDuration = Date.now() - postStartTime;
        console.log(`[Supabase Metadata] ✅ SET thành công trong ${setDuration}ms (total: ${totalDuration}ms)`);
        
        return new Response(
          JSON.stringify({
            success: true,
            lastSync: metadata.lastSync,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        const errorDuration = Date.now() - postStartTime;
        console.error(`[Supabase Metadata] ❌ POST error sau ${errorDuration}ms:`, {
          error: error.message,
          name: error.name,
          stack: error.stack?.split('\n').slice(0, 3).join('\n'),
        });
        
        return new Response(
          JSON.stringify({ 
            error: 'Không thể lưu metadata lên Supabase',
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
    console.error(`[Supabase Metadata] ❌ UNHANDLED ERROR sau ${handlerDuration}ms:`, {
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
    console.log(`[Supabase Metadata] ========== HANDLER END ========== (${totalDuration}ms)`);
  }
}
