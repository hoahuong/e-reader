/**
 * Lưu và đọc PDF từ Vercel Blob Storage (cloud) + IndexedDB (cache metadata).
 * File PDF được lưu trên Vercel Blob, metadata (id, name, url) được cache trong IndexedDB.
 * 
 * Fallback mode: Nếu API route không khả dụng (local dev), sẽ tự động dùng IndexedDB.
 */

const DB_NAME = 'PDFReaderDB';
const MIN_VERSION = 4; // Version tối thiểu để đảm bảo có catalog support
const STORE_NAME = 'pdfs';
const CATALOG_STORE_NAME = 'catalogs';

// Kiểm tra xem có đang ở production (Vercel) không
const IS_PRODUCTION = typeof window !== 'undefined' && 
  (window.location.hostname.includes('vercel.app') || 
   window.location.hostname.includes('vercel.com'));

export function openDB() {
  return new Promise((resolve, reject) => {
    // Thử mở database không chỉ định version để lấy version hiện tại
    const checkRequest = indexedDB.open(DB_NAME);
    checkRequest.onerror = () => reject(checkRequest.error);
    checkRequest.onsuccess = () => {
      const currentDb = checkRequest.result;
      const currentVersion = currentDb.version;
      const hasCatalogsStore = currentDb.objectStoreNames.contains(CATALOG_STORE_NAME);
      const hasPdfsStore = currentDb.objectStoreNames.contains(STORE_NAME);
      currentDb.close();

      // Nếu đã có đầy đủ object stores và version >= MIN_VERSION, mở với version hiện tại
      if (hasPdfsStore && hasCatalogsStore && currentVersion >= MIN_VERSION) {
        const request = indexedDB.open(DB_NAME, currentVersion);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        return;
      }

      // Nếu thiếu object stores hoặc version thấp, cần upgrade
      const targetVersion = Math.max(currentVersion + 1, MIN_VERSION);
      const request = indexedDB.open(DB_NAME, targetVersion);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('url', 'url', { unique: false });
          store.createIndex('catalog', 'catalog', { unique: false });
        }
        if (!db.objectStoreNames.contains(CATALOG_STORE_NAME)) {
          const catalogStore = db.createObjectStore(CATALOG_STORE_NAME, { keyPath: 'id' });
          catalogStore.createIndex('name', 'name', { unique: true });
        }
      };
      request.onsuccess = () => resolve(request.result);
    };
  });
}

/**
 * Kiểm tra xem API route có khả dụng không.
 */
async function checkApiAvailable() {
  try {
    const response = await fetch('/api/upload-pdf', {
      method: 'OPTIONS', // Hoặc HEAD để kiểm tra
    });
    return response.status !== 404;
  } catch {
    return false;
  }
}

/**
 * Lưu file PDF vào IndexedDB (local mode).
 */
async function savePdfLocal(file, catalog = null) {
  const buffer = await file.arrayBuffer();
  const id = `local-${file.name}-${Date.now()}`;
  const record = {
    id,
    name: file.name,
    data: buffer,
    createdAt: Date.now(),
    isLocal: true, // Đánh dấu là file local
    catalog: catalog || null, // Thêm catalog
  };

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);
    req.onsuccess = () => resolve({ id, name: file.name, url: null, catalog });
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Lưu file PDF lên Vercel Blob Storage và cache metadata trong IndexedDB.
 * Tự động fallback về IndexedDB nếu API không khả dụng (local dev).
 * @param {File} file - File PDF từ input
 * @param {string} catalog - Catalog name (optional)
 * @returns {Promise<{id: string, name: string, url: string}>} - id, tên và URL đã lưu
 */
export async function savePdf(file, catalog = null) {
  if (!file || file.type !== 'application/pdf') {
    throw new Error('File không phải PDF');
  }

  // Kiểm tra file size trước khi upload
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > 10) {
    console.warn(`File size ${fileSizeMB.toFixed(2)}MB quá lớn, dùng IndexedDB local mode`);
    return savePdfLocal(file, catalog);
  }

  // Thử upload lên Vercel Blob trước với timeout
  try {
    const formData = new FormData();
    formData.append('file', file);

    // Tạo AbortController để timeout sau 55 giây (trước khi function timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55s timeout

    const response = await fetch('/api/upload-pdf', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();
      const { id, name, url } = result;

      // Cache metadata trong IndexedDB
      const record = {
        id: url,
        name,
        url,
        createdAt: Date.now(),
        isLocal: false,
        catalog: catalog || null, // Thêm catalog
      };

      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);
        req.onsuccess = () => resolve({ id: url, name, url, catalog: catalog || null });
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      });
    } else {
      // API trả về lỗi, lấy chi tiết lỗi từ response
      let errorMessage = 'Không thể upload PDF';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.details || errorMessage;
      } catch (e) {
        errorMessage = `Lỗi ${response.status}: ${response.statusText}`;
      }
      
      // Nếu là lỗi server (500), fallback về local
      if (response.status >= 500) {
        console.warn('API route lỗi server, dùng IndexedDB local mode:', errorMessage);
        return savePdfLocal(file, catalog);
      }
      
      // Nếu là lỗi client (400, 401, 403, etc.), throw error để hiển thị cho user
      throw new Error(errorMessage);
    }
    } catch (error) {
      // Kiểm tra xem có phải lỗi timeout hoặc abort không
      if (error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('504')) {
        console.warn('Upload timeout, dùng IndexedDB local mode:', error.message);
        return savePdfLocal(file, catalog);
      }
      
      // Kiểm tra xem có phải lỗi network không
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // Lỗi network hoặc API không tồn tại, fallback về local
        console.warn('Không thể kết nối API, dùng IndexedDB local mode:', error.message);
        return savePdfLocal(file, catalog);
      }
      
      // Nếu là lỗi từ API (đã được throw ở trên), re-throw để hiển thị cho user
      throw error;
    }
}

/**
 * Lấy danh sách tất cả PDF đã lưu từ IndexedDB cache.
 * @returns {Promise<Array<{id: string, name: string, url: string}>>}
 */
export async function listPdfs() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = (req.result || []).map(({ id, name, url, isLocal, catalog }) => ({ 
        id: id || url || `local-${name}`, 
        name, 
        url: url || null,
        isLocal: isLocal || false,
        catalog: catalog || null,
      }));
      // Sắp xếp mới nhất trước
      items.sort((a, b) => {
        const aTime = a.id.match(/\/(\d+)-/)?.[1] || a.id.match(/local-.*-(\d+)/)?.[1] || 0;
        const bTime = b.id.match(/\/(\d+)-/)?.[1] || b.id.match(/local-.*-(\d+)/)?.[1] || 0;
        return parseInt(bTime) - parseInt(aTime);
      });
      resolve(items);
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Đọc dữ liệu PDF từ Vercel Blob URL hoặc IndexedDB (local).
 * @param {string} id - URL của blob hoặc id từ IndexedDB
 * @returns {Promise<ArrayBuffer>}
 */
export async function getPdfData(id) {
  try {
    // Nếu id là URL đầy đủ (cloud), fetch trực tiếp
    if (id.startsWith('http')) {
      return fetchPdfFromUrl(id);
    }

    // Lấy từ IndexedDB
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const record = req.result;
        if (!record) {
          reject(new Error('PDF không tồn tại'));
          return;
        }

        // Nếu có URL (cloud), fetch từ URL
        if (record.url && !record.isLocal) {
          fetchPdfFromUrl(record.url).then(resolve).catch(reject);
        } 
        // Nếu là local (có data trong IndexedDB), clone ArrayBuffer để tránh detached
        else if (record.data) {
          // Clone ArrayBuffer để tránh lỗi "ArrayBuffer is already detached"
          const clonedBuffer = record.data.slice(0);
          resolve(clonedBuffer);
        } 
        else {
          reject(new Error('PDF không có dữ liệu'));
        }
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('Lỗi khi lấy PDF:', error);
    throw error;
  }
}

/**
 * Fetch PDF từ URL và trả về ArrayBuffer.
 */
async function fetchPdfFromUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Không thể tải PDF: ${response.statusText}`);
  }
  return response.arrayBuffer();
}

/**
 * Xóa một PDF khỏi Vercel Blob Storage và IndexedDB cache.
 * Tự động fallback về chỉ xóa local nếu API không khả dụng.
 * @param {string} id - URL của blob hoặc id từ IndexedDB
 */
export async function deletePdf(id) {
  try {
    // Lấy thông tin từ IndexedDB trước
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = async () => {
        const record = req.result;
        if (!record) {
          reject(new Error('PDF không tồn tại'));
          return;
        }

        // Nếu là file cloud (có URL), thử xóa từ Vercel Blob
        if (record.url && !record.isLocal) {
          try {
            await deletePdfFromBlob(record.url);
          } catch (error) {
            console.warn('Không thể xóa từ cloud, chỉ xóa local:', error.message);
            // Tiếp tục xóa local dù cloud fail
          }
        }

        // Xóa khỏi IndexedDB
        const deleteTx = db.transaction(STORE_NAME, 'readwrite');
        const deleteStore = deleteTx.objectStore(STORE_NAME);
        deleteStore.delete(id);
        deleteTx.oncomplete = () => {
          db.close();
          resolve();
        };
        deleteTx.onerror = () => reject(deleteTx.error);
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('Lỗi khi xóa PDF:', error);
    throw error;
  }
}

/**
 * Xóa PDF từ Vercel Blob Storage qua API.
 */
async function deletePdfFromBlob(url) {
  const response = await fetch(`/api/delete-pdf?url=${encodeURIComponent(url)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Không thể xóa PDF');
  }
}
