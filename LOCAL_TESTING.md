# Hướng dẫn Test Local

## Cách 1: Test với IndexedDB (Không cần Vercel Blob)

**Đơn giản nhất** - App sẽ tự động fallback về IndexedDB khi không có API route:

```bash
npm install
npm run dev
```

- Upload PDF sẽ lưu vào IndexedDB (local browser storage)
- Danh sách PDF sẽ hiển thị từ IndexedDB
- **Lưu ý**: Chỉ hoạt động trên cùng một trình duyệt/thiết bị

## Cách 2: Test với Vercel Blob (Giống Production)

### Bước 1: Cài đặt Vercel CLI

```bash
npm install -g vercel
```

### Bước 2: Login vào Vercel

```bash
vercel login
```

### Bước 3: Link project với Vercel

```bash
cd pdf-reader-app
vercel link
```

Chọn:
- Project: Chọn project đã tạo trên Vercel (hoặc tạo mới)
- Directory: `./`

### Bước 4: Lấy Environment Variables

```bash
vercel env pull .env.local
```

File `.env.local` sẽ chứa `BLOB_READ_WRITE_TOKEN` từ Vercel.

### Bước 5: Chạy local với Vercel Dev

```bash
vercel dev
```

Hoặc nếu muốn dùng Vite dev server nhưng có API routes:

```bash
# Terminal 1: Chạy Vercel dev (cho API routes)
vercel dev --listen 3001

# Terminal 2: Chạy Vite dev (cho frontend)
npm run dev
```

Sau đó cấu hình proxy trong `vite.config.js`:

```js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
}
```

### Bước 6: Test

1. Mở `http://localhost:5173` (hoặc port Vite)
2. Upload một PDF
3. Kiểm tra trong Vercel Dashboard → Storage để thấy file đã upload

## Cách 3: Test với Mock API (Development)

Nếu không muốn setup Vercel CLI, có thể tạo mock API routes trong `vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/upload-pdf': {
        target: 'http://localhost:3000',
        // Hoặc mock response
      },
    },
  },
});
```

## Troubleshooting

### Lỗi: "Cannot find module '@vercel/blob'"

```bash
npm install @vercel/blob
```

### API routes không hoạt động khi chạy `npm run dev`

- Vite dev server không tự động chạy API routes trong `/api/`
- Giải pháp: Dùng `vercel dev` hoặc fallback về IndexedDB (tự động)

### Lỗi: "BLOB_READ_WRITE_TOKEN is not defined"

- Khi test local với Vercel Blob, cần token từ Vercel
- Giải pháp: Dùng `vercel env pull` hoặc test với IndexedDB mode (tự động fallback)

## Khuyến nghị

**Cho development nhanh**: Dùng **Cách 1** (IndexedDB) - không cần setup gì, app tự động hoạt động.

**Cho test giống production**: Dùng **Cách 2** (Vercel CLI) - cần setup nhưng giống môi trường production nhất.
