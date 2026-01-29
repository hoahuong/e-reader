import { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './PDFViewer.css';
// Import worker config
import '../pdfWorkerConfig';

function PDFViewer({ file, annotations, onAnnotationAdd, onAnnotationUpdate, onAnnotationDelete, fileName }) {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(() => {
    // Tự động điều chỉnh scale trên mobile để fit màn hình
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      // Tính toán scale dựa trên chiều rộng màn hình
      const screenWidth = window.innerWidth;
      // Giả sử PDF width mặc định ~800px, scale để fit vào màn hình trừ padding
      // Đảm bảo scale đủ lớn để không bị co, nhưng không quá lớn
      const calculatedScale = (screenWidth - 40) / 800; // Trừ padding và margin
      return Math.max(Math.min(calculatedScale, 1.0), 0.85); // Min 0.85, Max 1.0
    }
    return 1.2;
  });
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [annotationText, setAnnotationText] = useState('');
  const [annotationPosition, setAnnotationPosition] = useState(null);
  const [readingMode, setReadingMode] = useState('sepia'); // day, sepia, night
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [bookmarks, setBookmarks] = useState([]);
  const [loadError, setLoadError] = useState(null);
  // Sidebar mặc định collapsed trên mobile
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    typeof window !== 'undefined' && window.innerWidth <= 768
  );
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const [textSelectionMenu, setTextSelectionMenu] = useState(null);
  const [highlightColor, setHighlightColor] = useState('#ffeb3b'); // Màu highlight mặc định
  const [displayPageNumber, setDisplayPageNumber] = useState(1); // Trang đang hiển thị - khởi tạo = 1
  const [isRendering, setIsRendering] = useState(false);
  const [preloadedPageNumber, setPreloadedPageNumber] = useState(null); // Trang đã được preload
  const pageRef = useRef(null);
  const preloadedPageRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);

  // Hàm tạo âm thanh lật trang sách
  const playPageFlipSound = useCallback(async (direction) => {
    try {
      // Tạo AudioContext nếu chưa có
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;

      // Resume audio context nếu bị suspended (quan trọng cho mobile)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Tạo âm thanh lật trang với nhiều tần số để giống tiếng giấy
      const duration = 0.15; // 150ms
      const sampleRate = audioContext.sampleRate;
      const numSamples = duration * sampleRate;
      const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
      const data = buffer.getChannelData(0);

      // Tạo âm thanh giống tiếng giấy lật (white noise với envelope)
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // White noise
        const noise = (Math.random() * 2 - 1) * 0.3;
        // Envelope: nhanh lên, chậm xuống
        const envelope = Math.exp(-t * 8) * (1 - Math.exp(-t * 50));
        // Thêm một chút tần số thấp để giống tiếng giấy
        const lowFreq = Math.sin(2 * Math.PI * 80 * t) * 0.1;
        data[i] = (noise + lowFreq) * envelope;
      }

      // Tạo source và phát
      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      
      // Điều chỉnh volume
      gainNode.gain.value = 0.4; // Tăng volume một chút
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Phát âm thanh
      source.start(0);
      
      // Cleanup
      source.onended = () => {
        source.disconnect();
        gainNode.disconnect();
      };
    } catch (error) {
      console.log('Không thể phát âm thanh:', error);
      // Nếu không thể phát âm thanh, không làm gì (fail silently)
    }
  }, []);

  // Load bookmarks và vị trí đọc từ localStorage
  useEffect(() => {
    if (fileName) {
      const savedBookmarks = localStorage.getItem(`bookmarks-${fileName}`);
      if (savedBookmarks) {
        try {
          setBookmarks(JSON.parse(savedBookmarks));
        } catch (e) {
          console.error('Lỗi khi tải bookmark:', e);
        }
      }

      const savedPage = localStorage.getItem(`last-page-${fileName}`);
      if (savedPage) {
        const page = parseInt(savedPage, 10);
        setPageNumber(page);
        setDisplayPageNumber(page); // Đảm bảo displayPageNumber = pageNumber ngay từ đầu
      } else {
        // Nếu không có saved page, đảm bảo displayPageNumber = pageNumber (1)
        setDisplayPageNumber(1);
      }
    }
  }, [fileName]);

  // Lưu vị trí đọc
  useEffect(() => {
    if (fileName && pageNumber) {
      localStorage.setItem(`last-page-${fileName}`, pageNumber.toString());
    }
  }, [pageNumber, fileName]);

  // Lưu bookmarks
  useEffect(() => {
    if (fileName && bookmarks.length >= 0) {
      localStorage.setItem(`bookmarks-${fileName}`, JSON.stringify(bookmarks));
    }
  }, [bookmarks, fileName]);

  // Định nghĩa các functions trước khi sử dụng trong useEffect
  const goToPrevPage = useCallback(() => {
    if (displayPageNumber <= 1) return;
    if (isRendering) return; // Đợi render xong
    const newPage = Math.max(1, displayPageNumber - 1);
    // Phát âm thanh lật trang
    playPageFlipSound('prev');
    // Nếu trang mới đã được preload, hiển thị ngay lập tức
    if (preloadedPageNumber === newPage) {
      setDisplayPageNumber(newPage);
      setPageNumber(newPage);
      setIsRendering(false);
    } else {
      // Nếu chưa preload, render như bình thường
      setIsRendering(true);
      setPageNumber(newPage);
      // displayPageNumber sẽ được update trong onRenderSuccess khi canvas đã vẽ xong
    }
  }, [displayPageNumber, playPageFlipSound, isRendering, preloadedPageNumber]);

  const goToNextPage = useCallback(() => {
    if (displayPageNumber >= numPages) return;
    if (isRendering) return; // Đợi render xong
    const newPage = Math.min(numPages, displayPageNumber + 1);
    // Phát âm thanh lật trang
    playPageFlipSound('next');
    // Nếu trang mới đã được preload, hiển thị ngay lập tức
    if (preloadedPageNumber === newPage) {
      setDisplayPageNumber(newPage);
      setPageNumber(newPage);
      setIsRendering(false);
    } else {
      // Nếu chưa preload, render như bình thường
      setIsRendering(true);
      setPageNumber(newPage);
      // displayPageNumber sẽ được update trong onRenderSuccess khi canvas đã vẽ xong
    }
  }, [displayPageNumber, numPages, playPageFlipSound, isRendering, preloadedPageNumber]);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    }
    setIsFullscreen(false);
    setShowControls(true);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current?.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current?.mozRequestFullScreen) {
        containerRef.current.mozRequestFullScreen();
      }
      setIsFullscreen(true);
    } else {
      exitFullscreen();
    }
  }, [isFullscreen, exitFullscreen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Cho phép nhập trong textarea/input
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          e.stopPropagation();
          goToPrevPage();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          e.stopPropagation();
          goToNextPage();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          setShowControls((prev) => !prev);
          break;
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          }
          break;
      }
    };

    // Thêm listener với capture để bắt sớm hơn
    document.addEventListener('keydown', handleKeyPress, true);
    return () => document.removeEventListener('keydown', handleKeyPress, true);
  }, [goToPrevPage, goToNextPage, toggleFullscreen, exitFullscreen, isFullscreen]);

  // Wheel/Trackpad navigation - với debounce để tránh lật nhiều trang
  const wheelTimeoutRef = useRef(null);
  const wheelDeltaRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleWheel = (e) => {
      // Chỉ xử lý khi không scroll trong textarea/input hoặc sidebar
      if (e.target.tagName === 'TEXTAREA' || 
          e.target.tagName === 'INPUT' ||
          e.target.closest('.annotations-sidebar')) {
        return;
      }
      
      // Tích lũy delta để phát hiện gesture
      wheelDeltaRef.current.x += e.deltaX;
      wheelDeltaRef.current.y += e.deltaY;
      
      // Clear timeout cũ
      if (wheelTimeoutRef.current) {
        clearTimeout(wheelTimeoutRef.current);
      }
      
      // Đợi một chút để tích lũy gesture
      wheelTimeoutRef.current = setTimeout(() => {
        const { x, y } = wheelDeltaRef.current;
        const absX = Math.abs(x);
        const absY = Math.abs(y);
        
        // Kiểm tra nếu là gesture ngang (trackpad swipe trái/phải)
        if (absX > absY && absX > 50) {
          e.preventDefault();
          e.stopPropagation();
          
          if (x < -50) {
            // Swipe trái = next page
            goToNextPage();
          } else if (x > 50) {
            // Swipe phải = prev page
            goToPrevPage();
          }
        }
        
        // Reset delta
        wheelDeltaRef.current = { x: 0, y: 0 };
      }, 100); // Đợi 100ms để tích lũy gesture
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
        if (wheelTimeoutRef.current) {
          clearTimeout(wheelTimeoutRef.current);
        }
      };
    }
  }, [goToPrevPage, goToNextPage]);

  // Auto-hide controls
  useEffect(() => {
    if (isFullscreen) {
      const handleMouseMove = () => {
        setShowControls(true);
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      };

      window.addEventListener('mousemove', handleMouseMove);
      handleMouseMove(); // Show initially

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(controlsTimeoutRef.current);
      };
    }
  }, [isFullscreen]);

  function onDocumentLoadSuccess({ numPages }) {
    console.log('PDF loaded successfully, pages:', numPages);
    setNumPages(numPages);
    setLoadError(null);
    // QUAN TRỌNG: Đảm bảo displayPageNumber = pageNumber ngay từ đầu để trang đầu tiên hiển thị
    if (displayPageNumber !== pageNumber) {
      setDisplayPageNumber(pageNumber);
    }
    // Preload trang tiếp theo nếu có
    if (pageNumber < numPages) {
      setPreloadedPageNumber(pageNumber + 1);
    }
  }
  
  // Preload trang tiếp theo khi displayPageNumber thay đổi
  useEffect(() => {
    if (numPages && displayPageNumber > 0 && displayPageNumber < numPages) {
      // Preload trang tiếp theo
      const nextPage = displayPageNumber + 1;
      if (preloadedPageNumber !== nextPage) {
        setPreloadedPageNumber(nextPage);
      }
    }
    // Preload trang trước nếu có
    if (numPages && displayPageNumber > 1) {
      const prevPage = displayPageNumber - 1;
      // Có thể preload trang trước nếu cần
    }
  }, [displayPageNumber, numPages, preloadedPageNumber]);

  function onDocumentLoadError(error) {
    console.error('PDF Load Error:', error);
    let errorMessage = 'Không thể tải file PDF. ';
    
    if (error.message) {
      errorMessage += `Chi tiết: ${error.message}`;
    } else if (error.name) {
      errorMessage += `Lỗi: ${error.name}`;
    } else {
      errorMessage += 'Vui lòng kiểm tra lại file hoặc thử file khác.';
    }
    
    setLoadError(errorMessage);
  }

  // Text selection handler
  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      const selectedTextContent = selection.toString().trim();

      if (selectedTextContent && selectedTextContent.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const pageElement = pageRef.current?.closest('.pdf-page');
        
        // Kiểm tra xem selection có trong PDF page không
        if (pageElement && pageElement.contains(range.commonAncestorContainer)) {
          const pageRect = pageElement.getBoundingClientRect();
          
          // Tính toán vị trí relative đến page
          const relativeLeft = rect.left - pageRect.left;
          const relativeTop = rect.top - pageRect.top;
          
          setSelectedText({
            text: selectedTextContent,
            x: (relativeLeft + rect.width / 2) / pageRect.width * 100,
            y: relativeTop / pageRect.height * 100,
            page: pageNumber,
            rect: {
              left: relativeLeft,
              top: relativeTop,
              width: rect.width,
              height: rect.height,
            },
            pageRect: {
              width: pageRect.width,
              height: pageRect.height,
            },
          });

          setTextSelectionMenu({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
        }
      } else {
        // Không có text được chọn hoặc chọn ngoài PDF
        if (!selection.toString().trim()) {
          setTextSelectionMenu(null);
          setSelectedText(null);
        }
      }
    };

    const handleClickOutside = (e) => {
      if (!e.target.closest('.text-selection-menu') && 
          !e.target.closest('.react-pdf__Page__textContent') &&
          !e.target.closest('.react-pdf__Page__textContent span')) {
        setTextSelectionMenu(null);
        setSelectedText(null);
        const selection = window.getSelection();
        if (selection.toString().trim() === '') {
          selection.removeAllRanges();
        }
      }
    };

    // Delay một chút để đảm bảo selection đã hoàn tất
    const handleSelection = () => {
      setTimeout(handleTextSelection, 10);
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);
    document.addEventListener('click', handleClickOutside, true);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [pageNumber]);

  // Swipe gesture handlers - cải thiện cho mobile
  const minSwipeDistance = 50;
  const maxVerticalSwipe = 100; // Cho phép swipe ngang ngay cả khi có scroll dọc một chút

  const onTouchStart = (e) => {
    // Chỉ xử lý swipe nếu không phải đang chọn text hoặc click vào button
    if (e.target.closest('button') || 
        e.target.closest('.text-selection-menu') ||
        e.target.closest('.annotation-form') ||
        e.target.closest('.annotations-sidebar')) {
      return;
    }

    const touch = e.touches[0];
    setTouchEnd(null);
    setTouchStart(touch.clientX);
    setTouchStartY(touch.clientY);
    setIsSwiping(false);
  };

  const onTouchMove = (e) => {
    if (!touchStart) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStart;
    const deltaY = Math.abs(touch.clientY - touchStartY);

    // Nếu swipe ngang nhiều hơn dọc, đây là swipe gesture
    // Cho phép swipe ngang ngay cả khi có một chút scroll dọc
    if (Math.abs(deltaX) > 20 && Math.abs(deltaX) > deltaY * 1.5) {
      setIsSwiping(true);
      setTouchEnd(touch.clientX);
      // Prevent default scroll khi đang swipe ngang
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const onTouchEnd = (e) => {
    if (!touchStart) return;

    // Nếu đang chọn text, không xử lý swipe
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setTouchStart(null);
      setTouchEnd(null);
      setTouchStartY(null);
      setIsSwiping(false);
      return;
    }

    // Tính toán distance từ touchStart và touchEnd
    const finalTouch = e.changedTouches ? e.changedTouches[0] : null;
    if (finalTouch && isSwiping) {
      const distance = touchStart - finalTouch.clientX;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      if (isLeftSwipe) {
        e.preventDefault();
        e.stopPropagation();
        goToNextPage();
      } else if (isRightSwipe) {
        e.preventDefault();
        e.stopPropagation();
        goToPrevPage();
      }
    } else if (finalTouch && touchEnd !== null) {
      // Fallback: sử dụng touchEnd nếu có
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      if (isLeftSwipe) {
        e.preventDefault();
        e.stopPropagation();
        goToNextPage();
      } else if (isRightSwipe) {
        e.preventDefault();
        e.stopPropagation();
        goToPrevPage();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
    setTouchStartY(null);
    setIsSwiping(false);
  };

  // Highlight selected text
  const handleHighlight = () => {
    if (!selectedText) return;

    const newAnnotation = {
      id: Date.now(),
      type: 'highlight',
      page: selectedText.page,
      x: selectedText.x,
      y: selectedText.y,
      text: selectedText.text,
      color: highlightColor,
      rect: selectedText.rect,
      pageRect: selectedText.pageRect,
      createdAt: new Date().toISOString(),
    };

    onAnnotationAdd(newAnnotation);
    setSelectedText(null);
    setTextSelectionMenu(null);
    window.getSelection().removeAllRanges();
  };

  // Comment on selected text
  const handleComment = () => {
    if (!selectedText) return;

    setAnnotationPosition({
      x: selectedText.x,
      y: selectedText.y,
      page: selectedText.page,
    });
    setAnnotationText(`"${selectedText.text}"\n\n`);
    setSelectedText(null);
    setTextSelectionMenu(null);
    setIsAnnotationMode(true);
    window.getSelection().removeAllRanges();
  };

  const handlePageClick = (event) => {
    if (isAnnotationMode) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      setAnnotationPosition({ x, y, page: pageNumber });
      setAnnotationText('');
      setSelectedAnnotation(null);
      return;
    }

    // Click để lật trang
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const width = rect.width;

    if (clickX < width / 3) {
      goToPrevPage();
    } else if (clickX > (width * 2) / 3) {
      goToNextPage();
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2.5));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.8));
  };

  const toggleBookmark = () => {
    const isBookmarked = bookmarks.includes(pageNumber);
    if (isBookmarked) {
      setBookmarks(bookmarks.filter((p) => p !== pageNumber));
    } else {
      setBookmarks([...bookmarks, pageNumber].sort((a, b) => a - b));
    }
  };

  const goToBookmark = (page) => {
    setPageNumber(page);
  };

  const handleSaveAnnotation = () => {
    if (!annotationPosition || !annotationText.trim()) return;

    const newAnnotation = {
      id: Date.now(),
      page: annotationPosition.page,
      x: annotationPosition.x,
      y: annotationPosition.y,
      text: annotationText,
      createdAt: new Date().toISOString(),
    };

    onAnnotationAdd(newAnnotation);
    setAnnotationPosition(null);
    setAnnotationText('');
    setIsAnnotationMode(false);
  };

  const handleDeleteAnnotation = (id) => {
    onAnnotationDelete(id);
  };

  const handleEditAnnotation = (annotation) => {
    setSelectedAnnotation(annotation);
    setAnnotationText(annotation.text);
    setAnnotationPosition({ x: annotation.x, y: annotation.y, page: annotation.page });
    setPageNumber(annotation.page);
  };

  const handleUpdateAnnotation = () => {
    if (!selectedAnnotation || !annotationText.trim()) return;

    onAnnotationUpdate({
      ...selectedAnnotation,
      text: annotationText,
      updatedAt: new Date().toISOString(),
    });

    setSelectedAnnotation(null);
    setAnnotationText('');
    setAnnotationPosition(null);
  };

  const currentPageAnnotations = annotations.filter((ann) => ann.page === pageNumber);
  const progress = numPages ? ((pageNumber / numPages) * 100).toFixed(1) : 0;
  const isBookmarked = bookmarks.includes(pageNumber);

  return (
    <div
      ref={containerRef}
      className={`pdf-viewer-container ereader-mode ${readingMode} ${isFullscreen ? 'fullscreen' : ''} ${showControls ? 'show-controls' : 'hide-controls'}`}
    >
      {/* Top Controls */}
      <div className={`ereader-controls top-controls ${showControls ? 'visible' : 'hidden'}`}>
        <div className="controls-left">
          <button onClick={() => setShowControls(!showControls)} className="icon-btn" title="Ẩn/Hiện điều khiển">
            ☰
          </button>
          <span className="page-info">
            {pageNumber} / {numPages || '...'}
          </span>
        </div>

        <div className="controls-center">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="controls-right">
          <span className="progress-info">{progress}%</span>
          <div className="reading-mode-selector">
            <button
              className={readingMode === 'day' ? 'active' : ''}
              onClick={() => setReadingMode('day')}
              title="Chế độ sáng"
            >
              ☀️
            </button>
            <button
              className={readingMode === 'sepia' ? 'active' : ''}
              onClick={() => setReadingMode('sepia')}
              title="Chế độ sepia"
            >
              📖
            </button>
            <button
              className={readingMode === 'night' ? 'active' : ''}
              onClick={() => setReadingMode('night')}
              title="Chế độ tối"
            >
              🌙
            </button>
          </div>
          <button
            className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={toggleBookmark}
            title={isBookmarked ? 'Bỏ bookmark' : 'Đánh dấu trang'}
          >
            {isBookmarked ? '🔖' : '📑'}
          </button>
          <button onClick={toggleFullscreen} className="icon-btn" title="Toàn màn hình (F)">
            {isFullscreen ? '⤓' : '⤢'}
          </button>
        </div>
      </div>

      {/* Main Content Wrapper - Flexbox container cho PDF và Sidebar */}
      <div className="pdf-content-wrapper">
        {/* Main Content */}
        <div 
          className="pdf-content ereader-content" 
          onClick={handlePageClick}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="pdf-document-wrapper">
            {loadError && (
              <div className="error-message">
                <div className="error-icon">⚠️</div>
                <div className="error-text">{loadError}</div>
                <button onClick={() => setLoadError(null)} className="error-retry-btn">
                  Thử lại
                </button>
              </div>
            )}
            <Document 
              file={file} 
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <div className="loading-text">Đang tải PDF...</div>
                  <div className="loading-subtext">Vui lòng đợi trong giây lát</div>
                </div>
              }
              error={
                <div className="error-message">
                  <div className="error-icon">⚠️</div>
                  <div className="error-text">Không thể tải file PDF</div>
                </div>
              }
            >
              {/* Preload trang tiếp theo (nếu có) - render ở background, không hiển thị */}
              {preloadedPageNumber && preloadedPageNumber !== displayPageNumber && preloadedPageNumber !== pageNumber && (
                <div 
                  className="page-container page-preload" 
                  ref={preloadedPageRef}
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 0,
                    display: 'none',
                    visibility: 'hidden'
                  }}
                >
                  <Page
                    pageNumber={preloadedPageNumber}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="pdf-page ereader-page"
                    loading={null}
                  />
                </div>
              )}
              
              {/* QUAN TRỌNG: Luôn render cả trang cũ và trang mới để tránh nhấp nháy */}
              {/* Trang cũ - LUÔN hiển thị khi displayPageNumber !== pageNumber */}
              {displayPageNumber !== null && displayPageNumber !== pageNumber && (
                <div 
                  className="page-container page-old" 
                  style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1,
                    display: 'block',
                    visibility: 'visible',
                    opacity: 1
                  }}
                >
                  <Page
                    pageNumber={displayPageNumber}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    className="pdf-page ereader-page"
                    loading={null}
                  />
                </div>
              )}
              
              {/* Trang mới - render ở background, chỉ hiển thị khi đã sẵn sàng */}
              <div 
                className="page-container page-new" 
                ref={pageRef}
                style={{ 
                  position: displayPageNumber !== pageNumber ? 'absolute' : 'relative',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: displayPageNumber !== pageNumber ? 2 : 1,
                  // QUAN TRỌNG: Trang mới chỉ hiển thị khi displayPageNumber === pageNumber
                  // Khi đang render, dùng visibility: hidden để canvas vẫn được paint nhưng không hiển thị
                  display: displayPageNumber === pageNumber ? 'block' : 'none',
                  visibility: displayPageNumber === pageNumber ? 'visible' : 'hidden'
                }}
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="pdf-page ereader-page"
                  loading={null}
                  onRenderSuccess={() => {
                    // QUAN TRỌNG: Đợi canvas thực sự được paint hoàn toàn trước khi hiển thị
                    // Đợi một khoảng thời gian đủ dài để đảm bảo canvas đã được paint hoàn toàn
                    // Sử dụng nhiều requestAnimationFrame và setTimeout để đảm bảo
                    let frameCount = 0;
                    const maxFrames = 8; // Đợi nhiều frame hơn
                    
                    const waitForPaint = () => {
                      frameCount++;
                      requestAnimationFrame(() => {
                        if (frameCount < maxFrames) {
                          waitForPaint();
                        } else {
                          // Sau khi đợi đủ frame, kiểm tra canvas
                          setTimeout(() => {
                            const canvas = pageRef.current?.querySelector('canvas');
                            if (canvas && canvas.width > 0 && canvas.height > 0) {
                              // Kiểm tra canvas có nội dung không
                              const ctx = canvas.getContext('2d', { willReadFrequently: true });
                              if (ctx) {
                                try {
                                  // Check một vùng lớn hơn ở giữa canvas
                                  const checkWidth = Math.min(canvas.width, 300);
                                  const checkHeight = Math.min(canvas.height, 300);
                                  const startX = Math.floor((canvas.width - checkWidth) / 2);
                                  const startY = Math.floor((canvas.height - checkHeight) / 2);
                                  const imageData = ctx.getImageData(startX, startY, checkWidth, checkHeight);
                                  
                                  // Kiểm tra xem có pixel nào không phải màu trắng hoàn toàn không
                                  let hasContent = false;
                                  let nonWhitePixels = 0;
                                  for (let i = 0; i < imageData.data.length; i += 4) {
                                    const r = imageData.data[i];
                                    const g = imageData.data[i + 1];
                                    const b = imageData.data[i + 2];
                                    const a = imageData.data[i + 3];
                                    // Nếu không phải trắng hoàn toàn (255,255,255) và có alpha > 10
                                    if (!(r === 255 && g === 255 && b === 255) && a > 10) {
                                      nonWhitePixels++;
                                      if (nonWhitePixels > 100) { // Cần ít nhất 100 pixel không phải trắng
                                        hasContent = true;
                                        break;
                                      }
                                    }
                                  }
                                  
                                  if (hasContent) {
                                    // Canvas đã có nội dung đầy đủ, đợi thêm một chút để đảm bảo hoàn toàn
                                    setTimeout(() => {
                                      setDisplayPageNumber(pageNumber);
                                      setIsRendering(false);
                                      // Preload trang tiếp theo sau khi đã hiển thị trang mới
                                      if (pageNumber < numPages) {
                                        setPreloadedPageNumber(pageNumber + 1);
                                      }
                                    }, 400);
                                    return;
                                  }
                                } catch (e) {
                                  // Nếu không thể get imageData, vẫn tiếp tục
                                }
                              }
                            }
                            // Fallback: đợi lâu hơn rồi hiển thị
                            setTimeout(() => {
                              setDisplayPageNumber(pageNumber);
                              setIsRendering(false);
                              // Preload trang tiếp theo sau khi đã hiển thị trang mới
                              if (pageNumber < numPages) {
                                setPreloadedPageNumber(pageNumber + 1);
                              }
                            }, 800);
                          }, 300);
                        }
                      });
                    };
                    
                    // Bắt đầu đợi
                    waitForPaint();
                  }}
                />
              </div>

              {/* Hiển thị highlight trên trang - hiển thị cho cả 3 trường hợp */}
              {currentPageAnnotations
                .filter((ann) => ann.type === 'highlight')
                .map((annotation) => {
                  if (!annotation.rect || !annotation.pageRect) return null;
                  
                  // Tính toán lại vị trí dựa trên scale hiện tại
                  const scaleFactor = scale / 1.2; // 1.2 là scale mặc định
                  const left = (annotation.rect.left / annotation.pageRect.width) * 100;
                  const top = (annotation.rect.top / annotation.pageRect.height) * 100;
                  const width = (annotation.rect.width / annotation.pageRect.width) * 100;
                  const height = (annotation.rect.height / annotation.pageRect.height) * 100;
                  
                  return (
                    <div
                      key={annotation.id}
                      className="text-highlight"
                      style={{
                        position: 'absolute',
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                        backgroundColor: annotation.color || '#ffeb3b',
                        opacity: 0.4,
                        pointerEvents: 'auto',
                        zIndex: 1,
                        cursor: 'pointer',
                      }}
                      title={annotation.text}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Có thể thêm action khi click vào highlight
                      }}
                    />
                  );
                })}

              {/* Hiển thị ghi chú trên trang */}
              {currentPageAnnotations
                .filter((ann) => ann.type !== 'highlight')
                .map((annotation) => (
                  <div
                    key={annotation.id}
                    className="annotation-marker"
                    style={{
                      left: `${annotation.x}%`,
                      top: `${annotation.y}%`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditAnnotation(annotation);
                    }}
                  >
                    <div className="annotation-icon">📌</div>
                    <div className="annotation-popup">
                      <div className="annotation-text">{annotation.text}</div>
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAnnotation(annotation.id);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                {/* Form thêm/sửa ghi chú */}
                {annotationPosition && annotationPosition.page === pageNumber && (
                  <div
                    className="annotation-form"
                    style={{
                      left: `${annotationPosition.x}%`,
                      top: `${annotationPosition.y}%`,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <textarea
                      value={annotationText}
                      onChange={(e) => setAnnotationText(e.target.value)}
                      placeholder="Nhập ghi chú của bạn..."
                      autoFocus
                    />
                    <div className="annotation-form-buttons">
                      <button onClick={selectedAnnotation ? handleUpdateAnnotation : handleSaveAnnotation}>
                        {selectedAnnotation ? 'Cập nhật' : 'Lưu'}
                      </button>
                      <button
                        onClick={() => {
                          setAnnotationPosition(null);
                          setAnnotationText('');
                          setSelectedAnnotation(null);
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
              )}

              {/* Text Selection Menu */}
              {textSelectionMenu && selectedText && (
                <div
                  className="text-selection-menu"
                  style={{
                    position: 'fixed',
                    left: `${textSelectionMenu.x}px`,
                    top: `${textSelectionMenu.y}px`,
                    transform: 'translate(-50%, -100%)',
                    zIndex: 1000,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="selection-menu-content">
                    <div className="selected-text-preview">{selectedText.text}</div>
                    <div className="selection-menu-actions">
                      <button
                        className="highlight-btn"
                        onClick={handleHighlight}
                        title="Highlight"
                      >
                        🖍️ Highlight
                      </button>
                      <button
                        className="comment-btn"
                        onClick={handleComment}
                        title="Comment"
                      >
                        💬 Comment
                      </button>
                      <div className="color-picker">
                        <span>Màu:</span>
                        {['#ffeb3b', '#ff9800', '#f44336', '#4caf50', '#2196f3', '#9c27b0'].map((color) => (
                          <button
                            key={color}
                            className={`color-option ${highlightColor === color ? 'active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setHighlightColor(color)}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Document>
          </div>
      </div>

        {/* Sidebar - chỉ hiện khi không fullscreen, mặc định collapsed trên mobile */}
        {!isFullscreen && (
          <div className={`annotations-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
              <h3>📝 Ghi chú ({annotations.length})</h3>
              <button 
                className="sidebar-toggle"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                title={isSidebarCollapsed ? 'Mở sidebar' : 'Thu gọn sidebar'}
              >
                {isSidebarCollapsed ? '▶' : '◀'}
              </button>
            </div>
          <div className="annotations-list">
            {annotations.length === 0 ? (
              <p className="no-annotations">Chưa có ghi chú nào</p>
            ) : (
              annotations.map((annotation) => (
                <div
                  key={annotation.id}
                  className={`annotation-item ${annotation.page === pageNumber ? 'active' : ''}`}
                  onClick={() => {
                    setPageNumber(annotation.page);
                    handleEditAnnotation(annotation);
                  }}
                >
                  <div className="annotation-item-header">
                    <span className="annotation-page">Trang {annotation.page}</span>
                    <button
                      className="delete-btn-small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAnnotation(annotation.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="annotation-item-text">{annotation.text}</div>
                  <div className="annotation-item-date">
                    {new Date(annotation.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              ))
            )}
          </div>

          {bookmarks.length > 0 && (
            <>
              <h3>🔖 Bookmarks ({bookmarks.length})</h3>
              <div className="bookmarks-list">
                {bookmarks.map((page) => (
                  <div
                    key={page}
                    className={`bookmark-item ${page === pageNumber ? 'active' : ''}`}
                    onClick={() => goToBookmark(page)}
                  >
                    Trang {page}
                  </div>
                ))}
              </div>
            </>
          )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className={`ereader-controls bottom-controls ${showControls ? 'visible' : 'hidden'}`}>
        <div className="controls-group">
          <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="nav-btn">
            ← Trước
          </button>
          <div className="zoom-controls">
            <button onClick={handleZoomOut} className="icon-btn">-</button>
            <span>{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn} className="icon-btn">+</button>
          </div>
          <button onClick={goToNextPage} disabled={pageNumber >= numPages} className="nav-btn">
            Sau →
          </button>
        </div>

        <div className="controls-group">
          <button
            className={`icon-btn ${isAnnotationMode ? 'active' : ''}`}
            onClick={() => {
              setIsAnnotationMode(!isAnnotationMode);
              setAnnotationPosition(null);
              setSelectedAnnotation(null);
            }}
            title="Chế độ ghi chú"
          >
            ✎
          </button>
        </div>
      </div>

      {/* Click hints */}
      {isFullscreen && !showControls && (
        <div className="click-hints">
          <div className="hint-left">← Click để lùi</div>
          <div className="hint-right">Click để tiến →</div>
        </div>
      )}
    </div>
  );
}

export default PDFViewer;
