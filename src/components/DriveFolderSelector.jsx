import { useState, useEffect } from 'react';
import { listFolders, isLoggedIn, initializeGoogleAPI } from '../services/googleDrive';
import './DriveFolderSelector.css';

function DriveFolderSelector({ selectedFolderId, onFolderChange, onCreateFolder }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!isLoggedIn()) {
        setError('Vui lòng đăng nhập Google trước');
        return;
      }

      await initializeGoogleAPI();
      const folderTree = await listFolders();
      setFolders(folderTree);
      
      // Auto-expand root folders
      const rootFolderIds = folderTree.map(f => f.id);
      setExpandedFolders(new Set(rootFolderIds));
    } catch (err) {
      console.error('Error loading folders:', err);
      setError('Không thể tải danh sách folders: ' + err.message);
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
      alert('Không thể tạo folder: ' + err.message);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const renderFolderTree = (folderList, level = 0) => {
    return folderList.map((folder) => {
      const hasChildren = folder.children && folder.children.length > 0;
      const isExpanded = expandedFolders.has(folder.id);
      const isSelected = selectedFolderId === folder.id;

      return (
        <div key={folder.id} className="folder-tree-item" style={{ marginLeft: `${level * 20}px` }}>
          <div
            className={`folder-item ${isSelected ? 'selected' : ''}`}
            onClick={() => handleFolderSelect(folder.id, folder.name)}
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
        <p className="info-message">
          ⚠️ Vui lòng đăng nhập Google để chọn folder upload
        </p>
      </div>
    );
  }

  return (
    <div className="drive-folder-selector">
      <div className="folder-selector-header">
        <h4>📁 Chọn folder trên Google Drive</h4>
        <button
          type="button"
          className="btn-create-folder"
          onClick={() => setShowCreateFolder(!showCreateFolder)}
          disabled={isCreatingFolder}
        >
          ➕ Tạo folder mới
        </button>
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
        >
          <span className="folder-icon">🏠</span>
          <span className="folder-name">My Drive (Root)</span>
          {selectedFolderId === 'root' && <span className="check-mark">✓</span>}
        </div>

        {loading ? (
          <div className="loading">Đang tải folders...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : folders.length === 0 ? (
          <div className="empty-state">Không có folder nào. Tạo folder mới để tổ chức files.</div>
        ) : (
          <div className="folders-tree">
            {renderFolderTree(folders)}
          </div>
        )}
      </div>

      {selectedFolderId && (
        <div className="selected-folder-info">
          📍 Folder đã chọn: <strong>{selectedFolderId === 'root' ? 'My Drive (Root)' : folders.find(f => f.id === selectedFolderId)?.name || selectedFolderId}</strong>
        </div>
      )}
    </div>
  );
}

export default DriveFolderSelector;
