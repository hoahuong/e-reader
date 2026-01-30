import { useState, useEffect } from 'react';
import { listFolders, isLoggedIn, initializeGoogleAPI, loginGoogle, openDriveFolderPicker } from '../services/googleDrive';
import { extractErrorMessage } from '../utils/errorHandler';
import './DriveFolderSelector.css';

function DriveFolderSelector({ selectedFolderId, onFolderChange, onCreateFolder }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isOpeningPicker, setIsOpeningPicker] = useState(false);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialize Google API trước
      await initializeGoogleAPI();
      
      // Kiểm tra login sau khi initialize
      if (!isLoggedIn()) {
        setError('Vui lòng đăng nhập Google trước');
        setFolders([]);
        return;
      }

      const folderTree = await listFolders();
      
      // Defensive check: đảm bảo folderTree là array
      if (!folderTree || !Array.isArray(folderTree)) {
        console.warn('listFolders returned invalid data:', folderTree);
        setFolders([]);
        setError('Không thể tải danh sách folders: Dữ liệu không hợp lệ');
        return;
      }

      setFolders(folderTree);
      
      // Auto-expand root folders (chỉ khi có folders)
      if (folderTree.length > 0) {
        const rootFolderIds = folderTree.map(f => f?.id).filter(Boolean);
        if (rootFolderIds.length > 0) {
          setExpandedFolders(new Set(rootFolderIds));
        }
      }
    } catch (err) {
      console.error('Error loading folders:', err);
      setFolders([]); // Reset về empty array để tránh undefined
      const errorMessage = extractErrorMessage(err);
      setError('Không thể tải danh sách folders: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (e, folderId) => {
    e.stopPropagation();
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

  const handleFolderSelect = (folderId, folderName) => {
    onFolderChange(folderId, folderName);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      return;
    }

    try {
      setIsCreatingFolder(true);
      await onCreateFolder(newFolderName.trim(), selectedFolderId || 'root');
      setNewFolderName('');
      setShowCreateFolder(false);
      await loadFolders(); // Reload folders sau khi tạo
    } catch (err) {
      console.error('Error creating folder:', err);
      const errorMessage = extractErrorMessage(err);
      alert('Không thể tạo folder: ' + errorMessage);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      await loginGoogle();
      // Reload folders sau khi login thành công
      await loadFolders();
    } catch (err) {
      console.error('Login error:', err);
      setFolders([]); // Reset folders
      const errorMessage = extractErrorMessage(err);
      setError('Không thể đăng nhập Google: ' + errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleOpenGooglePicker = async () => {
    try {
      setIsOpeningPicker(true);
      setError(null);
      
      await openDriveFolderPicker((folderId, folderName) => {
        // Callback khi user chọn folder từ Google Picker
        if (folderId && folderName) {
          handleFolderSelect(folderId, folderName);
        }
        // Nếu folderId là null, user đã cancel - không làm gì
        setIsOpeningPicker(false);
      });
    } catch (err) {
      console.error('Error opening Google Picker:', err);
      const errorMessage = extractErrorMessage(err);
      setError('Không thể mở Google Drive Picker: ' + errorMessage + '. Bạn có thể chọn folder từ danh sách bên dưới.');
      setIsOpeningPicker(false);
    }
  };


  const renderFolderTree = (folderList, level = 0) => {
    // Defensive check
    if (!folderList || !Array.isArray(folderList)) {
      return null;
    }

    return folderList.map((folder) => {
      // Defensive check cho folder object
      if (!folder || !folder.id || !folder.name) {
        return null;
      }

      const hasChildren = folder.children && Array.isArray(folder.children) && folder.children.length > 0;
      const isExpanded = expandedFolders.has(folder.id);
      const isSelected = selectedFolderId === folder.id;

      return (
        <div key={folder.id} className="folder-tree-item" style={{ marginLeft: `${level * 20}px` }}>
          <div
            className={`folder-item ${isSelected ? 'selected' : ''}`}
            onClick={() => handleFolderSelect(folder.id, folder.name)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleFolderSelect(folder.id, folder.name);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Chọn folder ${folder.name}`}
            aria-selected={isSelected}
          >
            {hasChildren && (
              <span
                className="folder-toggle"
                onClick={(e) => toggleFolder(e, folder.id)}
              >
                {isExpanded ? '📂' : '📁'}
              </span>
            )}
            {!hasChildren && <span className="folder-icon">📄</span>}
            <span className="folder-name">{folder.name}</span>
            {isSelected && <span className="check-mark">✓</span>}
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

  if (!isLoggedIn()) {
    return (
      <div className="drive-folder-selector">
        <div className="empty-state">
          <div className="empty-state-icon">🔒</div>
          <div className="empty-state-title">Chưa đăng nhập Google</div>
          <div className="empty-state-message">
            Đăng nhập Google để chọn folder upload PDF lên Drive
          </div>
          <button
            type="button"
            className="btn-login-google"
            onClick={handleLogin}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? '⏳ Đang đăng nhập...' : '🔐 Đăng nhập Google'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="drive-folder-selector">
      <div className="folder-selector-header">
        <h4>📁 Chọn folder trên Google Drive</h4>
        <div className="header-actions">
          <button
            type="button"
            className="btn-create-folder"
            onClick={() => setShowCreateFolder(!showCreateFolder)}
            disabled={isCreatingFolder}
          >
            ➕ Tạo folder mới
          </button>
        </div>
      </div>

      {/* Google Drive Picker Button - Dùng Google Drive search thay vì custom search */}
      <div className="folder-search-container">
        <button
          type="button"
          className="btn-google-picker"
          onClick={handleOpenGooglePicker}
          disabled={isOpeningPicker}
          aria-label="Mở Google Drive Picker để tìm và chọn folder"
        >
          {isOpeningPicker ? '⏳ Đang mở...' : '🔍 Tìm folder bằng Google Drive'}
        </button>
        {selectedFolderId && (
          <div className="selected-folder-preview">
            📍 Đã chọn: <strong>
              {selectedFolderId === 'root'
                ? 'My Drive (Root)'
                : (folders && Array.isArray(folders)
                    ? (() => {
                        const findFolder = (list, id) => {
                          for (const f of list) {
                            if (f?.id === id) return f.name;
                            if (f?.children) {
                              const found = findFolder(f.children, id);
                              if (found) return found;
                            }
                          }
                          return null;
                        };
                        return findFolder(folders, selectedFolderId) || selectedFolderId;
                      })()
                    : selectedFolderId)
              }
            </strong>
          </div>
        )}
      </div>

      {showCreateFolder && (
        <div className="create-folder-form">
          <input
            type="text"
            placeholder="Tên folder mới..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            disabled={isCreatingFolder}
          />
          <div className="create-folder-actions">
            <button
              type="button"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || isCreatingFolder}
            >
              {isCreatingFolder ? 'Đang tạo...' : 'Tạo'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateFolder(false);
                setNewFolderName('');
              }}
              disabled={isCreatingFolder}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="folder-selector-content">
        <div
          className={`folder-item ${selectedFolderId === 'root' ? 'selected' : ''}`}
          onClick={() => handleFolderSelect('root', 'My Drive (Root)')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleFolderSelect('root', 'My Drive (Root)');
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Chọn folder My Drive (Root)"
          aria-selected={selectedFolderId === 'root'}
        >
          <span className="folder-icon">🏠</span>
          <span className="folder-name">My Drive (Root)</span>
          {selectedFolderId === 'root' && <span className="check-mark">✓</span>}
        </div>

        {loading ? (
          <div className="loading">
            <span>Đang tải folders...</span>
          </div>
        ) : error ? (
          <div className="error-message" role="alert">
            <strong>⚠️ Lỗi:</strong> {error}
          </div>
        ) : folders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <div className="empty-state-title">Chưa có folders</div>
            <div className="empty-state-message">
              Tạo folder mới để tổ chức PDF của bạn trên Google Drive
            </div>
          </div>
        ) : (
          <div className="folders-tree">
            {renderFolderTree(folders)}
          </div>
        )}
      </div>

    </div>
  );
}

export default DriveFolderSelector;
