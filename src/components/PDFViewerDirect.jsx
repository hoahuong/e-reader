/**
 * PDFViewerDirect - Sử dụng PDF.js trực tiếp với canvas caching
 * Giải pháp này sẽ mượt mà hơn react-pdf vì:
 * 1. Cache canvas đã render để tránh nhấp nháy hoàn toàn
 * 2. Preload trang tiếp theo và trang trước
 * 3. Kiểm soát tốt hơn quá trình render
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import './PDFViewer.css';

// Cấu hình worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

function PDFViewerDirect({ file, annotations, onAnnotationAdd, onAnnotationUpdate, onAnnotationDelete, fileName, showHeader = true }) {

  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      const screenWidth = window.innerWidth;
      // Tăng scale để render ở độ phân giải cao hơn, render chữ to hơn
      // Logic cũ: (screenWidth - 20) / 800 => quá nhỏ
      // Logic mới: zoom to hơn để dễ đọc
      // Ví dụ: iPhone XR width 414px. Scale 1.5 => canvas width 621.
      // Muốn chữ to, ta cần scale lớn hơn, ví dụ 1.8 - 2.0
      return 2.0;
    }
    return 1.6; // Tăng nhẹ scale desktop
  });
  const [readingMode, setReadingMode] = useState('sepia'); // Mặc định sepia giống máy đọc sách
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    typeof window !== 'undefined' && window.innerWidth <= 768
  );

  // Text Reflow Mode States
  const [isTextMode, setIsTextMode] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [textContent, setTextContent] = useState([]); // Array of strings (paragraphs)

  // Annotation states
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [annotationText, setAnnotationText] = useState('');
  const [annotationPosition, setAnnotationPosition] = useState(null);
  const [selectedText, setSelectedText] = useState(null);
  const [textSelectionMenu, setTextSelectionMenu] = useState(null);
  const [highlightColor, setHighlightColor] = useState('#ffeb3b');
  const [bookmarks, setBookmarks] = useState([]);
  const [contentPaddingTop, setContentPaddingTop] = useState(() => {
    // Tính toán padding-top ban đầu (showControls mặc định là true)
    // Header minimal (40px desktop, 36px mobile) + Controls (56px desktop, 48px mobile) + buffer (10px)
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth <= 768;
      return isMobile ? 94 : 106; // 36 + 48 + 10 = 94 mobile, 40 + 56 + 10 = 106 desktop
    }
    return 106;
  });

  const pdfDocRef = useRef(null);
  const canvasCacheRef = useRef(new Map()); // Cache canvas đã render: key = "page-scale"
  const currentPageRef = useRef(null);
  const containerRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const pdfContentRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const touchStartRef = useRef(null);
  const touchEndRef = useRef(null);
  const textLayerRef = useRef(null);
  const annotationLayerRef = useRef(null);
  const isPinchingRef = useRef(false); // Flag để ngăn re-render khi đang pinch

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
      }
    }
  }, [fileName]);

  // Lưu vị trí đọc và bookmarks
  useEffect(() => {
    if (fileName && pageNumber > 0) {
      localStorage.setItem(`last-page-${fileName}`, pageNumber.toString());
    }
  }, [pageNumber, fileName]);

  useEffect(() => {
    if (fileName && bookmarks.length >= 0) {
      localStorage.setItem(`bookmarks-${fileName}`, JSON.stringify(bookmarks));
    }
  }, [bookmarks, fileName]);

  // Hàm tạo âm thanh lật trang
  const playPageFlipSound = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const duration = 0.15;
      const sampleRate = audioContext.sampleRate;
      const numSamples = duration * sampleRate;
      const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const noise = (Math.random() * 2 - 1) * 0.3;
        const envelope = Math.exp(-t * 8) * (1 - Math.exp(-t * 50));
        const lowFreq = Math.sin(2 * Math.PI * 80 * t) * 0.1;
        data[i] = (noise + lowFreq) * envelope;
      }

      const source = audioContext.createBufferSource();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0.4;

      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
      source.start(0);

      source.onended = () => {
        source.disconnect();
        gainNode.disconnect();
      };
    } catch (error) {
      // Fail silently
    }
  }, []);

  // Load PDF document
  useEffect(() => {
    if (!file) return;

    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        canvasCacheRef.current.clear();

        // Xử lý file URL string (từ URL.createObjectURL) hoặc File object
        let fileData;
        if (typeof file === 'string') {
          // Nếu là URL string, fetch và lấy arrayBuffer
          const response = await fetch(file);
          fileData = await response.arrayBuffer();
        } else if (file instanceof File) {
          fileData = await file.arrayBuffer();
        } else if (file instanceof ArrayBuffer) {
          fileData = file;
        } else {
          // Fallback: thử fetch nếu là URL
          const response = await fetch(file);
          fileData = await response.arrayBuffer();
        }

        const loadingTask = pdfjsLib.getDocument({
          data: fileData,
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);

        setIsLoading(false);

        // Render trang đầu tiên sau khi PDF load xong
        // Đợi React render xong container từ JSX
        setTimeout(async () => {
          if (containerRef.current && canvasContainerRef.current && pdfDocRef.current) {
            console.log('Rendering first page...', {
              pageNumber,
              container: !!containerRef.current,
              canvasContainer: !!canvasContainerRef.current
            });
            await displayPage(pageNumber);
          } else {
            console.log('Waiting for containers...', {
              container: !!containerRef.current,
              canvasContainer: !!canvasContainerRef.current,
              pdf: !!pdfDocRef.current
            });
            // Thử lại sau 200ms
            setTimeout(async () => {
              if (containerRef.current && canvasContainerRef.current && pdfDocRef.current) {
                await displayPage(pageNumber);
              }
            }, 200);
          }
        }, 500);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setLoadError('Không thể tải file PDF: ' + error.message);
        setIsLoading(false);
      }
    };

    loadPDF();
  }, [file]);

  // Extract text content dynamically
  const extractPageText = useCallback(async (pageNum) => {
    if (!pdfDocRef.current) return null;

    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const content = await page.getTextContent();

      // Simple heuristic to reconstruct paragraphs
      const items = content.items;
      let fullText = [];
      let currentPara = { text: "", isBold: false, isHeader: false };
      let lastY = -1;
      let lastX = -1;
      let lastWidth = 0;

      // Calculate average height to detect headers
      let totalHeight = 0;
      if (items.length > 0) {
        items.forEach(item => totalHeight += item.height);
        var avgHeight = totalHeight / items.length;
      }

      if (items.length === 0) return [{ text: "(Trang này không có văn bản dạng text để trích xuất)", isBold: false, isHeader: false }];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const text = item.str;

        // Font attributes
        const isBold = item.fontName.toLowerCase().includes('bold');
        const isHeader = item.height > avgHeight * 1.1; // Simple header detection

        // Check for new line based on vertical position (transform[5] is y)
        // PDF coordinates: origin at bottom-left usually
        const y = item.transform[5];
        const x = item.transform[4];
        const width = item.width;

        if (lastY !== -1 && Math.abs(y - lastY) > 10) {
          if (currentPara.text.trim()) {
            fullText.push({ ...currentPara, text: currentPara.text.trim() });
            currentPara = { text: "", isBold: false, isHeader: false };
          }
          // Initialize new para style from current item
          currentPara.isBold = isBold;
          currentPara.isHeader = isHeader;
        } else if (lastX !== -1) {
          // Check horizontal gap to decide if space is needed
          const gap = x - (lastX + lastWidth);
          if (gap > 5 || (lastWidth > 0 && gap > lastWidth * 0.2)) {
            currentPara.text += " ";
          }
        }

        currentPara.text += text;
        // Update style if mixed (simplified: usually whole line is same style)
        if (isBold) currentPara.isBold = true;
        if (isHeader) currentPara.isHeader = true;

        lastY = y;
        lastX = x;
        lastWidth = width;
      }
      if (currentPara.text.trim()) fullText.push({ ...currentPara, text: currentPara.text.trim() });

      return fullText.length > 0 ? fullText : [{ text: "(Không tìm thấy nội dung văn bản)", isBold: false, isHeader: false }];
    } catch (e) {
      console.error("Text extraction failed:", e);
      return ["(Lỗi trích xuất văn bản)"];
    }
  }, []);

  // Update text content when page or mode changes
  useEffect(() => {
    if (isTextMode && !isLoading) {
      extractPageText(pageNumber).then(text => {
        if (text) setTextContent(text);
      });
    }
  }, [pageNumber, isTextMode, isLoading, extractPageText]);

  // Render một trang vào canvas và cache nó
  const renderPage = useCallback(async (pageNum, preload = false) => {
    if (!pdfDocRef.current || pageNum < 1 || pageNum > pdfDocRef.current.numPages) {
      return null;
    }

    // Kiểm tra cache trước
    const cacheKey = `${pageNum}-${scale}`;
    if (canvasCacheRef.current.has(cacheKey)) {
      return canvasCacheRef.current.get(cacheKey);
    }

    try {
      const page = await pdfDocRef.current.getPage(pageNum);

      // Tăng scale để render ở độ phân giải cao hơn, sau đó scale down để tránh blur
      const renderScale = scale * (typeof window !== 'undefined' && window.devicePixelRatio > 1 ? window.devicePixelRatio : 1.5);
      const viewport = page.getViewport({ scale: renderScale });

      // Tạo canvas mới với text rendering tối ưu
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', {
        alpha: false, // Không cần alpha để tăng performance và độ đậm
        desynchronized: true, // Tăng performance
      });

      // Render ở độ phân giải cao hơn
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.className = 'pdf-canvas-direct';

      // Scale canvas để hiển thị đúng kích thước nhưng giữ độ nét cao
      const displayScale = scale / renderScale;
      canvas.style.width = `${viewport.width * displayScale}px`;
      canvas.style.height = `${viewport.height * displayScale}px`;

      // Tối ưu text rendering để chữ đậm và rõ hơn
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';

      // Đảm bảo canvas có style đúng ngay từ đầu
      // Lấy readingMode từ state hiện tại
      const currentMode = readingMode;
      // Màu e-ink: Warmer tones for anti-glare
      const bgColor = currentMode === 'night'
        ? '#1a1a1a'  // Dark Grey
        : currentMode === 'sepia'
          ? '#f4ecd8'  // Warm Sepia
          : '#fdfbf7'; // Warm White (Paper)
      // Apply styles individually to avoid overwriting width/height
      canvas.style.display = 'block';
      canvas.style.visibility = 'visible';
      canvas.style.opacity = '1';
      canvas.style.maxWidth = '100%';
      // height: auto removed to respect calculated height
      canvas.style.backgroundColor = bgColor;

      // Render PDF page vào canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Cache canvas
      canvasCacheRef.current.set(cacheKey, canvas);

      return canvas;
    } catch (error) {
      console.error(`Error rendering page ${pageNum}:`, error);
      return null;
    }
  }, [scale, readingMode]);

  // Hiển thị trang - KHÔNG CÓ NHẤP NHÁY vì dùng canvas từ cache
  const displayPage = useCallback(async (pageNum) => {
    if (isTextMode) return;

    if (!containerRef.current || !pdfDocRef.current) {
      console.log('Container or PDF doc not ready', {
        container: !!containerRef.current,
        pdf: !!pdfDocRef.current,
        pageNum
      });
      return;
    }

    // Đợi container từ JSX sẵn sàng
    if (!pdfContentRef.current) {
      console.log('PDF content container not ready yet, waiting...');
      setTimeout(() => displayPage(pageNum), 100);
      return;
    }

    console.log('Displaying page', pageNum);

    // Lấy canvas từ cache hoặc render mới
    const canvas = await renderPage(pageNum);
    if (!canvas) {
      console.error('Failed to render page', pageNum);
      return;
    }

    console.log('Canvas rendered', { width: canvas.width, height: canvas.height });

    const pdfContent = pdfContentRef.current;
    if (!pdfContent) {
      console.error('PDF content container still not found');
      return;
    }

    // Clone canvas và copy image data để tránh conflict khi dùng cùng canvas
    const displayCanvas = document.createElement('canvas');

    // Sử dụng kích thước hiển thị từ canvas gốc (đã được scale)
    const displayWidth = canvas.style.width && canvas.style.width !== 'auto' ? parseInt(canvas.style.width) : canvas.width;
    const displayHeight = canvas.style.height && canvas.style.height !== 'auto' ? parseInt(canvas.style.height) : canvas.height;

    displayCanvas.width = canvas.width; // Giữ nguyên độ phân giải cao
    displayCanvas.height = canvas.height;
    displayCanvas.className = 'pdf-canvas-direct';

    // Set kích thước hiển thị
    displayCanvas.style.width = `${displayWidth}px`;
    displayCanvas.style.height = `${displayHeight}px`;

    // Copy image data từ canvas gốc với tối ưu để giữ độ nét nhưng vẫn MỊN
    const ctx = displayCanvas.getContext('2d', {
      alpha: false,
    });
    ctx.imageSmoothingEnabled = true; // BẬT smoothing để chữ mịn, không bị răng cưa
    ctx.imageSmoothingQuality = 'high'; // Chất lượng cao nhất
    ctx.drawImage(canvas, 0, 0);

    // Đảm bảo canvas có style đúng với viền trang sách và tối ưu cho mắt
    const currentMode = readingMode;
    // Màu e-ink: Warmer tones for anti-glare
    const bgColor = currentMode === 'night'
      ? '#1a1a1a'  // Dark Grey
      : currentMode === 'sepia'
        ? '#f4ecd8'  // Warm Sepia (Old Book)
        : '#fdfbf7'; // Warm White (Paper), not harsh #ffffff
    const borderColor = currentMode === 'night' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)';
    const shadowColor = currentMode === 'night' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.05)';

    // Filter e-ink: Softer contrast
    const filter = currentMode === 'night'
      ? 'contrast(1.1) brightness(0.9)'  // Softer night
      : currentMode === 'sepia'
        ? 'contrast(1.05) sepia(0.3)' // Natural sepia
        : 'contrast(1.02)'; // Natural paper look, no harsh contrast boost

    // Kiểm tra mobile để điều chỉnh style
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const marginTop = '0'; // Không có margin-top để loại bỏ khoảng trống
    const marginBottom = isMobile ? '0' : '20px';
    // QUAN TRỌNG: Sử dụng displayWidth và displayHeight đã tính từ scale cho CẢ mobile và desktop
    // Không dùng 100% trên mobile vì sẽ override zoom
    const canvasWidthValue = `${displayWidth}px`; // Luôn dùng pixel để zoom hoạt động
    const canvasHeightValue = `${displayHeight}px`; // Luôn dùng pixel để zoom hoạt động
    const canvasBorder = isMobile ? 'none' : `1px solid ${borderColor}`; // Viền mỏng hơn
    const canvasBorderRadius = isMobile ? '0' : '2px';

    displayCanvas.style.cssText = `
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      max-width: none !important;
      width: ${canvasWidthValue} !important;
      height: ${canvasHeightValue} !important;
      background: ${bgColor} !important;
      margin: 0 auto ${marginBottom} auto !important;
      margin-top: 0 !important;
      border: ${canvasBorder} !important;
      border-radius: ${canvasBorderRadius} !important;
      box-shadow: 
        ${isMobile ? 'none' : `0 2px 10px ${shadowColor}`} !important;
      
      /* Filter dịu mắt cho người đọc */
      filter: ${filter} !important;
      
      /* QUAN TRỌNG: Text rendering MỊN (Standard Web Rendering) */
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      
      /* Đảm bảo canvas không bị blur khi scale */
      transform: translateZ(0);
      will-change: contents;
      object-fit: contain;
      box-sizing: border-box;
    `;

    // Xóa canvas cũ và thêm canvas mới
    pdfContent.innerHTML = '';
    pdfContent.appendChild(displayCanvas);

    // Force reflow để đảm bảo browser render canvas
    displayCanvas.offsetHeight;

    console.log('Canvas appended to container', {
      container: !!pdfContent,
      canvas: !!displayCanvas,
      hasParent: !!pdfContent.parentElement,
      canvasWidth: displayCanvas.width,
      canvasHeight: displayCanvas.height,
      canvasStyle: window.getComputedStyle(displayCanvas).display,
      containerWidth: pdfContent.offsetWidth,
      containerHeight: pdfContent.offsetHeight,
      containerStyle: window.getComputedStyle(pdfContent).display
    });

    // Kiểm tra xem canvas có thực sự được hiển thị không
    const rect = displayCanvas.getBoundingClientRect();
    console.log('Canvas bounding rect:', {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      visible: rect.width > 0 && rect.height > 0
    });

    currentPageRef.current = pageNum;

    // Preload trang tiếp theo và trang trước (background)
    if (numPages && pageNum < numPages) {
      renderPage(pageNum + 1, true);
    }
    if (pageNum > 1) {
      renderPage(pageNum - 1, true);
    }
  }, [renderPage, numPages, isTextMode]);

  // Khi scale thay đổi, re-render trang hiện tại với scale mới
  // QUAN TRỌNG: Không re-render khi đang pinch zoom để tránh giật
  useEffect(() => {
    // Bỏ qua re-render nếu đang pinch zoom (sẽ re-render khi pinch kết thúc)
    if (isPinchingRef.current) {
      return;
    }
    
    if (!isTextMode && pdfDocRef.current && pageNumber > 0 && !isLoading && numPages && displayPage) {
      console.log('Scale changed to:', scale, 'Re-rendering page:', pageNumber);
      // Clear cache để force re-render với scale mới
      canvasCacheRef.current.clear();
      // Re-render trang hiện tại với scale mới
      const renderAndDisplay = async () => {
        try {
          await displayPage(pageNumber);
        } catch (err) {
          console.error('Error re-rendering page after scale change:', err);
        }
      };
      renderAndDisplay();
    }
  }, [scale, isTextMode, pageNumber, isLoading, numPages, displayPage]);

  // Khi pageNumber thay đổi, hiển thị trang mới
  useEffect(() => {
    if (pageNumber > 0 && pdfDocRef.current && !isLoading && numPages && currentPageRef.current !== pageNumber) {
      // Không phát âm thanh ở đây vì đã phát trong goToPrevPage/goToNextPage
      displayPage(pageNumber);
    }
  }, [pageNumber, displayPage, isLoading, numPages]);

  // useEffect này đã được xử lý ở trên, không cần duplicate

  // Khi chuyển từ Text Mode về PDF Mode, render lại trang
  useEffect(() => {
    if (!isTextMode && pdfDocRef.current) {
      // Small timeout to ensure container is ready
      setTimeout(() => displayPage(pageNumber), 50);
    }
  }, [isTextMode, pageNumber, displayPage]);

  const goToPrevPage = useCallback(() => {
    if (pageNumber <= 1) return;
    playPageFlipSound();
    setPageNumber(pageNumber - 1);
  }, [pageNumber, playPageFlipSound]);

  const goToNextPage = useCallback(() => {
    if (pageNumber >= numPages) return;
    playPageFlipSound();
    setPageNumber(pageNumber + 1);
  }, [pageNumber, numPages, playPageFlipSound]);

  const toggleBookmark = useCallback(() => {
    if (!fileName) return;
    const bookmarkIndex = bookmarks.indexOf(pageNumber);
    if (bookmarkIndex >= 0) {
      setBookmarks(prev => prev.filter(b => b !== pageNumber));
    } else {
      setBookmarks(prev => [...prev, pageNumber].sort((a, b) => a - b));
    }
  }, [pageNumber, bookmarks, fileName]);

  // Highlight selected text
  const handleHighlight = useCallback(() => {
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
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
  }, [selectedText, highlightColor, onAnnotationAdd]);

  // Comment on selected text
  const handleComment = useCallback(() => {
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
    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }
  }, [selectedText]);

  // Handle page click
  const handlePageClick = useCallback((event) => {
    if (isAnnotationMode) {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      setAnnotationPosition({ x, y, page: pageNumber });
      setAnnotationText('');
      setSelectedAnnotation(null);
      return;
    }

    // Click để lật trang (chỉ khi không có text selection)
    if (!textSelectionMenu) {
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const width = rect.width;

      if (clickX < width / 3) {
        goToPrevPage();
      } else if (clickX > (width * 2) / 3) {
        goToNextPage();
      }
    }
  }, [isAnnotationMode, pageNumber, textSelectionMenu, goToPrevPage, goToNextPage]);

  // Save annotation
  const handleSaveAnnotation = useCallback(() => {
    if (!annotationPosition || !annotationText.trim()) return;

    const newAnnotation = {
      id: selectedAnnotation ? selectedAnnotation.id : Date.now(),
      page: annotationPosition.page,
      x: annotationPosition.x,
      y: annotationPosition.y,
      text: annotationText,
      createdAt: selectedAnnotation ? selectedAnnotation.createdAt : new Date().toISOString(),
      updatedAt: selectedAnnotation ? new Date().toISOString() : undefined,
    };

    if (selectedAnnotation) {
      onAnnotationUpdate(newAnnotation);
    } else {
      onAnnotationAdd(newAnnotation);
    }

    setAnnotationPosition(null);
    setAnnotationText('');
    setIsAnnotationMode(false);
    setSelectedAnnotation(null);
  }, [annotationPosition, annotationText, selectedAnnotation, onAnnotationAdd, onAnnotationUpdate]);

  // Delete annotation
  const handleDeleteAnnotation = useCallback((id) => {
    onAnnotationDelete(id);
    setSelectedAnnotation(null);
    setAnnotationText('');
    setAnnotationPosition(null);
  }, [onAnnotationDelete]);

  // Edit annotation
  const handleEditAnnotation = useCallback((annotation) => {
    setSelectedAnnotation(annotation);
    setAnnotationText(annotation.text);
    setAnnotationPosition({ x: annotation.x, y: annotation.y, page: annotation.page });
    setPageNumber(annotation.page);
    setIsAnnotationMode(true);
  }, []);

  // Text selection handler
  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection();
      if (selection.rangeCount === 0 || selection.toString().trim() === '') {
        setSelectedText(null);
        setTextSelectionMenu(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const canvasContainer = canvasContainerRef.current;
      if (!canvasContainer) return;

      const containerRect = canvasContainer.getBoundingClientRect();
      const x = ((rect.left + rect.width / 2 - containerRect.left) / containerRect.width) * 100;
      const y = ((rect.top - containerRect.top) / containerRect.height) * 100;

      setSelectedText({
        text: selection.toString(),
        x,
        y,
        page: pageNumber,
        rect: {
          left: rect.left - containerRect.left,
          top: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        },
        pageRect: {
          width: containerRect.width,
          height: containerRect.height,
        },
      });

      setTextSelectionMenu({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    };

    document.addEventListener('selectionchange', handleTextSelection);
    return () => document.removeEventListener('selectionchange', handleTextSelection);
  }, [pageNumber]);

  const currentPageAnnotations = annotations.filter((ann) => ann.page === pageNumber);
  const progress = numPages ? ((pageNumber / numPages) * 100).toFixed(1) : 0;

  // Kiểm tra mobile và cập nhật khi resize
  const [isMobileState, setIsMobileState] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileState(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = isMobileState;

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          goToPrevPage();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          goToNextPage();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          toggleBookmark();
          break;
        case 'Escape':
          if (isFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress, true);
    return () => document.removeEventListener('keydown', handleKeyPress, true);
  }, [goToPrevPage, goToNextPage, toggleFullscreen, toggleBookmark, isFullscreen]);

  // Touch gestures - Swipe để chuyển trang và Pinch zoom (mượt mà với CSS transform)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartX = null;
    let touchStartY = null;
    let touchStartTime = null;
    let isScrolling = false;
    let initialDistance = null;
    let initialScale = null;
    let isPinching = false;
    let animationFrameId = null;
    let pinchTimeoutId = null;
    let currentPinchScale = null;

    const getDistance = (touch1, touch2) => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const applyPinchTransform = (pinchScale) => {
      // Áp dụng CSS transform để zoom mượt mà mà không re-render canvas
      const pdfContent = pdfContentRef.current;
      if (pdfContent) {
        const canvas = pdfContent.querySelector('canvas');
        if (canvas) {
          const clampedScale = Math.max(0.5, Math.min(5.0, pinchScale));
          const scaleRatio = clampedScale / initialScale; // Dùng initialScale thay vì scale hiện tại
          // Sử dụng will-change và transform để tối ưu performance
          canvas.style.willChange = 'transform';
          canvas.style.transform = `scale(${scaleRatio})`;
          canvas.style.transformOrigin = 'center center';
          canvas.style.transition = 'none'; // Không có transition để mượt mà
          canvas.style.backfaceVisibility = 'hidden'; // Tối ưu rendering
          canvas.style.perspective = '1000px'; // Tối ưu 3D transform
        }
      }
    };

    const finalizePinchZoom = (finalScale) => {
      const clampedScale = Math.max(0.5, Math.min(5.0, finalScale));
      const scaleRatio = clampedScale / initialScale;
      
      // Clear timeout nếu có
      if (pinchTimeoutId !== null) {
        clearTimeout(pinchTimeoutId);
        pinchTimeoutId = null;
      }
      
      // Lưu vị trí của điểm đang xem trên canvas (tọa độ trên canvas element)
      const pdfContent = pdfContentRef.current;
      const canvasContainer = canvasContainerRef.current;
      
      let savedViewportCenterOnCanvas = 0; // Vị trí Y trên canvas của điểm center viewport
      let savedScrollTop = 0;
      let savedScrollLeft = 0;
      let savedCanvasHeight = 0;
      
      if (canvasContainer && pdfContent) {
        const canvas = pdfContent.querySelector('canvas');
        if (canvas) {
          const containerRect = canvasContainer.getBoundingClientRect();
          const canvasRect = canvas.getBoundingClientRect();
          
          // Vị trí center của viewport (tọa độ tuyệt đối trên page)
          const viewportCenterY = containerRect.top + containerRect.height / 2;
          
          // Vị trí của điểm center viewport trên canvas element
          // = vị trí viewport center trên page - vị trí canvas top trên page + scrollTop
          const canvasTop = canvasRect.top;
          savedViewportCenterOnCanvas = (viewportCenterY - canvasTop) + canvasContainer.scrollTop;
          savedCanvasHeight = canvasRect.height;
          
          savedScrollTop = canvasContainer.scrollTop;
          savedScrollLeft = canvasContainer.scrollLeft;
          
          console.log('Saving scroll position:', {
            viewportCenterY,
            canvasTop,
            scrollTop: canvasContainer.scrollTop,
            savedViewportCenterOnCanvas,
            savedCanvasHeight
          });
        }
      }
      
      // Reset pinching flag ngay lập tức để cho phép re-render
      isPinchingRef.current = false;
      
      // Apply scale thực sự ngay lập tức (không delay) để tránh giật
      setScale(clampedScale);
      currentPinchScale = null;
      
      // Đợi canvas được re-render và restore scroll position
      // Sử dụng polling để đảm bảo canvas đã được render xong
      let retryCount = 0;
      const maxRetries = 20; // Tối đa 2 giây (20 * 100ms)
      
      const restoreScroll = () => {
        const pdfContentAfter = pdfContentRef.current;
        const canvasContainerAfter = canvasContainerRef.current;
        
        if (!pdfContentAfter || !canvasContainerAfter) {
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(restoreScroll, 100);
          }
          return;
        }
        
        const canvasAfter = pdfContentAfter.querySelector('canvas');
        if (!canvasAfter) {
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(restoreScroll, 100);
          }
          return;
        }
        
        const canvasRectAfter = canvasAfter.getBoundingClientRect();
        const canvasHeightAfter = canvasRectAfter.height;
        
        // Kiểm tra xem canvas đã được render chưa (có chiều cao > 0)
        if (canvasHeightAfter <= 0) {
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(restoreScroll, 100);
          }
          return;
        }
        
        // Reset transform styles sau khi canvas đã được re-render với scale mới
        canvasAfter.style.transform = '';
        canvasAfter.style.transformOrigin = '';
        canvasAfter.style.transition = '';
        canvasAfter.style.willChange = '';
        canvasAfter.style.backfaceVisibility = '';
        canvasAfter.style.perspective = '';
        
        // Đợi layout ổn định
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const canvasRectFinal = canvasAfter.getBoundingClientRect();
            const containerRectFinal = canvasContainerAfter.getBoundingClientRect();
            const canvasHeightFinal = canvasRectFinal.height;
            
            if (canvasHeightFinal > 0 && savedCanvasHeight > 0) {
              // Tính toán vị trí mới của điểm đang xem trên canvas mới
              // Scale theo tỷ lệ chiều cao canvas
              const heightRatio = canvasHeightFinal / savedCanvasHeight;
              const newViewportCenterOnCanvas = savedViewportCenterOnCanvas * heightRatio;
              
              // Vị trí center của viewport (tọa độ tuyệt đối trên page)
              const viewportCenterYFinal = containerRectFinal.top + containerRectFinal.height / 2;
              
              // Vị trí top của canvas trên page
              const canvasTopFinal = canvasRectFinal.top;
              
              // Tính toán scrollTop để điểm newViewportCenterOnCanvas trên canvas nằm ở center viewport
              // scrollTop = newViewportCenterOnCanvas - (viewportCenterY - canvasTop)
              const offsetFromTop = viewportCenterYFinal - canvasTopFinal;
              const newScrollTop = newViewportCenterOnCanvas - offsetFromTop;
              
              // Apply scroll position (đảm bảo không âm và không vượt quá max scroll)
              const maxScrollTop = canvasContainerAfter.scrollHeight - canvasContainerAfter.clientHeight;
              canvasContainerAfter.scrollTop = Math.max(0, Math.min(maxScrollTop, newScrollTop));
              
              // Giữ nguyên scroll left với tỷ lệ scale
              const maxScrollLeft = canvasContainerAfter.scrollWidth - canvasContainerAfter.clientWidth;
              const newScrollLeft = savedScrollLeft * scaleRatio;
              canvasContainerAfter.scrollLeft = Math.max(0, Math.min(maxScrollLeft, newScrollLeft));
              
              console.log('Scroll position restored:', {
                savedViewportCenterOnCanvas,
                savedCanvasHeight,
                canvasHeightFinal,
                heightRatio,
                newViewportCenterOnCanvas,
                viewportCenterYFinal,
                canvasTopFinal,
                offsetFromTop,
                newScrollTop,
                maxScrollTop,
                finalScrollTop: canvasContainerAfter.scrollTop,
                savedScrollTop,
                scaleRatio
              });
            }
          });
        });
      };
      
      // Bắt đầu restore sau một delay nhỏ để đảm bảo setScale đã trigger re-render
      setTimeout(restoreScroll, 100);
    };

    const handleTouchStart = (e) => {
      // Cancel pending operations
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      if (pinchTimeoutId !== null) {
        clearTimeout(pinchTimeoutId);
        pinchTimeoutId = null;
      }

      // Nếu có 2 ngón tay -> pinch zoom
      if (e.touches.length === 2) {
        isPinching = true;
        isPinchingRef.current = true; // Set flag để ngăn re-render
        initialDistance = getDistance(e.touches[0], e.touches[1]);
        initialScale = scale;
        currentPinchScale = scale;
        e.preventDefault();
        return;
      }

      // Nếu chỉ có 1 ngón tay -> swipe
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      isScrolling = false;
    };

    const handleTouchMove = (e) => {
      // Xử lý pinch zoom với CSS transform để mượt mà
      if (e.touches.length === 2 && isPinching && initialDistance !== null && initialScale !== null) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches[0], e.touches[1]);
        const scaleChange = currentDistance / initialDistance;
        const newScale = initialScale * scaleChange;
        currentPinchScale = newScale;
        
        // Cancel pending finalize
        if (pinchTimeoutId !== null) {
          clearTimeout(pinchTimeoutId);
          pinchTimeoutId = null;
        }
        
        // Cancel animation frame cũ nếu có
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
        
        // Apply transform mượt mà với requestAnimationFrame mỗi frame
        animationFrameId = requestAnimationFrame(() => {
          applyPinchTransform(newScale);
          animationFrameId = null;
        });
        return;
      }

      // Xử lý swipe (chỉ khi không pinch)
      if (!isPinching && touchStartX !== null && touchStartY !== null) {
        const touchCurrentX = e.touches[0].clientX;
        const touchCurrentY = e.touches[0].clientY;

        const diffX = Math.abs(touchCurrentX - touchStartX);
        const diffY = Math.abs(touchCurrentY - touchStartY);

        // Nếu scroll dọc nhiều hơn scroll ngang thì không swipe trang
        if (diffY > diffX && diffY > 10) {
          isScrolling = true;
        }
      }
    };

    const handleTouchEnd = (e) => {
      // Reset pinch zoom state và finalize zoom
      if (e.touches.length < 2 && isPinching) {
        if (currentPinchScale !== null) {
          finalizePinchZoom(currentPinchScale);
        } else {
          // Reset transform nếu không có scale mới
          const pdfContent = pdfContentRef.current;
          if (pdfContent) {
            const canvas = pdfContent.querySelector('canvas');
            if (canvas) {
              canvas.style.transform = '';
              canvas.style.transformOrigin = '';
              canvas.style.transition = '';
              canvas.style.willChange = '';
              canvas.style.backfaceVisibility = '';
              canvas.style.perspective = '';
            }
          }
          isPinchingRef.current = false; // Reset flag
        }
        
        isPinching = false;
        initialDistance = null;
        initialScale = null;
        currentPinchScale = null;
      }

      // Xử lý swipe (chỉ khi không pinch và có đủ thông tin)
      if (!isPinching && touchStartX !== null && !isScrolling) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const touchEndTime = Date.now();

        const diffX = touchStartX - touchEndX;
        const diffY = Math.abs(touchEndY - touchStartY);
        const diffTime = touchEndTime - touchStartTime;

        // Chỉ swipe nếu:
        // 1. Swipe ngang nhiều hơn dọc (diffX > diffY)
        // 2. Swipe đủ xa (ít nhất 50px)
        // 3. Swipe đủ nhanh (dưới 500ms)
        // 4. Swipe ngang nhiều hơn dọc ít nhất 2 lần
        if (Math.abs(diffX) > 50 &&
          diffTime < 500 &&
          Math.abs(diffX) > diffY * 2 &&
          Math.abs(diffX) > diffY + 30) {
          e.preventDefault();
          if (diffX > 0) {
            // Swipe trái -> trang sau
            goToNextPage();
          } else {
            // Swipe phải -> trang trước
            goToPrevPage();
          }
        }
      }

      // Reset swipe state
      if (e.touches.length === 0) {
        touchStartX = null;
        touchStartY = null;
        touchStartTime = null;
        isScrolling = false;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      if (pinchTimeoutId !== null) {
        clearTimeout(pinchTimeoutId);
      }
    };
  }, [goToPrevPage, goToNextPage, scale]);

  // Wheel navigation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let wheelTimeout = null;
    const handleWheel = (e) => {
      e.preventDefault();
      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => {
        if (e.deltaY > 0) {
          goToNextPage();
        } else if (e.deltaY < 0) {
          goToPrevPage();
        }
      }, 100);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      clearTimeout(wheelTimeout);
    };
  }, [goToPrevPage, goToNextPage]);

  // Auto-hide controls - giống máy đọc sách: tự động ẩn sau 3 giây
  useEffect(() => {
    // Luôn auto-hide controls để giống máy đọc sách
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    const handleMouseLeave = () => {
      // Ẩn controls khi mouse rời khỏi vùng controls
      setTimeout(() => {
        setShowControls(false);
      }, 1000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    const container = containerRef.current;
    if (container) {
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    // Hiển thị controls ban đầu
    handleMouseMove();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (container) {
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
      clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loadError) {
    return (
      <div className="error-container">
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <div className="error-text">{loadError}</div>
        </div>
      </div>
    );
  }

  if (isLoading || !pdfDocRef.current) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">📖</div>
        <div className="loading-text">Đang tải PDF...</div>
      </div>
    );
  }

  // Màu nền màn hình e-ink - Giống Kindle: nhẹ nhàng, không vàng cát, không hại mắt
  const bgColor = readingMode === 'night'
    ? '#1a1a1a'  // Đen nhẹ cho night mode
    : readingMode === 'sepia'
      ? '#faf9f6'  // Beige nhẹ, không vàng cát cháy - giống e-ink sepia
      : '#fafafa'; // Off-white nhẹ, không quá trắng - giống e-ink day mode
  const isBookmarked = bookmarks.includes(pageNumber);

  return (
    <div
      className={`pdf-viewer-direct ereader-mode ${readingMode} ${isFullscreen ? 'fullscreen' : ''}`}
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: bgColor,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Georgia", "Times New Roman", serif',
        // Đảm bảo không có khoảng trống trên mobile
        minHeight: '100%',
        // Đảm bảo container không ảnh hưởng đến controls fixed
        // Bỏ isolation để tránh tạo stacking context mới gây che phủ
        // isolation: 'isolate',
      }}
    >
      {/* Top Controls - Ẩn hoàn toàn khi showControls = false */}
      <div
        className={`ereader-controls top-controls ${showControls ? 'visible' : 'hidden'}`}
        id="pdf-top-controls"
        style={{
          position: 'relative',
          width: '100%',
          // Khi ẩn: height = 0, khi hiện: height = auto
          height: showControls ? 'auto' : '0',
          maxHeight: showControls ? (isMobile ? '36px' : '40px') : '0',
          minHeight: showControls ? (isMobile ? '36px' : '40px') : '0',
          overflowX: 'auto', // Cho phép scroll ngang nếu controls quá dài
          overflowY: 'hidden',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(12px)',
          borderBottom: showControls ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          borderLeft: 'none',
          borderRight: 'none',
          margin: 0,
          // Khi ẩn: padding = 0, khi hiện: padding bình thường
          padding: showControls ? (isMobile ? '4px 8px' : '8px 16px') : '0',
          flexWrap: 'nowrap',
          // Cho phép content trôi qua trái/phải
          whiteSpace: 'nowrap',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          visibility: showControls ? 'visible' : 'hidden',
          opacity: showControls ? 1 : 0,
          transition: 'height 0.3s ease, opacity 0.3s ease, visibility 0.3s ease, padding 0.3s ease',
          flexShrink: 0,
          flexGrow: 0,
          order: -1,
          boxSizing: 'border-box',
          pointerEvents: showControls ? 'auto' : 'none',
        }}
      >
        <div className="controls-left" style={{ background: 'transparent', pointerEvents: 'auto' }}>
          <button
            onClick={() => setShowControls(!showControls)}
            className="icon-btn minimal-btn"
            title="Ẩn/Hiện điều khiển"
          >
            ☰
          </button>
          {/* Button Previous - Giống Kindle */}
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="nav-btn-top"
            title="Trang trước"
          >
            ←
          </button>
          <span className="page-info-minimal">
            {pageNumber} / {numPages}
          </span>
          {/* Button Next - Giống Kindle */}
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="nav-btn-top"
            title="Trang sau"
          >
            →
          </button>
        </div>

        <div
          className="controls-center"
          style={{
            pointerEvents: 'auto',
            height: 'auto',
            maxHeight: isMobile ? '72px' : '80px', // Changed
            minHeight: 0,
            overflow: 'hidden',
            alignSelf: 'center', // Không stretch theo chiều dọc
            display: isMobile ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            className="progress-bar-minimal"
            style={{
              height: '3px',
              maxHeight: '3px',
              minHeight: '3px',
              width: '100%',
              maxWidth: isMobile ? '150px' : '300px', // Changed
            }}
          >
            <div
              className="progress-fill-minimal"
              style={{
                width: `${progress}%`,
                height: '100%',
                maxHeight: '3px',
              }}
            ></div>
          </div>
        </div>

        <div className="controls-right" style={{ background: 'transparent', pointerEvents: 'auto' }}>
          <div className="reading-mode-buttons">
            <button
              className={`mode-btn ${readingMode === 'day' ? 'active' : ''}`}
              onClick={() => setReadingMode('day')}
              title="Chế độ sáng"
            >
              ☀️
            </button>
            <button
              className={`mode-btn ${readingMode === 'sepia' ? 'active' : ''}`}
              onClick={() => setReadingMode('sepia')}
              title="Chế độ sepia"
            >
              📖
            </button>
            <button
              className={`mode-btn ${readingMode === 'night' ? 'active' : ''}`}
              onClick={() => setReadingMode('night')}
              title="Chế độ tối"
            >
              Dark
            </button>
          </div>

          {/* Text Mode Toggle */}
          <button
            className={`icon-btn ${isTextMode ? 'active' : ''}`}
            onClick={() => setIsTextMode(!isTextMode)}
            title={isTextMode ? "Chuyển về xem gốc" : "Chế độ đọc văn bản (Reflow)"}
            style={{ fontWeight: 'bold', fontFamily: 'serif' }}
          >
            Tt
          </button>

          {/* Font Size Controls (Only in Text Mode) */}
          {/* Zoom / Font Size Controls */}
          <div className="font-controls" style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
            <button
              className="icon-btn"
              onClick={() => {
                if (isTextMode) {
                  setFontSize(prev => Math.max(14, prev - 2));
                } else {
                  // Giảm scale - useEffect sẽ tự động re-render
                  const newScale = Math.max(0.5, scale - 0.2);
                  console.log('Zoom out:', scale, '->', newScale);
                  setScale(newScale);
                }
              }}
              title={isTextMode ? "Giảm cỡ chữ" : "Thu nhỏ (Zoom Out)"}
            >
              A-
            </button>
            <button
              className="icon-btn"
              onClick={() => {
                if (isTextMode) {
                  setFontSize(prev => Math.min(32, prev + 2));
                } else {
                  // Tăng scale - useEffect sẽ tự động re-render
                  const newScale = Math.min(5.0, scale + 0.2);
                  console.log('Zoom in:', scale, '->', newScale);
                  setScale(newScale);
                }
              }}
              title={isTextMode ? "Tăng cỡ chữ" : "Phóng to (Zoom In)"}
            >
              A+
            </button>
          </div>

          <button
            className={`icon-btn bookmark-btn-minimal ${isBookmarked ? 'bookmarked' : ''}`}
            onClick={toggleBookmark}
            title={isBookmarked ? 'Bỏ bookmark' : 'Đánh dấu trang'}
          >
            {isBookmarked ? '🔖' : '📑'}
          </button>
          {/* Ẩn button annotation trên mobile để tránh che nội dung - sẽ có button riêng */}
          {!isMobile && (
            <button
              onClick={() => setIsAnnotationMode(!isAnnotationMode)}
              className={`icon-btn ${isAnnotationMode ? 'active' : ''}`}
              title={isAnnotationMode ? 'Tắt chế độ ghi chú' : 'Bật chế độ ghi chú'}
            >
              {isAnnotationMode ? '✏️' : '📝'}
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className="icon-btn"
            title="Toàn màn hình"
          >
            {isFullscreen ? '⤓' : '⛶'}
          </button>
        </div>
      </div>

      {/* Main Content Wrapper - Màn hình e-ink chính */}
      <div
        className="pdf-content-wrapper"
        style={{
          display: 'flex',
          flexDirection: 'column', // Đảm bảo flex direction là column để children sát với top
          flex: 1,
          overflow: 'hidden',
          height: '100%',
          minHeight: showControls ? '100%' : '100vh', // Full viewport height khi controls ẩn
          width: '100%', // Full width
          // QUAN TRỌNG: Khi ẩn cả header và controls, PDF hiển thị full chiều cao và chiều rộng
          // Padding-top chỉ khi header minimal hiển thị
          // Khi cả header và controls đều ẩn -> padding-top = 0 để full screen như máy đọc sách thật
          paddingTop: showHeader 
            ? (isMobile ? '36px' : '40px') // Padding cho header minimal khi header hiện
            : '0px', // Không có padding khi header ẩn -> full screen như máy đọc sách thật
          // Padding bottom chỉ khi bottom control hiện và là fixed trên mobile
          paddingBottom: (showControls && isMobile) ? '60px' : '0px',
          marginBottom: '0px',
          // Đảm bảo wrapper không có khoảng trống
          marginTop: '0px',
          position: 'relative',
          zIndex: 1,
          // Đảm bảo flex children chiếm đầy đủ không gian
          alignItems: 'stretch', // Stretch để children chiếm đầy đủ chiều rộng
          alignContent: 'flex-start', // Căn trên để không có khoảng trống
          justifyContent: 'flex-start', // Căn trên để không có khoảng trống dưới
          // Background e-ink: nhẹ nhàng, không vàng cát, không hại mắt
          backgroundColor: readingMode === 'night'
            ? '#1a1a1a'  // Đen nhẹ
            : readingMode === 'sepia'
              ? '#faf9f6'  // Beige nhẹ, không vàng cát cháy
              : '#fafafa', // Off-white nhẹ, giống e-ink
          paddingLeft: isMobile ? '0px' : '0px',
          paddingRight: isMobile ? '0px' : '0px',
        }}
      >
        {/* Trên mobile: Loại bỏ bezel, PDF chiếm toàn bộ màn hình */}
        {isMobile ? (
          /* Canvas Container trực tiếp - không có bezel trên mobile */
          <div
            key={isTextMode ? 'text-mode-mobile' : 'pdf-mode-mobile'}
            ref={canvasContainerRef}
            className="pdf-canvas-container-direct"
            onClick={handlePageClick}
            style={{
              flex: 1,
              width: '100%',
              height: showControls ? 'auto' : '100%', // Full height khi controls ẩn
              maxWidth: '100%',
              maxHeight: showControls ? 'none' : '100%', // Full height khi controls ẩn
              minHeight: showControls ? 0 : '100%', // Full height khi controls ẩn
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              alignContent: 'flex-start',
              alignSelf: 'flex-start',
              overflow: 'auto',
              paddingTop: '0px',
              paddingBottom: '0px',
              paddingLeft: showControls ? '4px' : '0px', // Full width khi controls ẩn
              paddingRight: showControls ? '4px' : '0px', // Full width khi controls ẩn
              marginTop: '0px',
              marginBottom: '0px',
              position: 'relative',
              top: '0px',
              backgroundColor: readingMode === 'night'
                ? '#1a1a1a'
                : readingMode === 'sepia'
                  ? '#f4ecd8'
                  : '#fdfbf7', // Đồng bộ màu nền container với canvas
              boxSizing: 'border-box',
            }}
          >
            {isLoading && (
              <div style={{ color: readingMode === 'night' ? '#fff' : '#000' }}>
                Đang tải trang...
              </div>
            )}

            {/* TEXT REFLOW MODE RENDERING */}
            {isTextMode ? (
              <div
                className="text-reflow-container"
                style={{
                  width: '100%',
                  maxWidth: '800px',
                  margin: '0 auto',
                  padding: '20px',
                  paddingBottom: '100px', // Tăng padding bottom để không bị che bởi bottom controls
                  boxSizing: 'border-box',
                  fontSize: `${fontSize}px`,
                  lineHeight: '1.6',
                  fontFamily: '"Merriweather", "Georgia", serif',
                  color: readingMode === 'night' ? '#eee' : '#333',
                  textAlign: 'left',
                  backgroundColor: 'transparent',
                  minHeight: '100%'
                }}
              >
                {textContent.map((para, idx) => {
                  const isString = typeof para === 'string';
                  const text = isString ? para : para.text;
                  const isBold = !isString && para.isBold;
                  const isHeader = !isString && para.isHeader;

                  return (
                    <p key={idx} style={{
                      marginBottom: isHeader ? '1em' : '1.5em',
                      marginTop: isHeader ? '1.5em' : '0',
                      fontWeight: isBold ? 'bold' : 'normal',
                      fontSize: isHeader ? '1.4em' : '1em',
                      lineHeight: isHeader ? '1.3' : '1.8'
                    }}>
                      {text}
                    </p>
                  );
                })}
                <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.5, fontSize: '0.8em' }}>
                  --- Hết trang {pageNumber} ---
                </div>
              </div>
            ) : (
              /* ORIGINAL PDF CANVAS RENDERING */
              <div
                ref={pdfContentRef}
                className="pdf-render-target"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center'
                }}
              />
            )}

            {/* Overlay layer cho highlights và annotations - ONLY visible in PDF mode */}
            {!isTextMode && (
              <div
                className="annotation-overlay"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: isAnnotationMode ? 'auto' : 'none',
                  zIndex: 2,
                }}
              >
                {/* Highlights */}
                {currentPageAnnotations
                  .filter((ann) => ann.type === 'highlight')
                  .map((annotation) => {
                    if (!annotation.rect || !annotation.pageRect) return null;
                    const canvasContainer = canvasContainerRef.current;
                    if (!canvasContainer) return null;

                    const containerRect = canvasContainer.getBoundingClientRect();
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
                          backgroundColor: annotation.color || highlightColor,
                          opacity: 0.4,
                          pointerEvents: 'auto',
                          zIndex: 1,
                          cursor: 'pointer',
                        }}
                        title={annotation.text}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAnnotation(annotation);
                        }}
                      />
                    );
                  })}

                {/* Annotation markers */}
                {currentPageAnnotations
                  .filter((ann) => ann.type !== 'highlight')
                  .map((annotation) => (
                    <div
                      key={annotation.id}
                      className="annotation-marker"
                      style={{
                        position: 'absolute',
                        left: `${annotation.x}%`,
                        top: `${annotation.y}%`,
                        zIndex: 3,
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

                {/* Annotation form */}
                {annotationPosition && annotationPosition.page === pageNumber && (
                  <div
                    className="annotation-form"
                    style={{
                      position: 'absolute',
                      left: `${annotationPosition.x}%`,
                      top: `${annotationPosition.y}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 10,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <textarea
                      value={annotationText}
                      onChange={(e) => setAnnotationText(e.target.value)}
                      placeholder="Nhập ghi chú..."
                      autoFocus
                    />
                    <div className="annotation-form-buttons">
                      <button onClick={handleSaveAnnotation}>
                        {selectedAnnotation ? 'Cập nhật' : 'Lưu'}
                      </button>
                      <button
                        onClick={() => {
                          setAnnotationPosition(null);
                          setAnnotationText('');
                          setIsAnnotationMode(false);
                          setSelectedAnnotation(null);
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Desktop: Có bezel nhẹ */
          <div
            className="ereader-screen-frame"
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'stretch',
              backgroundColor: '#2a2a2a',
              position: 'relative',
              boxSizing: 'border-box',
              padding: '15px',
            }}
          >
            {/* Canvas Container - Chính là màn hình e-ink */}
            <div
              key={isTextMode ? 'text-mode-desktop' : 'pdf-mode-desktop'}
              ref={canvasContainerRef}
              className="pdf-canvas-container-direct"
              onClick={handlePageClick}
              style={{
                flex: 1,
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start', // Căn trên để PDF sát với top
                alignContent: 'flex-start', // Đảm bảo không có khoảng trống trên top
                overflow: 'auto',
                paddingTop: '0px', // KHÔNG có padding-top để PDF sát với top
                paddingBottom: showControls ? '80px' : '20px',
                marginTop: '0px', // Đảm bảo không có margin-top
                paddingLeft: '20px',
                paddingRight: '20px',
                minHeight: 'calc(100vh - 96px)',
                // Background e-ink: nhẹ nhàng, không vàng cát, không hại mắt
                backgroundColor: readingMode === 'night'
                  ? '#1a1a1a'  // Đen nhẹ
                  : readingMode === 'sepia'
                    ? '#faf9f6'  // Beige nhẹ, không vàng cát cháy
                    : '#fafafa', // Off-white nhẹ, giống e-ink
                position: 'relative',
                boxSizing: 'border-box',
                borderRadius: '0',
                boxShadow: 'none',
                border: 'none',
              }}
            >
              {isLoading && (
                <div style={{ color: readingMode === 'night' ? '#fff' : '#000' }}>
                  Đang tải trang...
                </div>
              )}

              {/* TEXT REFLOW MODE RENDERING */}
              {isTextMode ? (
                <div
                  className="text-reflow-container"
                  style={{
                    width: '100%',
                      maxWidth: '800px',
                      margin: '0 auto',
                      padding: '20px',
                    paddingBottom: '100px', // Tăng padding bottom để không bị che bởi bottom controls
                    boxSizing: 'border-box',
                    fontSize: `${fontSize}px`,
                    lineHeight: '1.6',
                    fontFamily: '"Merriweather", "Georgia", serif',
                    color: readingMode === 'night' ? '#eee' : '#333',
                    textAlign: 'left',
                    backgroundColor: 'transparent',
                    minHeight: '100%'
                  }}
                >
                  {textContent.map((para, idx) => {
                    const isString = typeof para === 'string';
                    const text = isString ? para : para.text;
                    const isBold = !isString && para.isBold;
                    const isHeader = !isString && para.isHeader;

                    return (
                      <p key={idx} style={{
                        marginBottom: isHeader ? '1em' : '1.5em',
                        marginTop: isHeader ? '1.5em' : '0',
                        fontWeight: isBold ? 'bold' : 'normal',
                        fontSize: isHeader ? '1.4em' : '1em',
                        lineHeight: isHeader ? '1.3' : '1.8'
                      }}>
                        {text}
                      </p>
                    );
                  })}
                  <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.5, fontSize: '0.8em' }}>
                    --- Hết trang {pageNumber} ---
                  </div>
                </div>
              ) : (
                /* ORIGINAL PDF CANVAS RENDERING */
                <div
                  ref={pdfContentRef}
                  className="pdf-render-target"
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                />
              )}

              {/* Overlay layer cho highlights và annotations - ONLY visible in PDF mode */}
              {!isTextMode && (
                <div
                  className="annotation-overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: isAnnotationMode ? 'auto' : 'none',
                    zIndex: 2,
                  }}
                >
                  {/* Highlights */}
                  {currentPageAnnotations
                    .filter((ann) => ann.type === 'highlight')
                    .map((annotation) => {
                      if (!annotation.rect || !annotation.pageRect) return null;
                      const canvasContainer = canvasContainerRef.current;
                      if (!canvasContainer) return null;

                      const containerRect = canvasContainer.getBoundingClientRect();
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
                            backgroundColor: annotation.color || highlightColor,
                            opacity: 0.4,
                            pointerEvents: 'auto',
                            zIndex: 1,
                            cursor: 'pointer',
                          }}
                          title={annotation.text}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAnnotation(annotation);
                          }}
                        />
                      );
                    })}

                  {/* Annotation markers */}
                  {currentPageAnnotations
                    .filter((ann) => ann.type !== 'highlight')
                    .map((annotation) => (
                      <div
                        key={annotation.id}
                        className="annotation-marker"
                        style={{
                          position: 'absolute',
                          left: `${annotation.x}%`,
                          top: `${annotation.y}%`,
                          zIndex: 3,
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

                  {/* Annotation form */}
                  {annotationPosition && annotationPosition.page === pageNumber && (
                    <div
                      className="annotation-form"
                      style={{
                        position: 'absolute',
                        left: `${annotationPosition.x}%`,
                        top: `${annotationPosition.y}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <textarea
                        value={annotationText}
                        onChange={(e) => setAnnotationText(e.target.value)}
                        placeholder="Nhập ghi chú..."
                        autoFocus
                      />
                      <div className="annotation-form-buttons">
                        <button onClick={handleSaveAnnotation}>
                          {selectedAnnotation ? 'Cập nhật' : 'Lưu'}
                        </button>
                        <button
                          onClick={() => {
                            setAnnotationPosition(null);
                            setAnnotationText('');
                            setIsAnnotationMode(false);
                            setSelectedAnnotation(null);
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sidebar cho annotations và bookmarks */}
        {
          !isSidebarCollapsed && (
            <div className="annotations-sidebar">
              <div className="sidebar-header">
                <h3>Ghi chú & Bookmarks</h3>
                <button
                  className="sidebar-toggle"
                  onClick={() => setIsSidebarCollapsed(true)}
                  title="Thu gọn"
                >
                  ✕
                </button>
              </div>
              <div className="sidebar-content">
                {/* Bookmarks */}
                <div className="sidebar-section">
                  <h4>📑 Bookmarks ({bookmarks.length})</h4>
                  <div className="bookmarks-list">
                    {bookmarks.map((page) => (
                      <div
                        key={page}
                        className="bookmark-item"
                        onClick={() => setPageNumber(page)}
                      >
                        Trang {page}
                      </div>
                    ))}
                    {bookmarks.length === 0 && (
                      <div className="empty-state">Chưa có bookmark</div>
                    )}
                  </div>
                </div>

                {/* Annotations */}
                <div className="sidebar-section">
                  <h4>📝 Ghi chú ({annotations.length})</h4>
                  <div className="annotations-list">
                    {annotations.map((annotation) => (
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
                          {annotation.type === 'highlight' && (
                            <span
                              className="highlight-badge"
                              style={{ backgroundColor: annotation.color || highlightColor }}
                            >
                              Highlight
                            </span>
                          )}
                        </div>
                        {annotation.text && (
                          <div className="annotation-item-text">{annotation.text}</div>
                        )}
                      </div>
                    ))}
                    {annotations.length === 0 && (
                      <div className="empty-state">Chưa có ghi chú</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Sidebar toggle button khi collapsed - Đặt ở bottom để không che nội dung */}
        {
          isSidebarCollapsed && (
            <button
              className="sidebar-toggle-collapsed"
              onClick={() => setIsSidebarCollapsed(false)}
              title="Mở sidebar"
              style={{
                position: 'fixed',
                right: isMobile ? '15px' : '20px',
                bottom: isMobile ? '70px' : '80px',
                top: 'auto',
                transform: 'none',
              }}
            >
              📝
            </button>
          )
        }
      </div >

      {/* Text selection menu */}
      {
        textSelectionMenu && selectedText && (
          <div
            className="text-selection-menu"
            style={{
              position: 'fixed',
              left: `${textSelectionMenu.x}px`,
              top: `${textSelectionMenu.y}px`,
              transform: 'translateX(-50%)',
              zIndex: 1000,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="selection-menu-content">
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
                  title="Ghi chú"
                >
                  💬 Ghi chú
                </button>
                <div className="color-picker">
                  <label>Màu:</label>
                  <input
                    type="color"
                    value={highlightColor}
                    onChange={(e) => setHighlightColor(e.target.value)}
                    title="Chọn màu highlight"
                  />
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Bottom Controls - Fixed ở bottom trên mobile, luôn hiển thị */}
      <div
        className={`ereader-controls bottom-controls ${showControls ? 'visible' : 'hidden'}`}
        style={{
          zIndex: 100,
          // Trên mobile: luôn fixed ở bottom và luôn hiển thị
          // Trên desktop: relative và ẩn/hiện theo showControls
          position: isMobile ? 'fixed' : 'relative',
          width: '100%',
          bottom: isMobile ? '0' : 'auto',
          left: isMobile ? '0' : 'auto',
          // Trên mobile: luôn hiển thị, trên desktop: theo showControls
          display: isMobile ? 'flex' : (showControls ? 'flex' : 'none'),
          opacity: isMobile ? 1 : (showControls ? 1 : 0),
          visibility: isMobile ? 'visible' : (showControls ? 'visible' : 'hidden'),
          marginTop: isMobile ? '0' : 'auto',
          transition: 'opacity 0.3s ease, visibility 0.3s ease',
          pointerEvents: isMobile ? 'auto' : (showControls ? 'auto' : 'none'),
        }}
      >
        <div className="bottom-controls-content">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="nav-btn-minimal"
            title="Trang trước"
          >
            ←
          </button>
          <div className="progress-info-minimal">
            <span className="progress-text">{progress}%</span>
            <div className="progress-bar-bottom">
              <div
                className="progress-fill-bottom"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="nav-btn-minimal"
            title="Trang sau"
          >
            →
          </button>
          {/* Button annotation trên mobile - đặt ở bottom controls */}
          {isMobile && (
            <button
              onClick={() => setIsAnnotationMode(!isAnnotationMode)}
              className={`icon-btn ${isAnnotationMode ? 'active' : ''}`}
              title={isAnnotationMode ? 'Tắt chế độ ghi chú' : 'Bật chế độ ghi chú'}
            >
              {isAnnotationMode ? '✏️' : '📝'}
            </button>
          )}
        </div>
      </div>
    </div >
  );
}

export default PDFViewerDirect;
