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
 * Load metadata từ cloud (thực ra chỉ load từ localStorage backup)
 */
export async function loadMetadataFromCloud() {
  try {
    console.log('[Metadata Sync Local] Đang load metadata từ localStorage backup...');
    // Với local-only mode, không load từ cloud
    // Chỉ load từ localStorage backup nếu có
    const backup = loadFromLocalStorage();
    if (backup && (backup.catalogs?.length > 0 || backup.files?.length > 0)) {
      console.log(`[Metadata Sync Local] Load thành công từ backup: ${backup.catalogs?.length || 0} catalogs, ${backup.files?.length || 0} files`);
      return backup;
    }
    console.log('[Metadata Sync Local] Không có backup trong localStorage');
    return null;
  } catch (error) {
    console.warn('[Metadata Sync Local] Lỗi khi load từ localStorage:', error.message);
    return null;
  }
}

/**
 * Lưu metadata lên cloud (thực ra chỉ backup vào localStorage)
 * Không gọi API, không có timeout, luôn thành công
 */
export async function saveMetadataToCloud(catalogs, files) {
  try {
    console.log(`[Metadata Sync Local] Đang backup metadata: ${catalogs?.length || 0} catalogs, ${files?.length || 0} files`);
    // Chỉ backup vào localStorage, không sync cloud
    // Không có network call, không có timeout
    backupToLocalStorage(catalogs, files);
    console.log('[Metadata Sync Local] Đã backup metadata thành công');
    return { success: true, lastSync: Date.now() };
  } catch (error) {
    console.warn('[Metadata Sync Local] Lỗi khi backup:', error.message);
    // Vẫn return success để không block UI
    return { success: false, error: error.message };
  }
}

/**
 * Sync metadata từ cloud vào IndexedDB local
 * Re-export từ metadataSync.js để tương thích
 */
export { syncMetadataToLocal } from './metadataSync';
