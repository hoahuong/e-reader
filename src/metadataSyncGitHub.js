/**
 * Metadata Sync với GitHub Storage
 * Sử dụng GitHub API để lưu/đọc metadata.json từ repository
 */

/**
 * Lấy metadata từ GitHub với retry logic
 */
export async function loadMetadataFromCloud() {
  const maxRetries = 3;
  const baseTimeout = 20000; // 20s timeout cho mỗi lần thử
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 4000);
        console.log(`[Metadata Sync GitHub] Retry ${attempt}/${maxRetries} sau ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      console.log(`[Metadata Sync GitHub] Đang load metadata từ GitHub... (lần thử ${attempt + 1}/${maxRetries})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), baseTimeout);
      
      try {
        const response = await fetch('/api/github-metadata', {
          signal: controller.signal,
          cache: 'no-cache', // Đảm bảo không dùng cache cũ
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`[Metadata Sync GitHub] API trả về lỗi ${response.status}:`, errorText);
          
          // Nếu là lỗi 404 (file chưa tồn tại), trả về null ngay
          if (response.status === 404) {
            console.log('[Metadata Sync GitHub] File metadata chưa tồn tại trên GitHub');
            return null;
          }
          
          // Nếu không phải lần thử cuối, tiếp tục retry
          if (attempt < maxRetries - 1) {
            continue;
          }
          return null;
        }
        
        const metadata = await response.json();
        
        // Kiểm tra xem metadata có hợp lệ không
        if (!metadata || (Array.isArray(metadata.catalogs) && Array.isArray(metadata.files))) {
          console.log(`[Metadata Sync GitHub] Load thành công: ${metadata.catalogs?.length || 0} catalogs, ${metadata.files?.length || 0} files`);
          return metadata;
        } else {
          console.warn('[Metadata Sync GitHub] Metadata không hợp lệ:', metadata);
          if (attempt < maxRetries - 1) {
            continue;
          }
          return null;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.warn(`[Metadata Sync GitHub] Request timeout sau ${baseTimeout}ms (lần thử ${attempt + 1})`);
          if (attempt < maxRetries - 1) {
            continue;
          }
          return null;
        }
        // Nếu không phải timeout và không phải lần thử cuối, tiếp tục retry
        if (attempt < maxRetries - 1) {
          console.warn(`[Metadata Sync GitHub] Lỗi fetch: ${fetchError.message}, sẽ retry...`);
          continue;
        }
        throw fetchError;
      }
    } catch (error) {
      console.error(`[Metadata Sync GitHub] Lỗi khi load metadata (lần thử ${attempt + 1}):`, error);
      if (attempt === maxRetries - 1) {
        console.error('[Metadata Sync GitHub] Đã hết số lần thử, trả về null');
        return null;
      }
    }
  }
  
  return null;
}

/**
 * Lưu metadata lên GitHub
 */
export async function saveMetadataToCloud(catalogs, files) {
  try {
    const payload = {
      catalogs: catalogs || [],
      files: files || [],
      lastSync: Date.now(),
    };
    
    console.log(`[Metadata Sync GitHub] Đang lưu metadata lên GitHub: ${payload.catalogs.length} catalogs, ${payload.files.length} files`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout (trước server timeout 60s)
    
    try {
      const response = await fetch('/api/github-metadata', {
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
        console.error(`[Metadata Sync GitHub] API trả về lỗi ${response.status}:`, errorData);
        throw new Error(errorData.error || errorData.details || 'Không thể lưu metadata');
      }

      const result = await response.json();
      console.log('[Metadata Sync GitHub] Lưu thành công:', result);
      return result;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[Metadata Sync GitHub] Request timeout sau 45s');
        throw new Error('Request timeout - Không thể lưu metadata lên GitHub');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('[Metadata Sync GitHub] Lỗi khi lưu metadata:', error);
    return null;
  }
}

// Re-export syncMetadataToLocal từ metadataSync.js
export { syncMetadataToLocal } from './metadataSync';
