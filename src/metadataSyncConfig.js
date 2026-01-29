/**
 * Metadata Sync Configuration
 * Switch giữa các storage options dễ dàng
 * 
 * Options:
 * - 'vercel-blob': Vercel Blob Storage (default)
 * - 'github': GitHub API Storage
 * - 'local': Local Storage only (IndexedDB + localStorage backup)
 */

// Thay đổi giá trị này để switch storage option
// 'vercel-blob': Vercel Blob Storage (cần BLOB_READ_WRITE_TOKEN)
// 'github': GitHub API Storage (cần GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)
// 'local': Local Storage only - IndexedDB + localStorage backup (không cần config)
const STORAGE_TYPE = 'github'; // 'vercel-blob' | 'github' | 'local'

let metadataSyncModule = null;

async function getMetadataSyncModule() {
  if (metadataSyncModule) {
    return metadataSyncModule;
  }

  switch (STORAGE_TYPE) {
    case 'github':
      metadataSyncModule = await import('./metadataSyncGitHub');
      break;
    case 'local':
      metadataSyncModule = await import('./metadataSyncLocal');
      break;
    case 'vercel-blob':
    default:
      metadataSyncModule = await import('./metadataSync');
      break;
  }

  return metadataSyncModule;
}

export async function loadMetadataFromCloud() {
  const module = await getMetadataSyncModule();
  return module.loadMetadataFromCloud();
}

export async function saveMetadataToCloud(catalogs, files) {
  const module = await getMetadataSyncModule();
  return module.saveMetadataToCloud(catalogs, files);
}

export async function syncMetadataToLocal(metadata) {
  const module = await getMetadataSyncModule();
  return module.syncMetadataToLocal(metadata);
}
