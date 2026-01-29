/**
 * API route để lưu metadata (catalogs và file list) lên Vercel Blob Storage
 * POST /api/save-metadata
 */

import { put } from '@vercel/blob';

export const config = {
  runtime: 'nodejs',
  maxDuration: 10,
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const data = await request.json();
    const { catalogs, files, lastSync } = data;

    if (!catalogs || !files) {
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

    // Upload lên Vercel Blob Storage
    const result = await put('metadata/metadata.json', blob, {
      access: 'public',
      contentType: 'application/json',
    });

    return new Response(
      JSON.stringify({
        success: true,
        url: result.url,
        lastSync: metadata.lastSync,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Lỗi khi lưu metadata:', error);
    
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
