import { useState, useEffect } from 'react';
import {
  initializeGoogleAPI,
  loginGoogle,
  logoutGoogle,
  isLoggedIn,
  listFolders,
  listSharedDrives,
  listFolderContents,
  listSharedWithMe,
  listAllPdfFiles,
  downloadPdfFile,
} from '../services/googleDrive';
import {
  handleAuthRedirect,
  hasValidToken,
  getAccessToken,
  logoutGoogle as logoutRedirect,
} from '../services/googleDriveRedirect';
import LanguageSelector from './LanguageSelector';
import { t, getCurrentLanguage } from '../i18n/locales';
import './GoogleDriveViewer.css';

function GoogleDriveViewer({ onFileSelect }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState(getCurrentLanguage());
  
  // Navigation
  const [currentView, setCurrentView] = useState('my-drive'); // 'my-drive', 'shared', 'recent', 'starred', 'trash'
  const [selectedDriveId, setSelectedDriveId] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [folderPath, setFolderPath] = useState([{ id: 'root', name: t('nav.myDrive') }]);
  
  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      const newLang = getCurrentLanguage();
      if (newLang !== lang) {
        setLang(newLang);
        // Force re-render by updating folder path
        if (folderPath.length > 0 && folderPath[0].id === 'root') {
          setFolderPath([{ id: 'root', name: t('nav.myDrive') }]);
        }
      }
    };
    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, [lang, folderPath]);
  
  // Data
  const [sharedDrives, setSharedDrives] = useState([]);
  const [currentItems, setCurrentItems] = useState([]); // Files và folders trong folder hiện tại
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'modified' | 'size'
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        const redirectToken = handleAuthRedirect();
        if (redirectToken) {
          await initializeGoogleAPI();
          if (window.gapi && window.gapi.client) {
            window.gapi.client.setToken(redirectToken);
          }
          setIsAuthenticated(true);
          setIsInitialized(true);
          await loadDriveData();
          return;
        }

        await initializeGoogleAPI();
        setIsInitialized(true);
        if (isLoggedIn() || hasValidToken()) {
          setIsAuthenticated(true);
          const token = getAccessToken();
          if (token && window.gapi && window.gapi.client) {
            window.gapi.client.setToken({ access_token: token });
          }
          await loadDriveData();
        }
      } catch (err) {
        console.error('Failed to initialize Google API:', err);
        setError('Không thể khởi tạo Google API. Kiểm tra VITE_GOOGLE_CLIENT_ID trong .env');
        setIsInitialized(true);
      }
    };

    init();
  }, []);

  // Load data khi view hoặc folder thay đổi
  useEffect(() => {
    if (isAuthenticated) {
      loadCurrentView();
    }
  }, [isAuthenticated, currentView, currentFolderId, selectedDriveId]);

  const loadDriveData = async () => {
    try {
      const drives = await listSharedDrives();
      setSharedDrives(drives);
      await loadCurrentView();
    } catch (err) {
      console.error('Error loading drive data:', err);
    }
  };

  const loadCurrentView = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (currentView === 'my-drive') {
        await loadFolderContents(currentFolderId);
      } else if (currentView === 'shared') {
        await loadSharedWithMe();
      } else if (currentView === 'recent') {
        await loadRecentFiles();
      } else if (currentView === 'starred') {
        await loadStarredFiles();
      }
    } catch (err) {
      console.error('Error loading view:', err);
      setError(t('msg.errorLoading') + ': ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFolderContents = async (folderId) => {
    try {
      const contents = await listFolderContents(folderId, selectedDriveId);
      const items = [
        ...contents.folders.map(f => ({ ...f, type: 'folder' })),
        ...contents.files.map(f => ({ ...f, type: 'file' })),
      ];
      setCurrentItems(items);
    } catch (err) {
      throw err;
    }
  };

  const loadSharedWithMe = async () => {
    try {
      const contents = await listSharedWithMe();
      const items = [
        ...contents.folders.map(f => ({ ...f, type: 'folder' })),
        ...contents.files.map(f => ({ ...f, type: 'file' })),
      ];
      setCurrentItems(items);
    } catch (err) {
      throw err;
    }
  };

  const loadRecentFiles = async () => {
    try {
      const params = {
        q: "trashed=false",
        fields: 'files(id, name, mimeType, size, modifiedTime, parents, webViewLink)',
        orderBy: 'modifiedTime desc',
        pageSize: 100,
      };

      if (selectedDriveId) {
        params.driveId = selectedDriveId;
        params.includeItemsFromAllDrives = true;
        params.supportsAllDrives = true;
        params.corpora = 'drive';
      }

      const response = await window.gapi.client.drive.files.list(params);
      const items = (response.result.files || []).map(item => ({
        ...item,
        type: item.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
      }));
      setCurrentItems(items);
    } catch (err) {
      throw err;
    }
  };

  const loadStarredFiles = async () => {
    try {
      const params = {
        q: "starred=true and trashed=false",
        fields: 'files(id, name, mimeType, size, modifiedTime, parents, webViewLink)',
        orderBy: 'name',
        pageSize: 100,
      };

      if (selectedDriveId) {
        params.driveId = selectedDriveId;
        params.includeItemsFromAllDrives = true;
        params.supportsAllDrives = true;
        params.corpora = 'drive';
      }

      const response = await window.gapi.client.drive.files.list(params);
      const items = (response.result.files || []).map(item => ({
        ...item,
        type: item.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
      }));
      setCurrentItems(items);
    } catch (err) {
      throw err;
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await loginGoogle();
      setIsAuthenticated(true);
      await loadDriveData();
    } catch (err) {
      console.error('Login error:', err);
      setError(t('msg.error') + ': ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logoutGoogle();
    logoutRedirect();
    setIsAuthenticated(false);
    setCurrentItems([]);
    setCurrentFolderId('root');
    setFolderPath([{ id: 'root', name: t('nav.myDrive') }]);
  };

  const handleFolderClick = async (folderId, folderName) => {
    setCurrentFolderId(folderId);
    setFolderPath([...folderPath, { id: folderId, name: folderName }]);
    await loadFolderContents(folderId);
  };

  const handleBreadcrumbClick = async (index) => {
    const newPath = folderPath.slice(0, index + 1);
    const targetFolder = newPath[newPath.length - 1];
    setFolderPath(newPath);
    setCurrentFolderId(targetFolder.id);
    await loadFolderContents(targetFolder.id);
  };

  const handleFileClick = async (file) => {
    if (file.mimeType === 'application/pdf') {
      try {
        setIsLoading(true);
        const arrayBuffer = await downloadPdfFile(file.id);
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
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
    }
  };

  const handleDriveSelect = async (driveId) => {
    setSelectedDriveId(driveId);
    setCurrentFolderId('root');
    setFolderPath([{ id: 'root', name: driveId ? 'Shared Drive' : 'Drive của tôi' }]);
    setCurrentView('my-drive');
  };

  // Sort items
  const sortedItems = [...currentItems].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'modified') {
      return new Date(b.modifiedTime || 0) - new Date(a.modifiedTime || 0);
    } else if (sortBy === 'size') {
      return (parseInt(b.size || 0) - parseInt(a.size || 0));
    }
    return 0;
  });

  // Filter by search
  const filteredItems = searchQuery
    ? sortedItems.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedItems;

  if (!isInitialized) {
    return (
      <div className="google-drive-viewer">
        <div className="loading">{t('msg.initializing')}</div>
      </div>
    );
  }

  return (
    <div className="google-drive-viewer" key={lang}>
      {/* Header */}
      <div className="drive-header">
        <div className="drive-header-left">
          <div className="drive-logo">📁</div>
          <span className="drive-title">Drive</span>
        </div>
        <div className="drive-search">
          <input
            type="text"
            placeholder={t('header.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="drive-header-right">
          <LanguageSelector />
          {isAuthenticated ? (
            <button onClick={handleLogout} className="logout-header-btn">
              {t('header.logout')}
            </button>
          ) : (
            <button onClick={handleLogin} disabled={isLoading} className="login-header-btn">
              {isLoading ? t('msg.loading') : t('header.login')}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {t('msg.error')}: {error}
        </div>
      )}

      {isAuthenticated ? (
        <div className="drive-main">
          {/* Sidebar */}
          <div className="drive-sidebar">
            <button className="new-btn">+ New</button>
            <nav className="drive-nav">
              <button
                className={`nav-item ${currentView === 'my-drive' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('my-drive');
    setCurrentFolderId('root');
    setFolderPath([{ id: 'root', name: t('nav.myDrive') }]);
                }}
              >
                🏠 Trang chủ
              </button>
              <button
                className={`nav-item ${currentView === 'my-drive' && currentFolderId === 'root' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('my-drive');
    setCurrentFolderId('root');
    setFolderPath([{ id: 'root', name: t('nav.myDrive') }]);
                }}
              >
                📁 {t('nav.myDrive')}
              </button>
              <button
                className={`nav-item ${currentView === 'shared' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentView('shared');
                  setCurrentFolderId(null);
                  setSelectedDriveId(null);
                  setFolderPath([{ id: 'shared', name: t('nav.sharedWithMe') }]);
                }}
              >
                👥 {t('nav.sharedWithMe')}
              </button>
              <button
                className={`nav-item ${currentView === 'recent' ? 'active' : ''}`}
                onClick={() => setCurrentView('recent')}
              >
                ⏰ {t('nav.recent')}
              </button>
              <button
                className={`nav-item ${currentView === 'starred' ? 'active' : ''}`}
                onClick={() => setCurrentView('starred')}
              >
                ⭐ {t('nav.starred')}
              </button>
              <button
                className={`nav-item ${currentView === 'trash' ? 'active' : ''}`}
                onClick={() => setCurrentView('trash')}
              >
                🗑️ {t('nav.trash')}
              </button>
            </nav>

            {/* Shared Drives */}
            {sharedDrives.length > 0 && (
              <div className="shared-drives-section">
                <div className="section-title">Shared Drives</div>
                {sharedDrives.map((drive) => (
                  <button
                    key={drive.id}
                    className={`nav-item ${selectedDriveId === drive.id ? 'active' : ''}`}
                    onClick={() => handleDriveSelect(drive.id)}
                  >
                    👥 {drive.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="drive-content">
            {/* Breadcrumb */}
            {currentView === 'my-drive' && folderPath.length > 1 && (
              <div className="breadcrumb">
                {folderPath.map((folder, index) => (
                  <span key={folder.id}>
                    {index > 0 && <span className="breadcrumb-separator"> › </span>}
                    <button
                      className="breadcrumb-item"
                      onClick={() => handleBreadcrumbClick(index)}
                    >
                      {folder.name}
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Toolbar */}
            <div className="drive-toolbar">
              <div className="toolbar-left">
                <h2 className="view-title">
                  {currentView === 'my-drive' && folderPath[folderPath.length - 1].name}
                  {currentView === 'shared' && t('view.sharedWithMe')}
                  {currentView === 'recent' && t('view.recent')}
                  {currentView === 'starred' && t('view.starred')}
                  {currentView === 'trash' && t('view.trash')}
                </h2>
              </div>
              <div className="toolbar-right">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select"
                >
                  <option value="name">{t('toolbar.sort.name')}</option>
                  <option value="modified">{t('toolbar.sort.modified')}</option>
                  <option value="size">{t('toolbar.sort.size')}</option>
                </select>
                <div className="view-toggle">
                  <button
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title={t('toolbar.view.list')}
                  >
                    ☰
                  </button>
                  <button
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title={t('toolbar.view.grid')}
                  >
                    ⊞
                  </button>
                </div>
              </div>
            </div>

            {/* Items List/Grid */}
            {isLoading ? (
              <div className="loading">{t('msg.loading')}</div>
            ) : filteredItems.length === 0 ? (
              <div className="empty-state">
                {searchQuery ? t('msg.noFiles') : t('msg.noFiles')}
              </div>
            ) : viewMode === 'list' ? (
              <div className="drive-list-view">
                <table className="drive-table">
                  <thead>
                    <tr>
                      <th>{t('toolbar.sort.name')}</th>
                      <th>Owner</th>
                      <th>{t('toolbar.sort.modified')}</th>
                      <th>{t('toolbar.sort.size')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="drive-item-row"
                        onClick={() => {
                          if (item.type === 'folder') {
                            handleFolderClick(item.id, item.name);
                          } else if (item.mimeType === 'application/pdf') {
                            handleFileClick(item);
                          }
                        }}
                      >
                        <td className="item-name">
                          {item.type === 'folder' ? '📁' : '📄'} {item.name}
                        </td>
                        <td>Tôi</td>
                        <td>
                          {item.modifiedTime
                            ? new Date(item.modifiedTime).toLocaleDateString('vi-VN')
                            : '-'}
                        </td>
                        <td>
                          {item.size
                            ? `${(parseInt(item.size) / 1024 / 1024).toFixed(2)} MB`
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="drive-grid-view">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="drive-item-card"
                    onClick={() => {
                      if (item.type === 'folder') {
                        handleFolderClick(item.id, item.name);
                      } else if (item.mimeType === 'application/pdf') {
                        handleFileClick(item);
                      }
                    }}
                  >
                    <div className="item-icon">
                      {item.type === 'folder' ? '📁' : '📄'}
                    </div>
                    <div className="item-name-card">{item.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="login-prompt">
          <p>Đăng nhập Google để truy cập Google Drive</p>
        </div>
      )}
    </div>
  );
}

export default GoogleDriveViewer;
