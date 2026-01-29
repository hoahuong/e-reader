/**
 * Metadata Sync - Đồng bộ catalog và file list giữa các devices
 * Sử dụng Vercel Blob Storage để lưu metadata JSON
 */

/**
 * Lấy metadata từ cloud (Vercel Blob)
 */
export async function loadMetadataFromCloud() {
  try {
    const response = await fetch('/api/get-metadata');
    if (!response.ok) {
      // Nếu API không khả dụng, trả về null để dùng local
      return null;
    }
    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.warn('Không thể load metadata từ cloud:', error.message);
    return null;
  }
}

/**
 * Lưu metadata lên cloud (Vercel Blob)
 */
export async function saveMetadataToCloud(catalogs, files) {
  try {
    const payload = {
      catalogs: catalogs || [],
      files: files || [],
      lastSync: Date.now(),
    };
    
    console.log(`[Metadata Sync] Đang lưu metadata lên cloud: ${payload.catalogs.length} catalogs, ${payload.files.length} files`);
    
    const response = await fetch('/api/save-metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || `HTTP ${response.status}` };
      }
      console.error(`[Metadata Sync] API trả về lỗi ${response.status}:`, errorData);
      throw new Error(errorData.error || errorData.details || 'Không thể lưu metadata');
    }

    const result = await response.json();
    console.log('[Metadata Sync] Lưu thành công:', result);
    return result;
  } catch (error) {
    console.error('[Metadata Sync] Lỗi khi lưu metadata lên cloud:', error);
    console.error('[Metadata Sync] Chi tiết lỗi:', error.message, error.stack);
    // Không throw error để không block UI, chỉ log warning
    return null;
  }
}

/**
 * Sync metadata từ cloud vào IndexedDB local
 */
export async function syncMetadataToLocal(metadata) {
  if (!metadata) {
    console.log('[Metadata Sync] Không có metadata để sync');
    return;
  }

  const { catalogs = [], files = [] } = metadata;
  console.log(`[Metadata Sync] Bắt đầu sync vào local: ${catalogs.length} catalogs, ${files.length} files`);

  // Import các hàm cần thiết
  const { openDB } = await import('./pdfStorage');

  try {
    // Sync catalogs
    if (catalogs.length > 0) {
      // Sử dụng openDB và tạo catalogs store nếu cần
      const DB_NAME = 'PDFReaderDB';
      const CATALOG_STORE_NAME = 'catalogs';
      const MIN_VERSION = 5;
      
      const db = await new Promise((resolve, reject) => {
        const checkRequest = indexedDB.open(DB_NAME);
        checkRequest.onerror = () => reject(checkRequest.error);
        checkRequest.onsuccess = () => {
          const currentDb = checkRequest.result;
          const currentVersion = currentDb.version;
          const hasCatalogsStore = currentDb.objectStoreNames.contains(CATALOG_STORE_NAME);
          currentDb.close();

          if (hasCatalogsStore && currentVersion >= MIN_VERSION) {
            const request = indexedDB.open(DB_NAME, currentVersion);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            return;
          }

          const targetVersion = Math.max(currentVersion + 1, MIN_VERSION);
          const request = indexedDB.open(DB_NAME, targetVersion);
          request.onerror = () => reject(request.error);
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(CATALOG_STORE_NAME)) {
              const catalogStore = db.createObjectStore(CATALOG_STORE_NAME, { keyPath: 'id' });
              catalogStore.createIndex('name', 'name', { unique: true });
            }
          };
          request.onsuccess = () => resolve(request.result);
        };
      });
      
      const tx = db.transaction('catalogs', 'readwrite');
      const store = tx.objectStore('catalogs');

      // Clear existing catalogs và thêm catalogs từ cloud
      await new Promise((resolve, reject) => {
        const clearReq = store.clear();
        clearReq.onsuccess = () => {
          // Add catalogs từ cloud
          let added = 0;
          catalogs.forEach((catalog) => {
            const addReq = store.add(catalog);
            addReq.onsuccess = () => {
              added++;
              if (added === catalogs.length) {
                resolve();
              }
            };
            addReq.onerror = () => reject(addReq.error);
          });
          if (catalogs.length === 0) {
            resolve();
          }
        };
        clearReq.onerror = () => reject(clearReq.error);
        tx.oncomplete = () => {
          db.close();
          console.log(`[Metadata Sync] Đã sync ${catalogs.length} catalogs vào local`);
        };
      });
    } else {
      console.log('[Metadata Sync] Không có catalogs để sync');
    }

    // Sync files metadata
    if (files.length > 0) {
      const db = await openDB();
      const tx = db.transaction('pdfs', 'readwrite');
      const store = tx.objectStore('pdfs');

      // Merge files từ cloud với local (cloud là source of truth cho metadata)
      await new Promise((resolve, reject) => {
        // Lấy tất cả files local trước
        const localReq = store.getAll();
        localReq.onsuccess = () => {
          const localFiles = localReq.result || [];
          const localFilesMap = new Map(localFiles.map(f => [f.id, f]));

          // Update hoặc add files từ cloud
          let processed = 0;
          files.forEach((file) => {
            const localFile = localFilesMap.get(file.id);
            // Chỉ update metadata (catalog), giữ nguyên data nếu là local file
            const fileToSave = localFile 
              ? { ...localFile, catalog: file.catalog, name: file.name }
              : file;
            
            const putReq = store.put(fileToSave);
            putReq.onsuccess = () => {
              processed++;
              if (processed === files.length) {
                resolve();
              }
            };
            putReq.onerror = () => reject(putReq.error);
          });
          if (files.length === 0) {
            resolve();
          }
        };
        localReq.onerror = () => reject(localReq.error);
        tx.oncomplete = () => {
          db.close();
          console.log(`[Metadata Sync] Đã sync ${files.length} files vào local`);
        };
      });
    } else {
      console.log('[Metadata Sync] Không có files để sync');
    }
    
    console.log('[Metadata Sync] Hoàn thành sync metadata vào local');
  } catch (error) {
    console.error('[Metadata Sync] Lỗi khi sync metadata vào local:', error);
    console.error('[Metadata Sync] Chi tiết lỗi:', error.message, error.stack);
    throw error;
  }
}
