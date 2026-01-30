/**
 * Google Drive API Service
 * Xử lý OAuth và các thao tác với Google Drive
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file';

let tokenClient = null;
let gapiLoaded = false;
let gisLoaded = false;

/**
 * Load Google APIs scripts
 */
export function loadGoogleAPIs() {
  return new Promise((resolve, reject) => {
    let gapiCheck = false;
    let gisCheck = false;

    const checkAndResolve = () => {
      if (gapiCheck && gisCheck) {
        resolve();
      }
    };

    // Load gapi (Google API client)
    if (window.gapi) {
      gapiCheck = true;
      checkAndResolve();
    } else {
      // Kiểm tra xem script đã được thêm chưa
      const existingGapi = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
      if (existingGapi) {
        existingGapi.onload = () => {
          gapiCheck = true;
          checkAndResolve();
        };
      } else {
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.onload = () => {
          gapiCheck = true;
          checkAndResolve();
        };
        gapiScript.onerror = () => reject(new Error('Failed to load Google API'));
        document.head.appendChild(gapiScript);
      }
    }

    // Load gis (Google Identity Services)
    if (window.google?.accounts) {
      gisCheck = true;
      checkAndResolve();
    } else {
      // Kiểm tra xem script đã được thêm chưa
      const existingGis = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingGis) {
        existingGis.onload = () => {
          gisCheck = true;
          checkAndResolve();
        };
      } else {
        const gisScript = document.createElement('script');
        gisScript.src = 'https://accounts.google.com/gsi/client';
        gisScript.onload = () => {
          gisCheck = true;
          checkAndResolve();
        };
        gisScript.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(gisScript);
      }
    }
  });
}

/**
 * Initialize Google API client
 */
export async function initializeGoogleAPI() {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('VITE_GOOGLE_CLIENT_ID không được cấu hình. Vui lòng thêm vào .env');
  }

  await loadGoogleAPIs();

  return new Promise((resolve, reject) => {
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          discoveryDocs: DISCOVERY_DOCS,
        });

        // Initialize token client (callback sẽ được set trong loginGoogle)
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: SCOPES,
          callback: () => {
            // Callback sẽ được override trong loginGoogle
            console.log('Token client initialized');
          },
        });

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Login với Google và lấy access token
 */
export async function loginGoogle() {
  if (!tokenClient) {
    await initializeGoogleAPI();
  }

  return new Promise((resolve, reject) => {
    // Set callback trước khi request token
    tokenClient.callback = (response) => {
      console.log('OAuth callback received:', response);
      
      if (response.error) {
        console.error('OAuth error:', response.error);
        reject(new Error(response.error));
        return;
      }

      try {
        // Lưu token vào gapi client
        if (window.gapi && window.gapi.client) {
          window.gapi.client.setToken(response);
        }
        
        // Lưu vào localStorage để dùng lại
        if (response.access_token) {
          localStorage.setItem('google_access_token', response.access_token);
          localStorage.setItem('google_token_expiry', String(Date.now() + (response.expires_in || 3600) * 1000));
        }
        
        console.log('Login successful');
        resolve(response);
      } catch (error) {
        console.error('Error processing token:', error);
        reject(error);
      }
    };

    // Request access token với use_fedcm để tránh popup blocker
    try {
      const existingToken = window.gapi?.client?.getToken();
      if (existingToken === null || existingToken === undefined) {
        console.log('Requesting new access token...');
        // Dùng use_fedcm để tránh popup blocker
        tokenClient.requestAccessToken({ 
          prompt: 'consent',
          hint: '', // Có thể thêm email hint nếu cần
        });
      } else {
        console.log('Using existing token');
        tokenClient.requestAccessToken({ prompt: '' });
      }
    } catch (error) {
      console.error('Error requesting token:', error);
      reject(error);
    }
  });
}

/**
 * Kiểm tra xem đã login chưa
 */
export function isLoggedIn() {
  const token = window.gapi?.client?.getToken();
  const savedToken = localStorage.getItem('google_access_token');
  const expiry = localStorage.getItem('google_token_expiry');
  
  if (token || (savedToken && expiry && Date.now() < parseInt(expiry))) {
    return true;
  }
  return false;
}

/**
 * Logout khỏi Google
 */
export function logoutGoogle() {
  const token = window.gapi?.client?.getToken();
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken('');
  }
  localStorage.removeItem('google_access_token');
  localStorage.removeItem('google_token_expiry');
}

/**
 * Lấy danh sách Shared Drives (Team Drives)
 */
export async function listSharedDrives() {
  if (!isLoggedIn()) {
    throw new Error('Chưa đăng nhập Google');
  }

  try {
    const response = await window.gapi.client.drive.drives.list({
      pageSize: 100,
    });

    return response.result.drives || [];
  } catch (error) {
    console.error('Error listing shared drives:', error);
    // Nếu không có quyền, trả về empty array
    return [];
  }
}

/**
 * Lấy danh sách folders từ My Drive với thông tin parent để xây dựng tree
 */
export async function listFolders(driveId = null) {
  if (!isLoggedIn()) {
    throw new Error('Chưa đăng nhập Google');
  }

  try {
    const query = "mimeType='application/vnd.google-apps.folder' and trashed=false";
    const params = {
      q: query,
      fields: 'files(id, name, parents)',
      orderBy: 'name',
      pageSize: 1000,
    };

    // Nếu có driveId (Shared Drive), thêm vào query
    if (driveId) {
      params.q = `${query} and '${driveId}' in parents`;
      params.driveId = driveId;
      params.includeItemsFromAllDrives = true;
      params.supportsAllDrives = true;
      params.corpora = 'drive';
    }

    const response = await window.gapi.client.drive.files.list(params);

    const folders = response.result.files || [];
    
    // Xây dựng tree structure
    return buildFolderTree(folders);
  } catch (error) {
    console.error('Error listing folders:', error);
    throw error;
  }
}

/**
 * Lấy danh sách files được chia sẻ với tôi
 */
export async function listSharedWithMe() {
  if (!isLoggedIn()) {
    throw new Error('Chưa đăng nhập Google');
  }

  try {
    const params = {
      q: "sharedWithMe=true and trashed=false",
      fields: 'files(id, name, mimeType, size, modifiedTime, parents, webViewLink, owners, shared)',
      orderBy: 'modifiedTime desc',
      pageSize: 100,
    };

    const response = await window.gapi.client.drive.files.list(params);
    const items = response.result.files || [];

    // Phân loại thành folders và files
    const folders = items.filter(item => item.mimeType === 'application/vnd.google-apps.folder');
    const files = items.filter(item => item.mimeType !== 'application/vnd.google-apps.folder');

    return {
      folders: folders.map(f => ({
        id: f.id,
        name: f.name,
        parents: f.parents || [],
        mimeType: f.mimeType,
        owners: f.owners || [],
        shared: f.shared || false,
      })),
      files: files.map(f => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
        modifiedTime: f.modifiedTime,
        webViewLink: f.webViewLink,
        owners: f.owners || [],
        shared: f.shared || false,
      })),
    };
  } catch (error) {
    console.error('Error listing shared with me:', error);
    throw error;
  }
}

/**
 * Lấy tất cả files và folders từ một folder cụ thể (bao gồm cả PDF và folders)
 */
export async function listFolderContents(folderId, driveId = null) {
  if (!isLoggedIn()) {
    throw new Error('Chưa đăng nhập Google');
  }

  try {
    const params = {
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, modifiedTime, parents)',
      orderBy: 'folder,name',
      pageSize: 1000,
    };

    if (driveId) {
      params.driveId = driveId;
      params.includeItemsFromAllDrives = true;
      params.supportsAllDrives = true;
    }

    const response = await window.gapi.client.drive.files.list(params);
    const items = response.result.files || [];

    // Phân loại thành folders và files
    const folders = items.filter(item => item.mimeType === 'application/vnd.google-apps.folder');
    const files = items.filter(item => item.mimeType !== 'application/vnd.google-apps.folder');

    return {
      folders: folders.map(f => ({
        id: f.id,
        name: f.name,
        parents: f.parents || [],
        mimeType: f.mimeType,
      })),
      files: files.map(f => ({
        id: f.id,
        name: f.name,
        size: f.size,
        modifiedTime: f.modifiedTime,
        mimeType: f.mimeType,
        webViewLink: f.webViewLink,
      })),
    };
  } catch (error) {
    console.error('Error listing folder contents:', error);
    throw error;
  }
}

/**
 * Xây dựng cây thư mục từ danh sách folders
 * Trả về tree structure (không flatten) để có thể expand/collapse
 */
function buildFolderTree(folders) {
  // Tạo map để tìm children nhanh
  const folderMap = new Map();
  folders.forEach(f => {
    folderMap.set(f.id, { 
      id: f.id, 
      name: f.name, 
      parents: f.parents || [],
      children: [] 
    });
  });
  
  // Xây dựng tree
  const tree = [];
  folders.forEach(folder => {
    const folderData = folderMap.get(folder.id);
    if (folder.parents && folder.parents.length > 0) {
      const parentId = folder.parents[0];
      if (parentId !== 'root' && folderMap.has(parentId)) {
        folderMap.get(parentId).children.push(folderData);
      } else {
        // Root folder
        tree.push(folderData);
      }
    } else {
      // Không có parent
      tree.push(folderData);
    }
  });
  
  return tree;
}

/**
 * Lấy danh sách PDF files từ một folder cụ thể
 */
export async function listPdfFilesInFolder(folderId, driveId = null) {
  if (!isLoggedIn()) {
    throw new Error('Chưa đăng nhập Google');
  }

  try {
    const params = {
      q: `'${folderId}' in parents and mimeType='application/pdf' and trashed=false`,
      fields: 'files(id, name, size, modifiedTime, webViewLink)',
      orderBy: 'name',
      pageSize: 1000,
    };

    if (driveId) {
      params.driveId = driveId;
      params.includeItemsFromAllDrives = true;
      params.supportsAllDrives = true;
    }

    const response = await window.gapi.client.drive.files.list(params);

    return response.result.files || [];
  } catch (error) {
    console.error('Error listing PDF files:', error);
    throw error;
  }
}

/**
 * Lấy tất cả PDF files từ My Drive (recursive)
 */
export async function listAllPdfFiles(driveId = null) {
  if (!isLoggedIn()) {
    throw new Error('Chưa đăng nhập Google');
  }

  try {
    const params = {
      q: "mimeType='application/pdf' and trashed=false",
      fields: 'files(id, name, size, modifiedTime, webViewLink, parents)',
      orderBy: 'name',
      pageSize: 1000,
    };

    if (driveId) {
      params.driveId = driveId;
      params.includeItemsFromAllDrives = true;
      params.supportsAllDrives = true;
      params.corpora = 'drive';
    }

    const response = await window.gapi.client.drive.files.list(params);

    return response.result.files || [];
  } catch (error) {
    console.error('Error listing all PDF files:', error);
    throw error;
  }
}

/**
 * Download PDF file từ Google Drive theo file ID
 * Trả về ArrayBuffer
 */
export async function downloadPdfFile(fileId) {
  if (!isLoggedIn()) {
    throw new Error('Chưa đăng nhập Google');
  }

  try {
    const token = window.gapi.client.getToken()?.access_token || 
                  localStorage.getItem('google_access_token');

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}

/**
 * Lấy thông tin file từ Google Drive
 */
export async function getFileInfo(fileId) {
  if (!isLoggedIn()) {
    throw new Error('Chưa đăng nhập Google');
  }

  try {
    const response = await window.gapi.client.drive.files.get({
      fileId: fileId,
      fields: 'id, name, size, modifiedTime, webViewLink',
    });

    return response.result;
  } catch (error) {
    console.error('Error getting file info:', error);
    throw error;
  }
}

/**
 * Upload PDF file lên Google Drive
 * @param {File} file - File PDF cần upload
 * @param {string} folderId - ID của folder trên Google Drive (optional, default: 'root')
 * @returns {Promise<{id: string, name: string, url: string}>}
 */
export async function uploadPdfToDrive(file, folderId = 'root') {
  if (!isLoggedIn()) {
    throw new Error('Chưa đăng nhập Google');
  }

  if (!file || file.type !== 'application/pdf') {
    throw new Error('File phải là PDF');
  }

  try {
    const accessToken = window.gapi.client.getToken()?.access_token;
    if (!accessToken) {
      throw new Error('Không có access token. Vui lòng đăng nhập lại.');
    }

    // Tạo tên file unique với timestamp
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${file.name}`;

    // Tạo metadata
    const metadata = {
      name: uniqueFileName,
      parents: [folderId],
      mimeType: 'application/pdf',
    };

    // Upload file lên Google Drive
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webContentLink,webViewLink,size,createdTime', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Google Drive API error: ${response.status}`);
    }

    const fileData = await response.json();

    return {
      id: fileData.id,
      name: file.name,
      url: fileData.webContentLink || fileData.webViewLink,
      driveId: fileData.id,
      uploadedAt: timestamp,
      size: fileData.size,
    };
  } catch (error) {
    console.error('Error uploading PDF to Drive:', error);
    throw error;
  }
}
