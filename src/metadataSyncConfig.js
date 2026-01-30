/**
 * Metadata Sync Configuration
 * Switch giữa các storage options dễ dàng
 * 
 * Options:
 * - 'supabase': Supabase Database (recommended) ⭐ Real-time sync
 * - 'vercel-kv': Vercel KV Storage
 * - 'vercel-blob': Vercel Blob Storage
 * - 'github': GitHub API Storage
 * - 'local': Local Storage only (IndexedDB + localStorage backup)
 */

// Thay đổi giá trị này để switch storage option
// 'supabase': Supabase Database - Real-time sync, free tier 500MB (recommended) ⭐
// 'vercel-kv': Vercel KV Storage - Low latency, free tier 30K ops/day
// 'vercel-blob': Vercel Blob Storage (cần BLOB_READ_WRITE_TOKEN)
// 'github': GitHub API Storage (cần GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO)
// 'local': Local Storage only - IndexedDB + localStorage backup (không cần config)
// 
// Lưu ý: Nếu chọn 'supabase' nhưng chưa setup, app sẽ tự động fallback về 'local'
const STORAGE_TYPE = 'supabase'; // 'supabase' | 'vercel-kv' | 'vercel-blob' | 'github' | 'local'

let metadataSyncModule = null;

async function getMetadataSyncModule() {
  if (metadataSyncModule) {
    return metadataSyncModule;
  }

  switch (STORAGE_TYPE) {
    case 'supabase':
      metadataSyncModule = await import('./metadataSyncSupabase');
      break;
    case 'vercel-kv':
      metadataSyncModule = await import('./metadataSyncKV');
      break;
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
