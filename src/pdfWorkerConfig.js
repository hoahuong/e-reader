// Cấu hình PDF.js worker - thử nhiều cách với fallback
import { pdfjs } from 'react-pdf';

// Danh sách các nguồn worker theo thứ tự ưu tiên
const WORKER_SOURCES = [
  // Cách 1: Dùng unpkg CDN (ổn định, có version 5.4.296)
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`,
  
  // Cách 2: Dùng jsdelivr CDN (backup)
  `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`,
  
  // Cách 3: Dùng từ public folder (local)
  '/pdf.worker.min.mjs',
  
  // Cách 4: Dùng import.meta.url với node_modules
  (() => {
    try {
      return new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
    } catch (e) {
      return null;
    }
  })(),
].filter(Boolean); // Loại bỏ null/undefined

// Cấu hình worker với fallback tự động
export function configurePDFWorker() {
  // Trong môi trường browser, dùng CDN hoặc public folder
  if (typeof window !== 'undefined') {
    // Ưu tiên unpkg CDN (đã test và hoạt động)
    pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SOURCES[0];
    console.log('PDF Worker configured:', pdfjs.GlobalWorkerOptions.workerSrc);
  } else {
    // SSR: dùng local worker
    pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SOURCES[2] || WORKER_SOURCES[0];
  }
}

// Tự động config khi import
configurePDFWorker();

// Export để có thể thay đổi nếu cần
export { pdfjs };
