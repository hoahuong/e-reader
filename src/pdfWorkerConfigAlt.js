// CÁCH KHÁC: Sử dụng import với ?url query parameter
// Đây là cách được Vite khuyến nghị cho static assets

import { pdfjs } from 'react-pdf';

// Cách A: Import worker như một module với ?url
// Lưu ý: Cần cấu hình Vite để xử lý file .mjs từ node_modules
let workerUrl = null;

try {
  // Thử import worker từ node_modules với ?url
  workerUrl = new URL(
    '../node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href;
} catch (e) {
  // Fallback
  console.warn('Could not resolve worker with ?url, using CDN');
}

// Cách B: Dùng CDN (unpkg - đã test và hoạt động)
const CDN_WORKER = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Cách C: Dùng từ public folder
const PUBLIC_WORKER = '/pdf.worker.min.mjs';

// Cấu hình với thứ tự ưu tiên
export function configureWorker() {
  // Ưu tiên 1: CDN (unpkg - đã verify hoạt động)
  pdfjs.GlobalWorkerOptions.workerSrc = CDN_WORKER;
  
  console.log('PDF Worker configured with:', CDN_WORKER);
  console.log('PDF.js version:', pdfjs.version);
}

configureWorker();
