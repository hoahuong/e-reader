/**
 * API route để lưu metadata (catalogs và file list) lên Vercel Blob Storage
 * POST /api/save-metadata
 */

import { put } from '@vercel/blob';

export const config = {
  runtime: 'nodejs',
  maxDuration: 60, // Tăng timeout lên 60s (max cho Hobby plan)
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('[API save-metadata] Bắt đầu lưu metadata...');
    const data = await request.json();
    const { catalogs, files, lastSync } = data;

    console.log(`[API save-metadata] Nhận được: ${catalogs?.length || 0} catalogs, ${files?.length || 0} files`);

    if (!catalogs || !files) {
      console.error('[API save-metadata] Thiếu dữ liệu catalogs hoặc files');
      return new Response(
        JSON.stringify({ error: 'Thiếu dữ liệu catalogs hoặc files' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Tạo metadata object
    const metadata = {
      catalogs: catalogs || [],
      files: files || [],
      lastSync: lastSync || Date.now(),
      version: 1,
    };

    // Convert sang JSON string
    const jsonString = JSON.stringify(metadata);
    const blob = new Blob([jsonString], { type: 'application/json' });

    console.log(`[API save-metadata] Đang upload lên blob storage... (size: ${blob.size} bytes)`);

    // Upload lên Vercel Blob Storage với timeout
    const uploadController = new AbortController();
    const uploadTimeoutId = setTimeout(() => uploadController.abort(), 50000); // 50s timeout
    
    try {
      const result = await put('metadata/metadata.json', blob, {
        access: 'public',
        contentType: 'application/json',
      });
      clearTimeout(uploadTimeoutId);
      
      console.log(`[API save-metadata] Upload thành công tại: ${result.url}`);

      return new Response(
        JSON.stringify({
          success: true,
          url: result.url,
          lastSync: metadata.lastSync,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (uploadError) {
      clearTimeout(uploadTimeoutId);
      if (uploadError.name === 'AbortError' || uploadError.message.includes('timeout')) {
        throw new Error('Timeout khi upload metadata lên blob storage');
      }
      throw uploadError;
    }
  } catch (error) {
    console.error('[API save-metadata] Lỗi khi lưu metadata:', error);
    console.error('[API save-metadata] Chi tiết:', error.message, error.stack);
    
    if (error.message && error.message.includes('BLOB_READ_WRITE_TOKEN')) {
      return new Response(
        JSON.stringify({ 
          error: 'Thiếu cấu hình Vercel Blob Storage',
          details: 'Vui lòng kiểm tra BLOB_READ_WRITE_TOKEN trong Vercel environment variables'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Không thể lưu metadata',
        details: error.message || 'Lỗi không xác định'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
