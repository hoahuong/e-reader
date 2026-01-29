import { useState, useEffect, useRef, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import PDFViewerDirect from './components/PDFViewerDirect';
import GoogleDriveViewer from './components/GoogleDriveViewer';
import FileManager from './components/FileManager';
import CatalogSelector from './components/CatalogSelector';
import LanguageSelector from './components/LanguageSelector';
import { savePdf, listPdfs, getPdfData, deletePdf } from './pdfStorage';
import { suggestCatalog } from './catalogManager';
import { loadMetadataFromCloud, syncMetadataToLocal } from './metadataSyncConfig';
import { t, getCurrentLanguage, setCurrentLanguage } from './i18n/locales';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [fileName, setFileName] = useState('');
  const [showHeader, setShowHeader] = useState(true);
  const [uploadedList, setUploadedList] = useState([]); // [{ id, name, catalog }]
  const [listLoading, setListLoading] = useState(true);
  const [currentPdfId, setCurrentPdfId] = useState(null); // id trong DB khi đang đọc từ danh sách
  const [selectedCatalog, setSelectedCatalog] = useState(null); // Catalog được chọn để filter
  const [uploadCatalog, setUploadCatalog] = useState(null); // Catalog khi upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const headerTimeoutRef = useRef(null);
  const fileUrlRef = useRef(null); // để revoke object URL khi đổi file


  // Load danh sách PDF đã upload từ IndexedDB và sync từ cloud
  const refreshUploadedList = useCallback(async () => {
    try {
      setListLoading(true);
      
      // Load từ local trước (hiển thị ngay)
      const list = await listPdfs();
      setUploadedList(list);
      
      // Sync metadata từ cloud sau (background, không block UI)
      setTimeout(async () => {
        try {
          console.log('[App] Bắt đầu sync metadata từ cloud...');
          const cloudMetadata = await loadMetadataFromCloud();
          if (cloudMetadata && (cloudMetadata.catalogs?.length > 0 || cloudMetadata.files?.length > 0)) {
            console.log(`[App] Tìm thấy metadata trên cloud: ${cloudMetadata.catalogs?.length || 0} catalogs, ${cloudMetadata.files?.length || 0} files`);
            await syncMetadataToLocal(cloudMetadata);
            // Reload sau khi sync
            const updatedList = await listPdfs();
            if (updatedList.length !== list.length) {
              setUploadedList(updatedList);
              console.log(`[App] ✅ Metadata đã được sync từ cloud: ${updatedList.length} files`);
            } else {
              console.log('[App] Không có thay đổi sau sync');
            }
          } else {
            console.log('[App] Không có metadata trên cloud hoặc metadata rỗng');
          }
        } catch (syncError) {
          console.error('[App] Lỗi khi sync metadata từ cloud:', syncError);
          console.error('[App] Chi tiết:', syncError.message, syncError.stack);
          // Không hiển thị error để không làm phiền user
        }
      }, 500); // Tăng delay lên 500ms để đảm bảo UI đã render xong
    } catch (e) {
      console.error('Lỗi khi tải danh sách PDF:', e);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUploadedList();
  }, [refreshUploadedList]);

  // Load annotations from localStorage khi component mount
  useEffect(() => {
    const savedAnnotations = localStorage.getItem('pdf-annotations');
    if (savedAnnotations) {
      try {
        setAnnotations(JSON.parse(savedAnnotations));
      } catch (e) {
        console.error('Lỗi khi tải ghi chú:', e);
      }
    }
  }, []);

  // Lưu annotations vào localStorage mỗi khi có thay đổi
  useEffect(() => {
    if (annotations.length > 0 || localStorage.getItem('pdf-annotations')) {
      localStorage.setItem('pdf-annotations', JSON.stringify(annotations));
    }
  }, [annotations]);

  // Auto-hide header khi đọc PDF - giống máy đọc sách
  useEffect(() => {
    if (!file) {
      setShowHeader(true);
      return;
    }

    const handleMouseMove = () => {
      setShowHeader(true);
      clearTimeout(headerTimeoutRef.current);
      headerTimeoutRef.current = setTimeout(() => {
        setShowHeader(false);
      }, 3000);
    };

    const handleMouseLeave = () => {
      setTimeout(() => {
        setShowHeader(false);
      }, 1000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    const appElement = document.querySelector('.app');
    if (appElement) {
      appElement.addEventListener('mouseleave', handleMouseLeave);
    }

    // Hiển thị header ban đầu
    handleMouseMove();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (appElement) {
        appElement.removeEventListener('mouseleave', handleMouseLeave);
      }
      clearTimeout(headerTimeoutRef.current);
    };
  }, [file]);

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      alert('Vui lòng chọn file PDF!');
      return;
    }
    if (selectedFile.type !== 'application/pdf') {
      alert(`File không phải PDF! Loại file: ${selectedFile.type || 'unknown'}`);
      return;
    }

    // Kiểm tra file size và cảnh báo nếu quá lớn
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > 5) {
      const proceed = confirm(
        `File size: ${fileSizeMB.toFixed(2)}MB\n\n` +
        `File lớn có thể gây timeout trên Vercel Hobby plan (10-60s limit).\n` +
        `Khuyến nghị: Upload file < 5MB để đảm bảo thành công.\n\n` +
        `Bạn có muốn tiếp tục không?`
      );
      if (!proceed) {
        event.target.value = '';
        return;
      }
    }

    // Auto-suggest catalog dựa trên tên file
    const suggested = suggestCatalog(selectedFile.name);
    setUploadCatalog(suggested);
    setPendingFile(selectedFile);
    setShowUploadModal(true);
    event.target.value = '';
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;

    setIsUploading(true);
    setUploadError(null);

    // Revoke URL cũ nếu có (tránh rò rỉ bộ nhớ)
    if (fileUrlRef.current) {
      URL.revokeObjectURL(fileUrlRef.current);
      fileUrlRef.current = null;
    }

    try {
      // Lưu vào IndexedDB với catalog
      await savePdf(pendingFile, uploadCatalog);
      await refreshUploadedList();

      // Đóng modal TRƯỚC khi set file để tránh modal che PDF
      setShowUploadModal(false);
      setPendingFile(null);
      setUploadCatalog(null);
      setUploadError(null);

      // Nếu upload thành công, mở file để đọc
      const fileUrl = URL.createObjectURL(pendingFile);
      fileUrlRef.current = fileUrl;
      setCurrentPdfId(null);
      setFile(fileUrl);
      setFileName(pendingFile.name);

      const fileAnnotations = localStorage.getItem(`pdf-annotations-${pendingFile.name}`);
      if (fileAnnotations) {
        try {
          setAnnotations(JSON.parse(fileAnnotations));
        } catch (e) {
          console.error('Lỗi khi tải ghi chú cho file:', e);
          setAnnotations([]);
        }
      } else {
        setAnnotations([]);
      }
    } catch (e) {
      console.error('Lỗi khi lưu PDF:', e);
      const errorMessage = e.message || 'Không thể lưu PDF vào danh sách.';
      setUploadError(errorMessage);
      // Không đóng modal để user có thể thử lại hoặc xem lỗi
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectFromList = async (id, name) => {
    try {
      const data = await getPdfData(id);
      if (fileUrlRef.current) {
        URL.revokeObjectURL(fileUrlRef.current);
        fileUrlRef.current = null;
      }
      setCurrentPdfId(id);
      setFile(data); // ArrayBuffer - viewer hỗ trợ
      setFileName(name);
      const fileAnnotations = localStorage.getItem(`pdf-annotations-${name}`);
      if (fileAnnotations) {
        try {
          setAnnotations(JSON.parse(fileAnnotations));
        } catch {
          setAnnotations([]);
        }
      } else {
        setAnnotations([]);
      }
    } catch (e) {
      console.error('Lỗi khi mở PDF:', e);
      alert('Không thể mở PDF.');
    }
  };

  const handleRemoveFromList = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Xóa PDF này khỏi danh sách?')) return;
    try {
      await deletePdf(id);
      await refreshUploadedList();
      if (currentPdfId === id) {
        setFile(null);
        setFileName('');
        setAnnotations([]);
        setCurrentPdfId(null);
      }
    } catch (e) {
      console.error('Lỗi khi xóa PDF:', e);
      alert('Không thể xóa PDF.');
    }
  };

  const handleGoogleDriveFileSelect = ({ file, fileName }) => {
    // Revoke URL cũ nếu có
    if (fileUrlRef.current) {
      URL.revokeObjectURL(fileUrlRef.current);
      fileUrlRef.current = null;
    }

    fileUrlRef.current = file;
    setCurrentPdfId(null);
    setFile(file);
    setFileName(fileName);

    // Load annotations cho file này nếu có
    const fileAnnotations = localStorage.getItem(`pdf-annotations-${fileName}`);
    if (fileAnnotations) {
      try {
        setAnnotations(JSON.parse(fileAnnotations));
      } catch {
        setAnnotations([]);
      }
    } else {
      setAnnotations([]);
    }
  };

  const handleAnnotationAdd = (annotation) => {
    setAnnotations((prev) => [...prev, annotation]);
    // Lưu theo tên file
    if (fileName) {
      const updated = [...annotations, annotation];
      localStorage.setItem(`pdf-annotations-${fileName}`, JSON.stringify(updated));
    }
  };

  const handleAnnotationUpdate = (updatedAnnotation) => {
    setAnnotations((prev) =>
      prev.map((ann) =>
        ann.id === updatedAnnotation.id ? updatedAnnotation : ann
      )
    );
    // Lưu theo tên file
    if (fileName) {
      const updated = annotations.map((ann) =>
        ann.id === updatedAnnotation.id ? updatedAnnotation : ann
      );
      localStorage.setItem(`pdf-annotations-${fileName}`, JSON.stringify(updated));
    }
  };

  const handleAnnotationDelete = (id) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
    // Lưu theo tên file
    if (fileName) {
      const updated = annotations.filter((ann) => ann.id !== id);
      localStorage.setItem(`pdf-annotations-${fileName}`, JSON.stringify(updated));
    }
  };

  const handleExportAnnotations = () => {
    const dataStr = JSON.stringify(annotations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ghi-chu-${fileName || 'pdf'}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAnnotations = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          setAnnotations(imported);
          if (fileName) {
            localStorage.setItem(`pdf-annotations-${fileName}`, JSON.stringify(imported));
          }
          alert('Đã nhập ghi chú thành công!');
        } catch {
          alert('Lỗi khi đọc file ghi chú!');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="app">
      {!file && (
        <header className="app-header">
          <div className="header-content">
            <h1>📚 {t('app.title')}</h1>
            <div className="header-actions">
              <LanguageSelector />
              <label className="file-input-label">
                📁 {t('header.selectPdf') || 'Chọn PDF'}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </header>
      )}

      {/* Header minimal - Luôn render khi có file để đẩy PDF xuống */}
      {file && (
        <div className={`app-header-minimal ${showHeader ? 'visible' : 'hidden'}`}>
          <button
            onClick={() => {
              if (fileUrlRef.current) {
                URL.revokeObjectURL(fileUrlRef.current);
                fileUrlRef.current = null;
              }
              setFile(null);
              setFileName('');
              setAnnotations([]);
              setCurrentPdfId(null);
            }}
            className="back-btn"
            title="Quay lại"
          >
            ← Quay lại
          </button>
          <span className="file-name-minimal">📄 {fileName}</span>
          <div className="header-actions-minimal">
            <button onClick={handleExportAnnotations} className="export-btn-small">
              💾
            </button>
            <label className="file-input-label-small">
              📥
              <input
                type="file"
                accept=".json"
                onChange={handleImportAnnotations}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>
      )}

      <main className="app-main">
        {file ? (
          <PDFViewerDirect
            file={file}
            annotations={annotations}
            onAnnotationAdd={handleAnnotationAdd}
            onAnnotationUpdate={handleAnnotationUpdate}
            onAnnotationDelete={handleAnnotationDelete}
            fileName={fileName}
            showHeader={showHeader}
          />
        ) : (
          <AppRoutes 
            handleFileChange={handleFileChange}
            handleConfirmUpload={handleConfirmUpload}
            handleGoogleDriveFileSelect={handleGoogleDriveFileSelect}
            showUploadModal={showUploadModal}
            setShowUploadModal={setShowUploadModal}
            pendingFile={pendingFile}
            setPendingFile={setPendingFile}
            uploadCatalog={uploadCatalog}
            setUploadCatalog={setUploadCatalog}
            uploadError={uploadError}
            setUploadError={setUploadError}
            isUploading={isUploading}
            setIsUploading={setIsUploading}
          />
        )}
      </main>
    </div>
  );
}

// Language redirect component
function LanguageRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const savedLang = getCurrentLanguage();
    const path = location.pathname === '/' ? '' : location.pathname.replace(/^\/(en|vi)/, '');
    navigate(`/${savedLang}${path}`, { replace: true });
  }, [navigate, location.pathname]);
  
  return null;
}

// Main routes component with language support
function AppRoutes({
  handleFileChange,
  handleConfirmUpload,
  handleGoogleDriveFileSelect,
  showUploadModal,
  setShowUploadModal,
  pendingFile,
  setPendingFile,
  uploadCatalog,
  setUploadCatalog,
  uploadError,
  setUploadError,
  isUploading,
  setIsUploading,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [lang, setLang] = useState(() => {
    const match = location.pathname.match(/^\/(en|vi)(\/|$)/);
    return match ? match[1] : 'vi';
  });

  // Extract language from URL and sync
  useEffect(() => {
    const match = location.pathname.match(/^\/(en|vi)(\/|$)/);
    const newLang = match ? match[1] : 'vi';
    if (newLang !== lang) {
      setLang(newLang);
      setCurrentLanguage(newLang);
      // Trigger language change event for all components
      window.dispatchEvent(new Event('languagechange'));
    }
  }, [location.pathname, lang]);

  const navigateWithLang = (path) => {
    const cleanPath = path.replace(/^\/(en|vi)/, '');
    navigate(`/${lang}${cleanPath}`);
  };

  return (
    <Routes>
      {/* Language routes */}
      <Route path="/:lang/*" element={
        <LanguageRoutes
          lang={lang}
          navigateWithLang={navigateWithLang}
          handleFileChange={handleFileChange}
          handleConfirmUpload={handleConfirmUpload}
          handleGoogleDriveFileSelect={handleGoogleDriveFileSelect}
          showUploadModal={showUploadModal}
          setShowUploadModal={setShowUploadModal}
          pendingFile={pendingFile}
          setPendingFile={setPendingFile}
          uploadCatalog={uploadCatalog}
          setUploadCatalog={setUploadCatalog}
          uploadError={uploadError}
          setUploadError={setUploadError}
          isUploading={isUploading}
          setIsUploading={setIsUploading}
        />
      } />
      {/* Default redirect to /vi */}
      <Route path="*" element={<LanguageRedirect />} />
    </Routes>
  );
}

// Routes with language prefix
function LanguageRoutes({
  lang,
  navigateWithLang,
  handleFileChange,
  handleConfirmUpload,
  handleGoogleDriveFileSelect,
  showUploadModal,
  setShowUploadModal,
  pendingFile,
  setPendingFile,
  uploadCatalog,
  setUploadCatalog,
  uploadError,
  setUploadError,
  isUploading,
  setIsUploading,
}) {
  return (
    <Routes>
      {/* Home Route */}
      <Route 
        path="/" 
        element={
                <div className="welcome-screen">
                  <div className="welcome-content">
                    <h2>👋 {t('app.welcome')}</h2>
                    <p>{t('app.description')}</p>
                    
                    <div className="main-actions">
                      <label className="file-input-label large">
                        📁 {t('app.upload')}
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                      </label>

                      <button
                        onClick={() => navigateWithLang('/drive')}
                        className="view-nav-btn drive-btn"
                      >
                        ☁️ {t('app.googleDrive')}
                        <span className="btn-description">{t('app.feature.drive')}</span>
                      </button>

                      <button
                        onClick={() => navigateWithLang('/uploaded-list')}
                        className="view-nav-btn manage-btn"
                      >
                        📋 {t('app.manageFiles')}
                        <span className="btn-description">{t('app.feature.manage')}</span>
                      </button>
                    </div>

                    {/* Upload Modal với Catalog Selector */}
                    {showUploadModal && pendingFile && (
                      <div 
                        className="upload-modal-overlay" 
                        onClick={(e) => {
                          // Chỉ đóng khi click vào overlay, không phải modal content
                          if (e.target === e.currentTarget && !isUploading) {
                            setShowUploadModal(false);
                            setPendingFile(null);
                            setUploadCatalog(null);
                            setUploadError(null);
                            setIsUploading(false);
                          }
                        }}
                      >
                        <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
                          <h3>📤 Upload PDF</h3>
                          <div className="upload-modal-content">
                            <p><strong>File:</strong> {pendingFile.name}</p>
                            <CatalogSelector
                              fileName={pendingFile.name}
                              selectedCatalog={uploadCatalog}
                              onCatalogChange={setUploadCatalog}
                            />
                            {uploadError && (
                              <div className="upload-error-message">
                                ⚠️ <strong>Lỗi:</strong> {uploadError}
                                <br />
                                <small>Vui lòng thử lại hoặc kiểm tra kết nối mạng.</small>
                              </div>
                            )}
                          </div>
                          <div className="upload-modal-actions">
                            <button 
                              onClick={handleConfirmUpload} 
                              className="confirm-upload-btn"
                              disabled={isUploading}
                            >
                              {isUploading ? '⏳ Đang upload...' : '✅ Upload'}
                            </button>
                            <button 
                              onClick={() => {
                                if (!isUploading) {
                                  setShowUploadModal(false);
                                  setPendingFile(null);
                                  setUploadCatalog(null);
                                  setUploadError(null);
                                  setIsUploading(false);
                                }
                              }} 
                              className="cancel-upload-btn"
                              disabled={isUploading}
                            >
                              ❌ Hủy
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="features">
                      <h3>✨ {t('app.features')}:</h3>
                      <ul>
                        <li>📤 {t('app.feature.upload')}</li>
                        <li>📋 {t('app.feature.manage')}</li>
                        <li>☁️ {t('app.feature.drive')}</li>
                        <li>📖 {t('app.feature.read')}</li>
                        <li>📝 {t('app.feature.annotate')}</li>
                        <li>🔍 {t('app.feature.zoom')}</li>
                        <li>📑 {t('app.feature.navigate')}</li>
                        <li>💾 {t('app.feature.save')}</li>
                        <li>📥 {t('app.feature.export')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              } 
            />

            {/* Google Drive Route */}
            <Route 
              path="/drive" 
              element={
                <div className="drive-view-container" key={lang}>
                  <div className="view-header">
                    <button 
                      onClick={() => navigateWithLang('/')} 
                      className="back-to-home-btn"
                    >
                      {t('app.backToHome')}
                    </button>
                    <h2>☁️ {t('app.googleDrive')}</h2>
                  </div>
                  <GoogleDriveViewer onFileSelect={handleGoogleDriveFileSelect} />
                </div>
              } 
            />

            {/* File Manager Route */}
            <Route 
              path="/uploaded-list" 
              element={
                <div className="manage-view-container" key={lang}>
                  <div className="view-header">
                    <button 
                      onClick={() => navigateWithLang('/')} 
                      className="back-to-home-btn"
                    >
                      {t('app.backToHome')}
                    </button>
                    <h2>📋 {t('fileManager.title')}</h2>
                  </div>
                  <FileManager onFileSelect={handleGoogleDriveFileSelect} />
                </div>
              } 
            />
          </Routes>
  );
}

export default App;
