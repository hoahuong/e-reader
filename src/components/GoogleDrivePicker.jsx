import { useState, useEffect } from 'react';
import {
  initializeGoogleAPI,
  loginGoogle,
  logoutGoogle,
  isLoggedIn,
  listFolders,
  listSharedDrives,
  listFolderContents,
  listPdfFilesInFolder,
  listAllPdfFiles,
  downloadPdfFile,
} from '../services/googleDrive';
import {
  getGoogleAuthUrl,
  handleAuthRedirect,
  hasValidToken,
  getAccessToken,
  logoutGoogle as logoutRedirect,
} from '../services/googleDriveRedirect';
import './GoogleDrivePicker.css';

function GoogleDrivePicker({ onFileSelect }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [folders, setFolders] = useState([]);
  const [sharedDrives, setSharedDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(null); // null = My Drive
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [currentFolderContents, setCurrentFolderContents] = useState(null); // { folders, files }
  const [pdfFiles, setPdfFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set()); // Track expanded folders
  const [viewMode, setViewMode] = useState('folders'); // 'folders' | 'all' | 'shared'

  // Initialize Google API khi component mount
  useEffect(() => {
    const init = async () => {
      try {
        // Kiểm tra redirect từ Google OAuth
        const redirectToken = handleAuthRedirect();
        if (redirectToken) {
          console.log('Got token from redirect');
          // Set token vào gapi client
          await initializeGoogleAPI();
          if (window.gapi && window.gapi.client) {
            window.gapi.client.setToken(redirectToken);
          }
          setIsAuthenticated(true);
          setIsInitialized(true);
          await Promise.all([
            loadFolders(),
            loadSharedDrives(),
          ]);
          return;
        }

        await initializeGoogleAPI();
        setIsInitialized(true);
        if (isLoggedIn() || hasValidToken()) {
          setIsAuthenticated(true);
          // Set token vào gapi client nếu có
          const token = getAccessToken();
          if (token && window.gapi && window.gapi.client) {
            window.gapi.client.setToken({ access_token: token });
          }
          await loadFolders();
        }
      } catch (err) {
        console.error('Failed to initialize Google API:', err);
        setError('Không thể khởi tạo Google API. Kiểm tra VITE_GOOGLE_CLIENT_ID trong .env');
        setIsInitialized(true); // Vẫn set initialized để hiển thị UI
      }
    };

    init();
  }, []);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Chỉ dùng popup flow với Google Identity Services
      // Không cần redirect URI cho popup flow
      await loginGoogle();
      setIsAuthenticated(true);
      await Promise.all([
        loadFolders(),
        loadSharedDrives(),
      ]);
    } catch (err) {
      console.error('Login error:', err);
      
      // Nếu popup bị block hoặc có lỗi, hướng dẫn user
      if (err.message && (err.message.includes('popup') || err.message.includes('blocked'))) {
        setError('Popup bị chặn. Vui lòng cho phép popup từ trang này và thử lại.');
      } else {
        setError('Không thể đăng nhập Google: ' + err.message);
      }
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logoutGoogle();
    logoutRedirect();
    setIsAuthenticated(false);
    setFolders([]);
    setPdfFiles([]);
    setSelectedFolderId(null);
  };

  const loadFolders = async (driveId = null) => {
    try {
      setIsLoading(true);
      const folderTree = await listFolders(driveId);
      setFolders(folderTree);
      // Auto-expand root folders
      const rootFolderIds = folderTree.map(f => f.id);
      setExpandedFolders(new Set(rootFolderIds));
    } catch (err) {
      console.error('Error loading folders:', err);
      setError('Không thể tải danh sách folders: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSharedDrives = async () => {
    try {
      setIsLoading(true);
      const drives = await listSharedDrives();
      setSharedDrives(drives);
    } catch (err) {
      console.error('Error loading shared drives:', err);
      // Không hiển thị lỗi nếu không có quyền
    } finally {
      setIsLoading(false);
    }
  };

  const handleDriveSelect = async (driveId) => {
    setSelectedDriveId(driveId);
    setSelectedFolderId(null);
    setCurrentFolderContents(null);
    setPdfFiles([]);
    await loadFolders(driveId);
  };

  const handleFolderClick = async (folderId) => {
    setSelectedFolderId(folderId);
    try {
      setLoadingFiles(true);
      const contents = await listFolderContents(folderId, selectedDriveId);
      setCurrentFolderContents(contents);
      
      // Lấy PDF files từ folder này
      const pdfs = await listPdfFilesInFolder(folderId, selectedDriveId);
      setPdfFiles(pdfs);
    } catch (err) {
      console.error('Error loading folder contents:', err);
      setError('Không thể tải nội dung folder: ' + err.message);
    } finally {
      setLoadingFiles(false);
    }
  };

  const toggleFolder = (e, folderId) => {
    e.stopPropagation(); // Ngăn chặn click vào folder
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const isFolderExpanded = (folderId) => {
    return expandedFolders.has(folderId);
  };

  const hasSubfolders = (folder) => {
    return folder.children && folder.children.length > 0;
  };

  // Render folder tree với expand/collapse
  const renderFolderTree = (folderList, level = 0) => {
    return folderList.map((folder) => {
      const isExpanded = isFolderExpanded(folder.id);
      const hasChildren = hasSubfolders(folder);
      const isSelected = selectedFolderId === folder.id;

      return (
        <div key={folder.id} className="folder-tree-item">
          <div
            className={`folder-item ${isSelected ? 'selected' : ''}`}
            style={{ paddingLeft: `${12 + level * 20}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                className="folder-expand-btn"
                onClick={(e) => toggleFolder(e, folder.id)}
                title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            ) : (
              <span className="folder-expand-placeholder"></span>
            )}
            <span
              className="folder-name"
              onClick={() => handleFolderClick(folder.id)}
            >
              📁 {folder.name}
            </span>
          </div>
          {hasChildren && isExpanded && (
            <div className="folder-children">
              {renderFolderTree(folder.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const handleFolderSelect = async (folderId) => {
    await handleFolderClick(folderId);
  };

  const handleFileSelect = async (file) => {
    try {
      setIsLoading(true);
      setError(null);
      const arrayBuffer = await downloadPdfFile(file.id);
      
      // Tạo Blob từ ArrayBuffer và tạo Object URL
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Gọi callback với file data
      if (onFileSelect) {
        onFileSelect({
          file: url,
          fileName: file.name,
          source: 'google-drive',
        });
      }
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Không thể tải file: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="google-drive-picker">
        <div className="loading">Đang khởi tạo Google API...</div>
      </div>
    );
  }

  return (
    <div className="google-drive-picker">
      <div className="google-drive-header">
        <h3>📁 Google Drive</h3>
        {isAuthenticated ? (
          <button onClick={handleLogout} className="logout-btn">
            Đăng xuất
          </button>
        ) : (
          <button onClick={handleLogin} disabled={isLoading} className="login-btn">
            {isLoading ? 'Đang đăng nhập...' : '🔐 Đăng nhập Google'}
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
          {error.includes('VITE_GOOGLE_CLIENT_ID') && (
            <div style={{ marginTop: '12px', fontSize: '13px', lineHeight: '1.8' }}>
              <strong>📖 Hướng dẫn lấy Google Client ID (5 phút):</strong>
              <ol style={{ marginTop: '8px', paddingLeft: '20px' }}>
                <li>Truy cập: <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#4285f4' }}>Google Cloud Console</a></li>
                <li>Tạo Project mới → Enable "Google Drive API"</li>
                <li>Vào <strong>APIs & Services</strong> → <strong>Credentials</strong></li>
                <li>Click <strong>+ CREATE CREDENTIALS</strong> → <strong>OAuth client ID</strong></li>
                <li>Chọn <strong>Web application</strong> → Thêm <code>http://localhost:5173</code> vào <strong>Authorized JavaScript origins</strong></li>
                <li><strong>COPY Client ID</strong> (chỉ hiển thị 1 lần!)</li>
                <li>Tạo file <code>.env</code> trong thư mục <code>pdf-reader-app/</code></li>
                <li>Thêm: <code>VITE_GOOGLE_CLIENT_ID=paste-client-id-ở-đây</code></li>
                <li>Restart server: <code>npm run dev</code></li>
              </ol>
              <p style={{ marginTop: '12px', padding: '10px', background: '#f0f0f0', borderRadius: '6px' }}>
                💡 <strong>Xem chi tiết:</strong> Mở file <code>HUONG_DAN_GOOGLE_DRIVE.md</code> trong project
              </p>
            </div>
          )}
        </div>
      )}

      {isAuthenticated && (
        <div className="google-drive-content">
          {/* Drive Selector */}
          <div className="drive-selector">
            <button
              type="button"
              onClick={() => handleDriveSelect(null)}
              className={`drive-tab ${selectedDriveId === null ? 'active' : ''}`}
            >
              📁 My Drive
            </button>
            {sharedDrives.map((drive) => (
              <button
                key={drive.id}
                type="button"
                onClick={() => handleDriveSelect(drive.id)}
                className={`drive-tab ${selectedDriveId === drive.id ? 'active' : ''}`}
              >
                👥 {drive.name}
              </button>
            ))}
          </div>

          <div className="folders-section">
            <h4>Folders:</h4>
            {isLoading ? (
              <div className="loading">Đang tải folders...</div>
            ) : folders.length === 0 ? (
              <div className="empty-state">Không có folder nào</div>
            ) : (
              <div className="folders-list">
                {renderFolderTree(folders)}
              </div>
            )}
          </div>

          {selectedFolderId && currentFolderContents && (
            <div className="files-section">
              <h4>Nội dung folder:</h4>
              {loadingFiles ? (
                <div className="loading">Đang tải...</div>
              ) : (
                <>
                  {/* Subfolders */}
                  {currentFolderContents.folders.length > 0 && (
                    <div className="subfolders-list">
                      <h5>📁 Subfolders:</h5>
                      <div className="folders-list">
                        {currentFolderContents.folders.map((folder) => (
                          <button
                            key={folder.id}
                            onClick={() => handleFolderClick(folder.id)}
                            className="folder-item"
                          >
                            📁 {folder.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PDF Files */}
                  {pdfFiles.length > 0 && (
                    <div className="pdf-files-list">
                      <h5>📄 PDF Files:</h5>
                      <div className="files-list">
                        {pdfFiles.map((file) => (
                          <button
                            key={file.id}
                            onClick={() => handleFileSelect(file)}
                            disabled={isLoading}
                            className="file-item"
                          >
                            📄 {file.name}
                            {file.size && (
                              <span className="file-size">
                                ({(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentFolderContents.folders.length === 0 && pdfFiles.length === 0 && (
                    <div className="empty-state">Folder này trống</div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {!isAuthenticated && (
        <div className="login-prompt">
          <p>Đăng nhập Google để truy cập Google Drive và load PDF từ folders.</p>
        </div>
      )}
    </div>
  );
}

export default GoogleDrivePicker;
