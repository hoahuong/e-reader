/**
 * API route để upload PDF lên Google Drive
 * POST /api/upload-pdf-google-drive
 * 
 * Cần access token từ Google OAuth được gửi trong header
 */

export const config = {
  runtime: 'nodejs',
  maxDuration: 60, // 60s timeout cho Hobby plan
};

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Lấy access token từ header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Thiếu access token. Cần Authorization header với Bearer token.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = authHeader.replace('Bearer ', '');

    // Lấy file từ form data
    const formData = await request.formData();
    const file = formData.get('file');
    const folderId = formData.get('folderId') || 'root'; // Default: root folder

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
    const uniqueFileName = `${timestamp}-${fileName}`;

    // Upload metadata trước
    const metadata = {
      name: uniqueFileName,
      parents: [folderId],
      mimeType: 'application/pdf',
    };

    // Bước 1: Tạo file metadata trên Google Drive
    const createResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=foo_bar_baz`,
      },
      body: createMultipartBody(metadata, await file.arrayBuffer()),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Google Drive API error: ${createResponse.status}`);
    }

    const fileData = await createResponse.json();
    const fileId = fileData.id;

    // Bước 2: Lấy download URL (webContentLink hoặc webViewLink)
    const getFileResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webContentLink,webViewLink,size,createdTime`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!getFileResponse.ok) {
      throw new Error('Không thể lấy thông tin file sau khi upload');
    }

    const fileInfo = await getFileResponse.json();

    // Trả về thông tin file đã upload
    return new Response(
      JSON.stringify({
        id: fileId,
        name: fileName,
        url: fileInfo.webContentLink || fileInfo.webViewLink,
        driveId: fileId,
        uploadedAt: timestamp,
        size: fileInfo.size,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Upload Google Drive] Lỗi:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Không thể upload PDF lên Google Drive',
        details: error.message || 'Lỗi không xác định'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Tạo multipart body cho Google Drive API
 */
function createMultipartBody(metadata, fileBuffer) {
  const boundary = 'foo_bar_baz';
  const metadataPart = JSON.stringify(metadata);
  
  const parts = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadataPart,
    `--${boundary}`,
    'Content-Type: application/pdf',
    '',
    new Uint8Array(fileBuffer),
    `--${boundary}--`,
  ];

  // Convert to ArrayBuffer
  const encoder = new TextEncoder();
  const partsText = parts.join('\r\n');
  const textBuffer = encoder.encode(partsText);
  
  // Combine text and binary
  const combined = new Uint8Array(textBuffer.length + fileBuffer.byteLength);
  combined.set(textBuffer, 0);
  combined.set(new Uint8Array(fileBuffer), textBuffer.length);
  
  return combined.buffer;
}
