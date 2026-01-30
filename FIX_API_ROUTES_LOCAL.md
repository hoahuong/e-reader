# 🔧 Fix: API Routes không hoạt động ở Local

## ❌ Vấn đề

Khi chạy `npm run dev` (Vite), API routes trong `/api/` trả về source code thay vì JSON response.

**Nguyên nhân**: Vite dev server không tự động execute API routes như Vercel serverless functions.

## ✅ Giải pháp

### Cách 1: Sử dụng Vercel CLI (Khuyến nghị)

```bash
# Cài đặt Vercel CLI (nếu chưa có)
npm install -g vercel

# Login vào Vercel
vercel login

# Link project
vercel link

# Chạy dev server với API routes support
vercel dev
```

Vercel dev sẽ:
- ✅ Serve frontend (React app)
- ✅ Execute API routes như serverless functions
- ✅ Load environment variables từ Vercel
- ✅ Giống môi trường production nhất

### Cách 2: Proxy trong Vite (Đã cấu hình)

Đã thêm proxy trong `vite.config.js` để forward API requests đến Vercel dev server:

```js
proxy: {
  '/api': {
    target: process.env.VERCEL_DEV_URL || 'http://localhost:3000',
    changeOrigin: true,
  },
}
```

**Cách dùng**:
1. Terminal 1: `vercel dev --listen 3000`
2. Terminal 2: `npm run dev`

### Cách 3: Fallback về IndexedDB (Tự động)

App đã có logic tự động fallback về IndexedDB khi API routes không khả dụng:

- ✅ Upload PDF → Lưu vào IndexedDB
- ✅ Load metadata → Đọc từ IndexedDB
- ✅ Không cần setup gì thêm

**Lưu ý**: Chỉ hoạt động trên cùng browser/device, không sync cross-device.

## 📝 Đã sửa

1. ✅ **vercel.json**: Exclude API routes khỏi rewrite rule
   ```json
   "rewrites": [
     {
       "source": "/((?!api/).*)",
       "destination": "/index.html"
     }
   ]
   ```

2. ✅ **vite.config.js**: Thêm proxy cho API routes
   ```js
   proxy: {
     '/api': {
       target: 'http://localhost:3000',
       changeOrigin: true,
     },
   }
   ```

## 🎯 Khuyến nghị

**Cho development nhanh**: Dùng **Cách 3** (Fallback IndexedDB) - không cần setup, app tự động hoạt động.

**Cho test giống production**: Dùng **Cách 1** (Vercel CLI) - cần setup nhưng giống môi trường production nhất.

## 🔍 Troubleshooting

### Lỗi: "Cannot find module '@vercel/kv'"
```bash
npm install @vercel/kv
```

### API routes vẫn trả về source code
- Đảm bảo đang dùng `vercel dev` hoặc proxy đã được config
- Kiểm tra `vercel.json` có exclude API routes khỏi rewrite không

### Environment variables không load
```bash
vercel env pull .env.local
```
