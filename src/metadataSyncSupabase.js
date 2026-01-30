/**
 * Metadata Sync với Supabase Database
 * Sử dụng Supabase PostgreSQL để lưu/đọc metadata
 * 
 * Ưu điểm:
 * - Real-time sync tự động
 * - Free tier: 500MB database
 * - PostgreSQL (queries mạnh)
 * - Predictable pricing
 */

const METADATA_KEY = 'pdf-metadata';

/**
 * Lấy metadata từ Supabase
 */
export async function loadMetadataFromCloud() {
  try {
    console.log('[Metadata Sync Supabase] Đang load metadata từ Supabase...');
    
    const controller = new AbortController();
    const timeoutMs = 10000; // 10s timeout
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch('/api/supabase-metadata', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('[Metadata Sync Supabase] Không có metadata trên Supabase (chưa có data)');
          return null;
        }
        
        if (response.status === 503) {
          const errorData = await response.json().catch(() => ({}));
          console.warn('[Metadata Sync Supabase] Supabase chưa được setup:', errorData.details || errorData.error);
          return null;
        }
        
        const errorText = await response.text();
        console.warn(`[Metadata Sync Supabase] API trả về lỗi ${response.status}:`, errorText);
        return null;
      }
      
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[Metadata Sync Supabase] Response không phải JSON:', text.substring(0, 200));
        return null;
      }
      
      let metadata;
      try {
        metadata = await response.json();
      } catch (jsonError) {
        console.error('[Metadata Sync Supabase] Lỗi parse JSON:', jsonError);
        const text = await response.text();
        console.error('[Metadata Sync Supabase] Response text:', text.substring(0, 200));
        return null;
      }
      
      if (metadata && (Array.isArray(metadata.catalogs) && Array.isArray(metadata.files))) {
        console.log(`[Metadata Sync Supabase] Load thành công: ${metadata.catalogs?.length || 0} catalogs, ${metadata.files?.length || 0} files`);
        return metadata;
      } else {
        console.warn('[Metadata Sync Supabase] Metadata không hợp lệ:', metadata);
        return null;
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn(`[Metadata Sync Supabase] Request timeout sau ${timeoutMs}ms, fallback về IndexedDB`);
        return null;
      }
      throw fetchError;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`[Metadata Sync Supabase] Request timeout, fallback về IndexedDB`);
    } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      console.warn('[Metadata Sync Supabase] Network error, fallback về IndexedDB:', error.message);
    } else {
      console.error('[Metadata Sync Supabase] Lỗi khi load metadata:', error);
    }
    return null; // Fallback về IndexedDB
  }
}

/**
 * Lưu metadata lên Supabase
 */
export async function saveMetadataToCloud(catalogs, files) {
  try {
    const payload = {
      catalogs: catalogs || [],
      files: files || [],
      lastSync: Date.now(),
      version: 1,
    };
    
    console.log(`[Metadata Sync Supabase] Đang lưu metadata lên Supabase: ${payload.catalogs.length} catalogs, ${payload.files.length} files`);
    
    const controller = new AbortController();
    const timeoutMs = 25000; // 25s timeout
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch('/api/supabase-metadata', {
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
        
        if (response.status === 500) {
          if (errorData.error?.includes('Supabase chưa được setup') || 
              errorData.error?.includes('SUPABASE_URL') ||
              errorData.error?.includes('SUPABASE_KEY')) {
            console.warn('[Metadata Sync Supabase] Supabase chưa được setup, không thể lưu metadata lên cloud');
            console.warn('[Metadata Sync Supabase] Metadata sẽ chỉ lưu local (IndexedDB)');
            return null;
          }
          
          if (errorData.error?.includes('timeout') || errorData.error?.includes('504')) {
            console.warn('[Metadata Sync Supabase] Request timeout, sẽ lưu local thay thế');
            return null;
          }
        }
        
        throw new Error(`Supabase API error: ${response.status} - ${errorData.error || errorText}`);
      }
      
      const result = await response.json();
      console.log('[Metadata Sync Supabase] Lưu thành công:', result);
      return result;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn(`[Metadata Sync Supabase] Request timeout sau ${timeoutMs}ms, sẽ lưu local thay thế`);
        return null;
      }
      throw fetchError;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('[Metadata Sync Supabase] Request timeout, sẽ lưu local thay thế');
    } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      console.warn('[Metadata Sync Supabase] Network error, sẽ lưu local thay thế:', error.message);
    } else {
      console.error('[Metadata Sync Supabase] Lỗi khi lưu:', error);
    }
    return null; // Fallback về IndexedDB
  }
}

/**
 * Sync metadata từ cloud về local (IndexedDB)
 */
export async function syncMetadataToLocal(metadata) {
  // Implementation giống như metadataSyncKV.js
  if (!metadata) return;
  
  try {
    const dbName = 'PDFReaderDB';
    const dbVersion = 1;
    const storeName = 'metadata';
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const data = {
          catalogs: metadata.catalogs || [],
          files: metadata.files || [],
          lastSync: metadata.lastSync || Date.now(),
          version: metadata.version || 1,
        };
        
        store.put(data, 'metadata');
        transaction.oncomplete = () => {
          console.log('[Metadata Sync Supabase] Đã sync metadata về IndexedDB');
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
    });
  } catch (error) {
    console.error('[Metadata Sync Supabase] Lỗi khi sync về local:', error);
  }
}
