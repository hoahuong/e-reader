# Các cách cấu hình PDF.js Worker

Ứng dụng này hỗ trợ nhiều cách cấu hình PDF.js worker. File hiện tại đang dùng **unpkg CDN** (đã test và hoạt động).

## Cách hiện tại (Đang dùng)

**File:** `src/pdfWorkerConfig.js`

Sử dụng unpkg CDN - đã verify hoạt động với version 5.4.296:
```javascript
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
```

## Các cách khác

### Cách 1: jsdelivr CDN
Thay đổi trong `src/pdfWorkerConfig.js`:
```javascript
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
```

### Cách 2: Public folder (Local)
1. Đảm bảo file `public/pdf.worker.min.mjs` tồn tại
2. Thay đổi trong `src/pdfWorkerConfig.js`:
```javascript
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
```

### Cách 3: Import từ node_modules (Vite)
Thay đổi trong `src/pdfWorkerConfig.js`:
```javascript
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();
```

### Cách 4: Dùng file config thay thế
1. Đổi import trong `src/components/PDFViewer.jsx`:
```javascript
// Thay dòng này:
import '../pdfWorkerConfig';
// Thành:
import '../pdfWorkerConfigAlt';
```

## Kiểm tra worker đã load

Mở Console (F12) và xem log:
- `PDF Worker configured with: ...` - Worker đã được cấu hình
- Nếu có lỗi 404: Worker không tìm thấy, thử cách khác

## Troubleshooting

1. **Lỗi 404**: Worker không tìm thấy
   - Thử cách khác trong danh sách trên
   - Kiểm tra version pdfjs: `console.log(pdfjs.version)`

2. **Lỗi CORS**: Nếu dùng CDN
   - Chuyển sang dùng public folder (Cách 2)

3. **Lỗi trong production build**
   - Đảm bảo worker file được copy vào `dist/`
   - Hoặc dùng CDN (Cách 1 hoặc 2)
