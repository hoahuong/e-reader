/**
 * API route để xóa PDF khỏi Vercel Blob Storage
 * DELETE /api/delete-pdf?url=<blob-url>
 */

import { del } from '@vercel/blob';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(request) {
  if (request.method !== 'DELETE') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(request.url);
    const blobUrl = url.searchParams.get('url');

    if (!blobUrl) {
      return new Response(
        JSON.stringify({ error: 'Thiếu tham số url' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Xóa blob
    await del(blobUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'PDF đã được xóa' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Lỗi khi xóa PDF:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Không thể xóa PDF',
        details: error.message 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
