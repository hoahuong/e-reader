/**
 * Metadata Sync với GitHub Storage
 * Sử dụng GitHub API để lưu/đọc metadata.json từ repository
 */

/**
 * Lấy metadata từ GitHub
 */
export async function loadMetadataFromCloud() {
  try {
    console.log('[Metadata Sync GitHub] Đang load metadata từ GitHub...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout (trước server timeout 60s)
    
    try {
      const response = await fetch('/api/github-metadata', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[Metadata Sync GitHub] API trả về lỗi ${response.status}:`, errorText);
        return null;
      }
      
      const metadata = await response.json();
      console.log(`[Metadata Sync GitHub] Load thành công: ${metadata.catalogs?.length || 0} catalogs, ${metadata.files?.length || 0} files`);
      return metadata;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn('[Metadata Sync GitHub] Request timeout sau 45s, dùng local data');
        return null;
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('[Metadata Sync GitHub] Lỗi khi load metadata:', error);
    return null;
  }
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
