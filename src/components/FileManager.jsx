import { useState, useEffect } from 'react';
import { listPdfs, deletePdf, getPdfData } from '../pdfStorage';
import { getAllCatalogs, createCatalog, updateCatalog, deleteCatalog, updateCatalogOrder } from '../catalogManager';
import { openDB } from '../pdfStorage';
import { loadMetadataFromCloud, syncMetadataToLocal, saveMetadataToCloud } from '../metadataSync';
import { t, getCurrentLanguage } from '../i18n/locales';
import './FileManager.css';

function FileManager({ onFileSelect }) {
  const [files, setFiles] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedFile, setDraggedFile] = useState(null);
  const [dragOverCatalog, setDragOverCatalog] = useState(null);
  const [draggedCatalog, setDraggedCatalog] = useState(null);
  const [dragOverCatalogPosition, setDragOverCatalogPosition] = useState(null);
  const [editingCatalog, setEditingCatalog] = useState(null);
  const [editingCatalogName, setEditingCatalogName] = useState('');
  const [lang, setLang] = useState(getCurrentLanguage());

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      const newLang = getCurrentLanguage();
      if (newLang !== lang) {
        setLang(newLang);
        // Force re-render by reloading data
        loadData();
      }
    };
    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, [lang]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Bước 1: Load từ local IndexedDB trước (hiển thị ngay)
      console.log('[FileManager] Đang load data từ local IndexedDB...');
      const [filesList, catalogsList] = await Promise.all([
        listPdfs(),
        getAllCatalogs(),
      ]);
      console.log(`[FileManager] Load thành công: ${catalogsList.length} catalogs, ${filesList.length} files`);
      setFiles(filesList);
      setCatalogs(catalogsList);
      
      // Bước 2: Load metadata từ cloud và sync vào local IndexedDB (background, không block UI)
      // Dùng setTimeout để không block render ban đầu
      setTimeout(async () => {
        try {
          console.log('[FileManager] Bắt đầu load metadata từ cloud (background)...');
          const cloudMetadata = await loadMetadataFromCloud();
          if (cloudMetadata && (cloudMetadata.catalogs?.length > 0 || cloudMetadata.files?.length > 0)) {
            console.log('[FileManager] Tìm thấy metadata trên cloud, đang sync...');
            await syncMetadataToLocal(cloudMetadata);
            // Reload sau khi sync
            const [updatedFiles, updatedCatalogs] = await Promise.all([
              listPdfs(),
              getAllCatalogs(),
            ]);
            setFiles(updatedFiles);
            setCatalogs(updatedCatalogs);
            console.log('[FileManager] Metadata đã được sync từ cloud thành công');
          } else {
            console.log('[FileManager] Không có metadata trên cloud hoặc metadata rỗng');
          }
        } catch (syncError) {
          console.error('[FileManager] Lỗi khi sync metadata từ cloud:', syncError);
          // Không hiển thị error để không làm phiền user
        }
      }, 100);
    } catch (error) {
      console.error('[FileManager] Error loading data:', error);
      console.error('[FileManager] Chi tiết:', error.message, error.stack);
      setError(`${t('fileManager.error')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Thêm hàm manual sync để test
  const handleManualSync = async () => {
    try {
      setLoading(true);
      console.log('[FileManager] Manual sync được trigger...');
      const cloudMetadata = await loadMetadataFromCloud();
      if (cloudMetadata) {
        await syncMetadataToLocal(cloudMetadata);
        // Reload data sau khi sync
        const [filesList, catalogsList] = await Promise.all([
          listPdfs(),
          getAllCatalogs(),
        ]);
        setFiles(filesList);
        setCatalogs(catalogsList);
        alert(`Đã sync thành công: ${catalogsList.length} catalogs, ${filesList.length} files`);
      } else {
        alert('Không tìm thấy metadata trên cloud');
      }
    } catch (error) {
      console.error('[FileManager] Manual sync error:', error);
      alert(`Lỗi khi sync: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, file) => {
    setDraggedFile(file);
    setDraggedCatalog(null); // Clear catalog drag when dragging file
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    setDraggedFile(null);
    setDragOverCatalog(null);
  };

  const handleDragOver = (e, catalogId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCatalog(catalogId);
  };

  const handleDragLeave = (e) => {
    // Chỉ set null nếu không vào element con
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverCatalog(null);
    }
  };

  const handleDrop = async (e, catalogId) => {
    e.preventDefault();
    setDragOverCatalog(null);
    if (!draggedFile) return;

    try {
      // Update file catalog trong IndexedDB
      const STORE_NAME = 'pdfs';
      const db = await openDB();

      const catalog = catalogs.find(c => c.id === catalogId);
      const catalogName = catalog ? catalog.name : null;

      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(draggedFile.id);
        getReq.onsuccess = () => {
          const record = getReq.result;
          if (record) {
            record.catalog = catalogName;
            store.put(record);
          }
          resolve();
        };
        getReq.onerror = () => reject(getReq.error);
        tx.oncomplete = () => db.close();
      });

      // Update state
      setFiles(files.map(f => 
        f.id === draggedFile.id ? { ...f, catalog: catalogName } : f
      ));
      setDraggedFile(null);
      setDragOverCatalog(null);
    } catch (error) {
      console.error('Error updating catalog:', error);
      alert('Không thể di chuyển file vào catalog');
    }
  };

  const handleCreateCatalog = async () => {
    const name = prompt(t('fileManager.catalogName'));
    if (!name || !name.trim()) return;

    try {
      const catalog = await createCatalog(name.trim());
      const updatedCatalogs = [...catalogs, catalog];
      setCatalogs(updatedCatalogs);
      
      // Sync metadata lên cloud sau khi tạo catalog (đã được sync trong createCatalog, nhưng sync lại để đảm bảo)
      saveMetadataToCloud(updatedCatalogs, files).catch(() => {}); // Background sync
    } catch (error) {
      console.error('Error creating catalog:', error);
      alert('Không thể tạo catalog: ' + error.message);
    }
  };

  const handleEditCatalog = (catalog) => {
    setEditingCatalog(catalog);
    setEditingCatalogName(catalog.name);
  };

  const handleSaveCatalog = async () => {
    if (!editingCatalog || !editingCatalogName.trim()) return;

    try {
      const oldName = editingCatalog.name;
      const newName = editingCatalogName.trim();

      // Update catalog trong IndexedDB
      await updateCatalog(editingCatalog.id, newName);

      // Update catalog name trong tất cả files
      const db = await openDB();

      await new Promise((resolve, reject) => {
        const fileTx = db.transaction('pdfs', 'readwrite');
        const fileStore = fileTx.objectStore('pdfs');
        fileStore.openCursor().onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            if (cursor.value.catalog === oldName) {
              cursor.value.catalog = newName;
              cursor.update(cursor.value);
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        fileTx.oncomplete = () => {
          db.close();
          resolve();
        };
        fileTx.onerror = () => reject(fileTx.error);
      });

      // Update state
      setCatalogs(catalogs.map(c => 
        c.id === editingCatalog.id ? { ...c, name: newName } : c
      ));
      setFiles(files.map(f => 
        f.catalog === oldName ? { ...f, catalog: newName } : f
      ));
      setEditingCatalog(null);
      setEditingCatalogName('');
    } catch (error) {
      console.error('Error updating catalog:', error);
      alert('Không thể cập nhật catalog: ' + error.message);
    }
  };

  const handleDeleteCatalog = async (catalogId) => {
    if (!window.confirm('Xóa catalog này? Files sẽ được chuyển về "Không có catalog"')) return;

    try {
      const catalog = catalogs.find(c => c.id === catalogId);
      await deleteCatalog(catalogId);

      // Remove catalog từ files
      const db = await openDB();

      await new Promise((resolve, reject) => {
        const tx = db.transaction('pdfs', 'readwrite');
        const store = tx.objectStore('pdfs');
        store.openCursor().onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            if (cursor.value.catalog === catalog.name) {
              cursor.value.catalog = null;
              cursor.update(cursor.value);
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
      });

      const updatedCatalogs = catalogs.filter(c => c.id !== catalogId);
      const updatedFiles = files.map(f => 
        f.catalog === catalog.name ? { ...f, catalog: null } : f
      );
      
      setCatalogs(updatedCatalogs);
      setFiles(updatedFiles);
      
      // Sync metadata lên cloud sau khi xóa catalog
      saveMetadataToCloud(updatedCatalogs, updatedFiles).catch(() => {}); // Background sync
    } catch (error) {
      console.error('Error deleting catalog:', error);
      alert('Không thể xóa catalog: ' + error.message);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm(t('fileManager.deleteFile'))) return;

    try {
      await deletePdf(fileId);
      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      
      // Sync metadata lên cloud sau khi xóa file (đã được sync trong deletePdf, nhưng sync lại để đảm bảo)
      saveMetadataToCloud(catalogs, updatedFiles).catch(() => {}); // Background sync
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Không thể xóa file: ' + error.message);
    }
  };

  const handleCatalogReorder = async (targetIndex) => {
    if (!draggedCatalog) return;

    try {
      const draggedIndex = catalogs.findIndex(c => c.id === draggedCatalog);
      if (draggedIndex === -1 || draggedIndex === targetIndex) return;

      // Create new order array
      const newCatalogs = [...catalogs];
      const [removed] = newCatalogs.splice(draggedIndex, 1);
      newCatalogs.splice(targetIndex, 0, removed);

      // Update order in database
      const catalogIds = newCatalogs.map(c => c.id);
      await updateCatalogOrder(catalogIds);

      // Update state
      setCatalogs(newCatalogs);
      setDraggedCatalog(null);
    } catch (error) {
      console.error('Error reordering catalogs:', error);
      alert('Không thể sắp xếp lại catalog: ' + error.message);
    }
  };

  const handleFileClick = async (file) => {
    try {
      const data = await getPdfData(file.id);
      if (onFileSelect) {
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        onFileSelect({
          file: url,
          fileName: file.name,
          source: 'uploaded',
        });
      }
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Không thể mở file: ' + error.message);
    }
  };

  // Group files by catalog
  const filesByCatalog = files.reduce((acc, file) => {
    const catalog = file.catalog || t('fileManager.noCatalog');
    if (!acc[catalog]) {
      acc[catalog] = [];
    }
    acc[catalog].push(file);
    return acc;
  }, {});

  if (loading) {
    return <div className="file-manager-loading">{t('fileManager.loading')}</div>;
  }

  if (error) {
    return (
      <div className="file-manager-error">
        <div className="error-message">
          <h3>⚠️ {t('msg.error')}</h3>
          <p>{error}</p>
          <button onClick={loadData} className="retry-btn">
            🔄 {t('fileManager.retry')}
          </button>
          <details style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
            <summary>Hướng dẫn xóa IndexedDB</summary>
            <ol style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>Mở DevTools (F12)</li>
              <li>Vào tab "Application"</li>
              <li>Mở "IndexedDB" → "PDFReaderDB"</li>
              <li>Click "Delete database"</li>
              <li>Refresh trang (F5)</li>
            </ol>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="file-manager" key={lang}>
      <div className="file-manager-header">
        <h2>📋 {t('fileManager.title')}</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handleManualSync} 
            className="create-catalog-btn-header"
            style={{ fontSize: '14px', padding: '8px 12px' }}
            title="Sync metadata từ cloud"
          >
            🔄 Sync
          </button>
          <button onClick={handleCreateCatalog} className="create-catalog-btn-header">
            ➕ {t('fileManager.createCatalog')}
          </button>
        </div>
      </div>

      {/* Catalogs */}
      <div className="catalogs-container">
        {catalogs.map((catalog, index) => (
          <div
            key={catalog.id}
            className={`catalog-box ${dragOverCatalog === catalog.id ? 'drag-over' : ''} ${draggedCatalog === catalog.id ? 'dragging' : ''} ${dragOverCatalogPosition === index ? 'drag-over-position' : ''}`}
            draggable
            onDragStart={(e) => {
              setDraggedCatalog(catalog.id);
              setDraggedFile(null); // Clear file drag when dragging catalog
              e.dataTransfer.effectAllowed = 'move';
              e.currentTarget.classList.add('dragging');
            }}
            onDragEnd={(e) => {
              e.currentTarget.classList.remove('dragging');
              setDraggedCatalog(null);
              setDragOverCatalogPosition(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              // Check if dragging file or catalog
              if (draggedFile) {
                // Dragging file into catalog
                setDragOverCatalog(catalog.id);
                setDragOverCatalogPosition(null);
              } else if (draggedCatalog && draggedCatalog !== catalog.id) {
                // Dragging catalog to reorder
                setDragOverCatalogPosition(index);
                setDragOverCatalog(null);
              }
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                if (draggedFile) {
                  setDragOverCatalog(null);
                } else if (draggedCatalog) {
                  setDragOverCatalogPosition(null);
                }
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedFile) {
                // Drop file into catalog
                handleDrop(e, catalog.id);
                setDragOverCatalog(null);
              } else if (draggedCatalog && draggedCatalog !== catalog.id) {
                // Reorder catalog
                handleCatalogReorder(index);
                setDragOverCatalogPosition(null);
              }
              setDraggedCatalog(null);
            }}
          >
            <div className="catalog-header">
              {editingCatalog?.id === catalog.id ? (
                <div className="catalog-edit-form">
                  <input
                    type="text"
                    value={editingCatalogName}
                    onChange={(e) => setEditingCatalogName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveCatalog();
                      }
                    }}
                    className="catalog-edit-input"
                    autoFocus
                  />
                  <button onClick={handleSaveCatalog} className="save-catalog-btn">✓</button>
                  <button onClick={() => {
                    setEditingCatalog(null);
                    setEditingCatalogName('');
                  }} className="cancel-edit-btn">✕</button>
                </div>
              ) : (
                <>
                  <h3 className="catalog-title" style={{ cursor: 'grab', userSelect: 'none' }}>📂 {catalog.name}</h3>
                  <div className="catalog-actions">
                    <button
                      onClick={() => handleEditCatalog(catalog)}
                      className="edit-catalog-btn"
                      title={t('fileManager.edit')}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteCatalog(catalog.id)}
                      className="delete-catalog-btn"
                      title={t('fileManager.delete')}
                    >
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="catalog-files">
              {(filesByCatalog[catalog.name] || []).map((file) => (
                <div
                  key={file.id}
                  className="file-item-draggable"
                  draggable
                  onDragStart={(e) => handleDragStart(e, file)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleFileClick(file)}
                >
                  <span className="file-icon">📄</span>
                  <span className="file-name-drag">{file.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.id);
                    }}
                    className="file-delete-btn"
                    title={t('fileManager.delete')}
                    aria-label={t('fileManager.delete')}
                  >
                    🗑️
                  </button>
                </div>
              ))}
              {(!filesByCatalog[catalog.name] || filesByCatalog[catalog.name].length === 0) && (
                <div className="catalog-empty">
                  {t('fileManager.dragHere')}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Uncategorized files */}
        <div
          className={`catalog-box uncategorized ${dragOverCatalog === null ? 'drag-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            if (draggedFile) {
              handleDragOver(e, null);
            }
            // Don't allow catalog reordering for uncategorized box
          }}
          onDragLeave={handleDragLeave}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedFile) {
              handleDrop(e, null);
            }
          }}
        >
          <div className="catalog-header">
            <h3 className="catalog-title">📂 {t('fileManager.noCatalog')}</h3>
          </div>
          <div className="catalog-files">
            {(filesByCatalog[t('fileManager.noCatalog')] || []).map((file) => (
              <div
                key={file.id}
                className="file-item-draggable"
                draggable
                onDragStart={(e) => handleDragStart(e, file)}
                onClick={() => handleFileClick(file)}
              >
                <span className="file-icon">📄</span>
                <span className="file-name-drag">{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(file.id);
                  }}
                  className="file-delete-btn"
                  title={t('fileManager.delete')}
                  aria-label={t('fileManager.delete')}
                >
                  🗑️
                </button>
              </div>
            ))}
            {(!filesByCatalog[t('fileManager.noCatalog')] || filesByCatalog[t('fileManager.noCatalog')].length === 0) && (
              <div className="catalog-empty">
                {t('fileManager.dragHere')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FileManager;
