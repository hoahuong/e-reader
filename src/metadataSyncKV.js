/**
 * Metadata Sync với Vercel KV Storage
 * Sử dụng Vercel KV (Redis-compatible) để lưu/đọc metadata
 * 
 * Ưu điểm:
 * - Low latency (< 1ms)
 * - Free tier: 30K reads/day, 30K writes/day
 * - Không timeout
 * - Perfect cho key-value storage
 */

const METADATA_KEY = 'pdf-metadata';

/**
 * Lấy metadata từ Vercel KV
 */
export async function loadMetadataFromCloud() {
  try {
    console.log('[Metadata Sync KV] Đang load metadata từ Vercel KV...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
      const response = await fetch('/api/kv-metadata', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('[Metadata Sync KV] Không có metadata trên KV (chưa có data)');
          return null;
        }
        const errorText = await response.text();
        console.warn(`[Metadata Sync KV] API trả về lỗi ${response.status}:`, errorText);
        return null;
      }
      
      const metadata = await response.json();
      
      // Kiểm tra xem metadata có hợp lệ không
      if (metadata && (Array.isArray(metadata.catalogs) && Array.isArray(metadata.files))) {
        console.log(`[Metadata Sync KV] Load thành công: ${metadata.catalogs?.length || 0} catalogs, ${metadata.files?.length || 0} files`);
        return metadata;
      } else {
        console.warn('[Metadata Sync KV] Metadata không hợp lệ:', metadata);
        return null;
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn('[Metadata Sync KV] Request timeout sau 10s');
        return null;
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('[Metadata Sync KV] Lỗi khi load metadata:', error);
    return null;
  }
}

/**
 * Lưu metadata lên Vercel KV
 */
export async function saveMetadataToCloud(catalogs, files) {
  try {
    const payload = {
      catalogs: catalogs || [],
      files: files || [],
      lastSync: Date.now(),
      version: 1,
    };
    
    console.log(`[Metadata Sync KV] Đang lưu metadata lên Vercel KV: ${payload.catalogs.length} catalogs, ${payload.files.length} files`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
      const response = await fetch('/api/kv-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}` };
        }
        console.error(`[Metadata Sync KV] API trả về lỗi ${response.status}:`, errorData);
        throw new Error(errorData.error || errorData.details || 'Không thể lưu metadata');
      }

      const result = await response.json();
      console.log('[Metadata Sync KV] Lưu thành công:', result);
      return result;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[Metadata Sync KV] Request timeout sau 10s');
        throw new Error('Request timeout - Không thể lưu metadata lên Vercel KV');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('[Metadata Sync KV] Lỗi khi lưu metadata:', error);
    return null;
  }
}

// Re-export syncMetadataToLocal từ metadataSync.js
export { syncMetadataToLocal } from './metadataSync';
