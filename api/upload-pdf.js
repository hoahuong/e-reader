/**
 * API route để upload PDF lên Vercel Blob Storage
 * POST /api/upload-pdf
 */

import { put } from '@vercel/blob';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(request) {
  // Chỉ cho phép POST
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'Không có file được upload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (file.type !== 'application/pdf') {
      return new Response(
        JSON.stringify({ error: 'File phải là PDF' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Tạo tên file unique với timestamp
    const fileName = file.name;
    const timestamp = Date.now();
    const blobName = `pdfs/${timestamp}-${fileName}`;

    // Upload lên Vercel Blob Storage
    const blob = await put(blobName, file, {
      access: 'public', // Cho phép truy cập công khai
      contentType: 'application/pdf',
    });

    // Trả về thông tin file đã upload
    return new Response(
      JSON.stringify({
        id: blob.url, // Dùng URL làm ID
        name: fileName,
        url: blob.url,
        uploadedAt: timestamp,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Lỗi khi upload PDF:', error);
    
    // Kiểm tra xem có phải lỗi thiếu token không
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
        error: 'Không thể upload PDF',
        details: error.message || 'Lỗi không xác định'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
