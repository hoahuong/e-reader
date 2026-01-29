/**
 * Metadata Sync - Chỉ dùng Local Storage (IndexedDB + localStorage backup)
 * Không cần cloud sync, đơn giản và nhanh
 */

/**
 * Backup metadata vào localStorage
 */
function backupToLocalStorage(catalogs, files) {
  try {
    const backup = {
      catalogs: catalogs || [],
      files: files || [],
      lastSync: Date.now(),
      version: 1,
    };
    localStorage.setItem('pdf-metadata-backup', JSON.stringify(backup));
    console.log('[Metadata Sync Local] Đã backup vào localStorage');
  } catch (error) {
    console.warn('[Metadata Sync Local] Không thể backup vào localStorage:', error.message);
  }
}

/**
 * Load metadata từ localStorage backup
 */
function loadFromLocalStorage() {
  try {
    const backupStr = localStorage.getItem('pdf-metadata-backup');
    if (backupStr) {
      const backup = JSON.parse(backupStr);
      console.log('[Metadata Sync Local] Load từ localStorage backup');
      return backup;
    }
  } catch (error) {
    console.warn('[Metadata Sync Local] Không thể load từ localStorage:', error.message);
  }
  return null;
}

/**
 * Load metadata từ cloud (không làm gì, chỉ để tương thích với interface)
 */
export async function loadMetadataFromCloud() {
  // Với local-only mode, không load từ cloud
  // Chỉ load từ localStorage backup nếu có
  const backup = loadFromLocalStorage();
  if (backup) {
    return backup;
  }
  return null;
}

/**
 * Lưu metadata lên cloud (thực ra chỉ backup vào localStorage)
 */
export async function saveMetadataToCloud(catalogs, files) {
  try {
    // Chỉ backup vào localStorage, không sync cloud
    backupToLocalStorage(catalogs, files);
    console.log('[Metadata Sync Local] Đã backup metadata');
    return { success: true, lastSync: Date.now() };
  } catch (error) {
    console.warn('[Metadata Sync Local] Lỗi khi backup:', error.message);
    return null;
  }
}

/**
 * Sync metadata từ cloud vào IndexedDB local
 * Re-export từ metadataSync.js để tương thích
 */
export { syncMetadataToLocal } from './metadataSync';
