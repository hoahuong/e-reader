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
    const timeoutMs = 10000; // 10s timeout
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    // Log fetch options trước khi gửi GET request
    const fetchOptions = {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-cache',
    };
    console.log('[Metadata Sync KV] 🔍 CLIENT DEBUG - GET Fetch options:', {
      method: fetchOptions.method,
      hasSignal: !!fetchOptions.signal,
      cache: fetchOptions.cache,
    });
    
    try {
      console.log('[Metadata Sync KV] 🔍 CLIENT DEBUG - About to call fetch() for GET...');
      const fetchStartTime = Date.now();
      const response = await fetch('/api/kv-metadata', fetchOptions);
      const fetchDuration = Date.now() - fetchStartTime;
      console.log(`[Metadata Sync KV] 🔍 CLIENT DEBUG - GET Fetch completed in ${fetchDuration}ms, status: ${response.status}`);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('[Metadata Sync KV] Không có metadata trên KV (chưa có data)');
          return null;
        }
        
        // 503 Service Unavailable = Redis chưa được setup
        if (response.status === 503) {
          const errorData = await response.json().catch(() => ({}));
          console.warn('[Metadata Sync KV] Upstash Redis chưa được setup:', errorData.details || errorData.error);
          console.info('[Metadata Sync KV] Hướng dẫn setup:', errorData.instructions || 'Xem SETUP_GOOGLE_DRIVE_KV.md');
          // Trả về null để app fallback về local storage
          return null;
        }
        
        const errorText = await response.text();
        console.warn(`[Metadata Sync KV] API trả về lỗi ${response.status}:`, errorText);
        return null;
      }
      
      // Check content-type để đảm bảo là JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[Metadata Sync KV] Response không phải JSON:', text.substring(0, 200));
        return null;
      }
      
      let metadata;
      try {
        metadata = await response.json();
      } catch (jsonError) {
        console.error('[Metadata Sync KV] Lỗi parse JSON:', jsonError);
        const text = await response.text();
        console.error('[Metadata Sync KV] Response text:', text.substring(0, 200));
        return null;
      }
      
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
        console.warn(`[Metadata Sync KV] Request timeout sau ${timeoutMs}ms, fallback về IndexedDB`);
        return null;
      }
      throw fetchError;
    }
  } catch (error) {
    // Handle network errors, CORS errors, etc.
    if (error.name === 'AbortError') {
      console.warn(`[Metadata Sync KV] Request timeout sau ${timeoutMs}ms, fallback về IndexedDB`);
    } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      console.warn('[Metadata Sync KV] Network error, fallback về IndexedDB:', error.message);
    } else {
      console.error('[Metadata Sync KV] Lỗi khi load metadata:', error);
    }
    return null; // Fallback về IndexedDB
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
    
    // Log chi tiết payload trước khi gửi
    const payloadString = JSON.stringify(payload);
    console.log('[Metadata Sync KV] 🔍 CLIENT DEBUG - Payload details:', {
      catalogsCount: payload.catalogs.length,
      filesCount: payload.files.length,
      payloadSize: payloadString.length,
      payloadSizeKB: (payloadString.length / 1024).toFixed(2),
      hasLastSync: !!payload.lastSync,
      payloadPreview: payloadString.substring(0, 200),
    });
    
    const controller = new AbortController();
    const timeoutMs = 25000; // 25s timeout cho save operation (match với maxDuration của API)
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    // Log fetch options trước khi gửi
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payloadString,
      signal: controller.signal,
    };
    console.log('[Metadata Sync KV] 🔍 CLIENT DEBUG - Fetch options:', {
      method: fetchOptions.method,
      headers: fetchOptions.headers,
      bodyType: typeof fetchOptions.body,
      bodyLength: fetchOptions.body.length,
      bodyPreview: fetchOptions.body.substring(0, 200),
      hasSignal: !!fetchOptions.signal,
    });
    
    try {
      console.log('[Metadata Sync KV] 🔍 CLIENT DEBUG - About to call fetch()...');
      const fetchStartTime = Date.now();
      const response = await fetch('/api/kv-metadata', fetchOptions);
      const fetchDuration = Date.now() - fetchStartTime;
      console.log(`[Metadata Sync KV] 🔍 CLIENT DEBUG - Fetch completed in ${fetchDuration}ms, status: ${response.status}`);
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}` };
        }
        
        // Handle 500 errors (thường do thiếu env vars hoặc timeout)
        if (response.status === 500) {
          if (errorData.error?.includes('Upstash Redis chưa được setup') || 
              errorData.error?.includes('KV_REST_API_URL') ||
              errorData.error?.includes('KV_REST_API_TOKEN')) {
            console.warn('[Metadata Sync KV] Redis chưa được setup, không thể lưu metadata lên cloud');
            console.warn('[Metadata Sync KV] Metadata sẽ chỉ lưu local (IndexedDB)');
            // Không throw error, chỉ log warning và return null để fallback về local
            return null;
          }
          
          // Handle timeout errors từ server
          if (errorData.error?.includes('timeout') || errorData.details?.includes('timeout')) {
            console.warn('[Metadata Sync KV] Server timeout khi lưu metadata, sẽ lưu local thay thế');
            return null; // Fallback về local storage
          }
        }
        
        // Handle 503 (Service Unavailable)
        if (response.status === 503) {
          console.warn('[Metadata Sync KV] Redis không khả dụng, sẽ lưu local thay thế');
          return null; // Fallback về local storage
        }
        
        console.error(`[Metadata Sync KV] API trả về lỗi ${response.status}:`, errorData);
        // Không throw error, chỉ log và return null để không block UI
        return null;
      }

      const result = await response.json();
      console.log('[Metadata Sync KV] Lưu thành công:', result);
      return result;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.warn(`[Metadata Sync KV] Request timeout sau ${timeoutMs}ms, sẽ lưu local thay thế`);
        // Không throw error, chỉ log warning và return null để fallback về local
        return null;
      }
      
      // Handle network errors
      if (fetchError.message?.includes('Failed to fetch') || 
          fetchError.message?.includes('NetworkError') ||
          fetchError.message?.includes('timeout')) {
        console.warn('[Metadata Sync KV] Network error khi lưu metadata, sẽ lưu local thay thế:', fetchError.message);
        return null; // Fallback về local storage
      }
      
      // Log error nhưng không throw để không block UI
      console.error('[Metadata Sync KV] Lỗi khi lưu metadata:', fetchError);
      return null;
    }
  } catch (error) {
    console.error('[Metadata Sync KV] Lỗi khi lưu metadata:', error);
    // Không throw error, chỉ return null để fallback về local storage
    return null;
  }
}

// Re-export syncMetadataToLocal từ metadataSync.js
export { syncMetadataToLocal } from './metadataSync';
