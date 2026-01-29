/**
 * API route để lấy metadata (catalogs và file list) từ Vercel Blob Storage
 * GET /api/get-metadata
 */

import { list } from '@vercel/blob';

export const config = {
  runtime: 'nodejs',
  maxDuration: 60, // Tăng timeout lên 60s (max cho Hobby plan)
};

export default async function handler(request) {
  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('[API get-metadata] Bắt đầu lấy metadata từ blob storage...');
    
    // Tạo AbortController với timeout 50s (trước khi function timeout 60s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000);
    
    try {
      // Tìm file metadata trong blob storage với timeout
      const listPromise = list({
        prefix: 'metadata/',
        limit: 10,
      });
      
      // Thêm timeout cho list operation
      const listWithTimeout = Promise.race([
        listPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('List operation timeout')), 30000)
        )
      ]);
      
      const { blobs } = await listWithTimeout;
      clearTimeout(timeoutId);

      console.log(`[API get-metadata] Tìm thấy ${blobs.length} blobs với prefix 'metadata/'`);

      // Tìm file metadata.json mới nhất
      const metadataBlob = blobs.find(blob => blob.pathname === 'metadata/metadata.json');
      
      if (!metadataBlob) {
        console.log('[API get-metadata] Không tìm thấy metadata.json, trả về empty');
        // Chưa có metadata, trả về empty
        return new Response(
          JSON.stringify({
            catalogs: [],
            files: [],
            lastSync: null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[API get-metadata] Tìm thấy metadata.json tại: ${metadataBlob.url}`);

      // Fetch metadata từ blob URL với timeout
      const fetchController = new AbortController();
      const fetchTimeoutId = setTimeout(() => fetchController.abort(), 20000); // 20s timeout cho fetch
      
      try {
        const response = await fetch(metadataBlob.url, {
          signal: fetchController.signal,
        });
        clearTimeout(fetchTimeoutId);
        
        if (!response.ok) {
          throw new Error(`Không thể tải metadata từ ${metadataBlob.url}: ${response.status} ${response.statusText}`);
        }

        const metadata = await response.json();
        console.log(`[API get-metadata] Load thành công: ${metadata.catalogs?.length || 0} catalogs, ${metadata.files?.length || 0} files`);
        
        return new Response(
          JSON.stringify(metadata),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (fetchError) {
        clearTimeout(fetchTimeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Timeout khi fetch metadata từ blob URL');
        }
        throw fetchError;
      }
    } catch (listError) {
      clearTimeout(timeoutId);
      if (listError.name === 'AbortError' || listError.message.includes('timeout')) {
        throw new Error('Timeout khi list blobs từ storage');
      }
      throw listError;
    }
  } catch (error) {
    console.error('[API get-metadata] Lỗi khi lấy metadata:', error);
    console.error('[API get-metadata] Chi tiết:', error.message, error.stack);
    
    // Nếu là timeout, trả về empty thay vì error để app vẫn hoạt động
    if (error.message.includes('timeout') || error.message.includes('Timeout')) {
      console.warn('[API get-metadata] Timeout, trả về empty metadata');
      return new Response(
        JSON.stringify({
          catalogs: [],
          files: [],
          lastSync: null,
          error: 'Timeout - dùng local data',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Không thể lấy metadata',
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
