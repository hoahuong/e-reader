/**
 * Catalog Manager - Quản lý catalogs cho PDF files
 * Tự động đề xuất catalog dựa trên tên file
 */

/**
 * Tự động đề xuất catalog dựa trên tên file
 * Phân tích tên file để tìm keywords và đề xuất catalog phù hợp
 */
export function suggestCatalog(fileName) {
  const name = fileName.toLowerCase();
  
  // Patterns để nhận diện loại file
  const patterns = {
    'Sách': ['book', 'sách', 'ebook', 'novel', 'tiểu thuyết', 'truyện'],
    'Tài liệu': ['document', 'tài liệu', 'doc', 'manual', 'hướng dẫn', 'guide'],
    'Học tập': ['study', 'học', 'learn', 'course', 'khóa học', 'bài tập', 'homework'],
    'Công việc': ['work', 'công việc', 'business', 'report', 'báo cáo', 'meeting'],
    'Kỹ thuật': ['technical', 'kỹ thuật', 'tech', 'code', 'programming', 'lập trình'],
    'Tài chính': ['finance', 'tài chính', 'money', 'accounting', 'kế toán', 'budget'],
    'Y tế': ['health', 'y tế', 'medical', 'healthcare', 'sức khỏe'],
    'Pháp lý': ['legal', 'pháp lý', 'law', 'contract', 'hợp đồng', 'luật'],
    'Marketing': ['marketing', 'quảng cáo', 'advertising', 'campaign', 'chiến dịch'],
    'Giáo dục': ['education', 'giáo dục', 'teaching', 'giảng dạy', 'curriculum'],
  };

  // Tìm pattern khớp nhất
  let bestMatch = null;
  let maxMatches = 0;

  for (const [catalog, keywords] of Object.entries(patterns)) {
    const matches = keywords.filter(keyword => name.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = catalog;
    }
  }

  // Nếu không tìm thấy, đề xuất catalog mặc định dựa trên từ đầu tiên
  if (!bestMatch && name.length > 0) {
    const firstWord = name.split(/[\s_-]/)[0];
    if (firstWord.length > 2) {
      // Capitalize first letter
      bestMatch = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
    }
  }

  return bestMatch || 'Khác';
}

/**
 * Mở database và đảm bảo object store 'catalogs' tồn tại
 * Sử dụng cùng logic với pdfStorage để đảm bảo consistency
 */
function openDBWithCatalogs() {
  const DB_NAME = 'PDFReaderDB';
  const CATALOG_STORE_NAME = 'catalogs';
  const STORE_NAME = 'pdfs';
  const MIN_VERSION = 5; // Version tối thiểu để đảm bảo có catalog store

  return new Promise((resolve, reject) => {
    // Thử mở database không chỉ định version để lấy version hiện tại
    const checkRequest = indexedDB.open(DB_NAME);
    checkRequest.onerror = () => reject(checkRequest.error);
    checkRequest.onsuccess = () => {
      const currentDb = checkRequest.result;
      const currentVersion = currentDb.version;
      const hasCatalogsStore = currentDb.objectStoreNames.contains(CATALOG_STORE_NAME);
      currentDb.close();

      // Nếu đã có catalog store và version >= MIN_VERSION, mở với version hiện tại
      if (hasCatalogsStore && currentVersion >= MIN_VERSION) {
        const request = indexedDB.open(DB_NAME, currentVersion);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        return;
      }

      // Nếu thiếu catalog store hoặc version thấp, cần upgrade
      const targetVersion = Math.max(currentVersion + 1, MIN_VERSION);
      const request = indexedDB.open(DB_NAME, targetVersion);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Tạo object store 'pdfs' nếu chưa có (để đảm bảo tương thích)
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('url', 'url', { unique: false });
          store.createIndex('catalog', 'catalog', { unique: false });
        }
        // Tạo object store 'catalogs' nếu chưa có
        if (!db.objectStoreNames.contains(CATALOG_STORE_NAME)) {
          const catalogStore = db.createObjectStore(CATALOG_STORE_NAME, { keyPath: 'id' });
          catalogStore.createIndex('name', 'name', { unique: true });
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        resolve(db);
      };
    };
  });
}

/**
 * Lấy tất cả catalogs từ IndexedDB
 */
export async function getAllCatalogs() {
  const CATALOG_STORE_NAME = 'catalogs';

  return new Promise((resolve, reject) => {
    openDBWithCatalogs()
      .then((db) => {
        const tx = db.transaction(CATALOG_STORE_NAME, 'readonly');
        const store = tx.objectStore(CATALOG_STORE_NAME);
        const req = store.getAll();
      req.onsuccess = () => {
        const catalogs = req.result || [];
        // Sort by order first, then by name
        catalogs.sort((a, b) => {
          const orderA = a.order !== undefined ? a.order : 999999;
          const orderB = b.order !== undefined ? b.order : 999999;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          return a.name.localeCompare(b.name);
        });
        resolve(catalogs);
      };
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      })
      .catch(reject);
  });
}

/**
 * Tạo catalog mới
 */
export async function createCatalog(name, description = '') {
  const CATALOG_STORE_NAME = 'catalogs';

  return new Promise(async (resolve, reject) => {
    try {
      const db = await openDBWithCatalogs();
      
      // Get max order to add new catalog at the end
      const allCatalogs = await getAllCatalogs();
      const maxOrder = allCatalogs.length > 0 
        ? Math.max(...allCatalogs.map(c => c.order || 0))
        : -1;

      const catalog = {
        id: `catalog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        createdAt: Date.now(),
        order: maxOrder + 1, // Add at the end
      };

      const tx = db.transaction(CATALOG_STORE_NAME, 'readwrite');
      const store = tx.objectStore(CATALOG_STORE_NAME);
      const req = store.add(catalog);
      req.onsuccess = () => {
        tx.oncomplete = () => {
          db.close();
          resolve(catalog);
        };
      };
      req.onerror = () => reject(req.error);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Cập nhật catalog
 */
export async function updateCatalog(catalogId, newName, newDescription = null) {
  const CATALOG_STORE_NAME = 'catalogs';

  return new Promise((resolve, reject) => {
    openDBWithCatalogs()
      .then((db) => {
        const tx = db.transaction(CATALOG_STORE_NAME, 'readwrite');
        const store = tx.objectStore(CATALOG_STORE_NAME);
        const getReq = store.get(catalogId);
        getReq.onsuccess = () => {
          const catalog = getReq.result;
          if (!catalog) {
            reject(new Error('Catalog không tồn tại'));
            return;
          }
          catalog.name = newName;
          if (newDescription !== null) {
            catalog.description = newDescription;
          }
          const putReq = store.put(catalog);
          putReq.onsuccess = () => resolve(catalog);
          putReq.onerror = () => reject(putReq.error);
        };
        getReq.onerror = () => reject(getReq.error);
        tx.oncomplete = () => db.close();
      })
      .catch(reject);
  });
}

/**
 * Cập nhật thứ tự của catalogs
 */
export async function updateCatalogOrder(catalogIds) {
  const DB_NAME = 'PDFReaderDB';
  const CATALOG_STORE_NAME = 'catalogs';

  return new Promise((resolve, reject) => {
    openDBWithCatalogs()
      .then((db) => {
        const tx = db.transaction(CATALOG_STORE_NAME, 'readwrite');
        const store = tx.objectStore(CATALOG_STORE_NAME);
        
        // Update order for each catalog
        const updates = catalogIds.map((catalogId, index) => {
          return new Promise((resolveUpdate, rejectUpdate) => {
            const getReq = store.get(catalogId);
            getReq.onsuccess = () => {
              const catalog = getReq.result;
              if (catalog) {
                catalog.order = index;
                const putReq = store.put(catalog);
                putReq.onsuccess = () => resolveUpdate();
                putReq.onerror = () => rejectUpdate(putReq.error);
              } else {
                resolveUpdate();
              }
            };
            getReq.onerror = () => rejectUpdate(getReq.error);
          });
        });

        Promise.all(updates)
          .then(() => {
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
          })
          .catch(reject);
      })
      .catch(reject);
  });
}

/**
 * Xóa catalog
 */
export async function deleteCatalog(catalogId) {
  const CATALOG_STORE_NAME = 'catalogs';

  return new Promise((resolve, reject) => {
    openDBWithCatalogs()
      .then((db) => {
        const tx = db.transaction(CATALOG_STORE_NAME, 'readwrite');
        const store = tx.objectStore(CATALOG_STORE_NAME);
        const req = store.delete(catalogId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
      })
      .catch(reject);
  });
}
