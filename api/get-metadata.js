/**
 * API route để lấy metadata (catalogs và file list) từ Vercel Blob Storage
 * GET /api/get-metadata
 */

import { list } from '@vercel/blob';

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

  try {
    console.log('[API get-metadata] Bắt đầu lấy metadata từ blob storage...');
    
    // Tìm file metadata trong blob storage
    const { blobs } = await list({
      prefix: 'metadata/',
      limit: 10,
    });

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

    // Fetch metadata từ blob URL
    const response = await fetch(metadataBlob.url);
    if (!response.ok) {
      throw new Error(`Không thể tải metadata từ ${metadataBlob.url}: ${response.status} ${response.statusText}`);
    }

    const metadata = await response.json();
    console.log(`[API get-metadata] Load thành công: ${metadata.catalogs?.length || 0} catalogs, ${metadata.files?.length || 0} files`);
    
    return new Response(
      JSON.stringify(metadata),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[API get-metadata] Lỗi khi lấy metadata:', error);
    console.error('[API get-metadata] Chi tiết:', error.message, error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Không thể lấy metadata',
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
