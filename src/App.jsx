import { useState, useEffect, useRef } from 'react';
import PDFViewerDirect from './components/PDFViewerDirect';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [fileName, setFileName] = useState('');
  const [showHeader, setShowHeader] = useState(true);
  const headerTimeoutRef = useRef(null);

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

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    console.log('File selected:', selectedFile);

    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        console.log('PDF file type confirmed, size:', selectedFile.size);
        // Tạo object URL để đảm bảo file được xử lý đúng
        const fileUrl = URL.createObjectURL(selectedFile);
        console.log('File URL created:', fileUrl);
        setFile(fileUrl);
        setFileName(selectedFile.name);

        // Load annotations cho file này nếu có
        const fileAnnotations = localStorage.getItem(`pdf-annotations-${selectedFile.name}`);
        if (fileAnnotations) {
          try {
            setAnnotations(JSON.parse(fileAnnotations));
          } catch (e) {
            console.error('Lỗi khi tải ghi chú cho file:', e);
          }
        } else {
          setAnnotations([]);
        }
      } else {
        alert(`File không phải PDF! Loại file: ${selectedFile.type || 'unknown'}`);
      }
    } else {
      alert('Vui lòng chọn file PDF!');
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
        } catch (err) {
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
            <h1>📚 PDF Reader - bà già (baza)</h1>
            <div className="header-actions">
              <label className="file-input-label">
                📁 Chọn PDF
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
              setFile(null);
              setFileName('');
              setAnnotations([]);
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
          <div className="welcome-screen">
            <div className="welcome-content">
              <h2>👋 Chào mừng đến với PDF Reader!</h2>
              <p>Ứng dụng đọc PDF với đầy đủ tính năng ghi chú và điều hướng</p>
              <label className="file-input-label large">
                📁 Chọn file PDF để bắt đầu
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
              <div className="features">
                <h3>✨ Tính năng:</h3>
                <ul>
                  <li>📖 Đọc PDF mượt mà</li>
                  <li>📝 Ghi chú trực tiếp trên PDF</li>
                  <li>🔍 Zoom in/out</li>
                  <li>📑 Điều hướng trang dễ dàng</li>
                  <li>💾 Tự động lưu ghi chú</li>
                  <li>📤 Xuất/Nhập ghi chú</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
