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
    // Tìm file metadata trong blob storage
    const { blobs } = await list({
      prefix: 'metadata/',
      limit: 10,
    });

    // Tìm file metadata.json mới nhất
    const metadataBlob = blobs.find(blob => blob.pathname === 'metadata/metadata.json');
    
    if (!metadataBlob) {
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

    // Fetch metadata từ blob URL
    const response = await fetch(metadataBlob.url);
    if (!response.ok) {
      throw new Error('Không thể tải metadata');
    }

    const metadata = await response.json();
    
    return new Response(
      JSON.stringify(metadata),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Lỗi khi lấy metadata:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Không thể lấy metadata',
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
