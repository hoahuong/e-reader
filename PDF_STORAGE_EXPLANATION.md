# Nơi lưu các file PDF đã upload

## 📍 PDF Files được lưu ở đâu?

### 1. **Vercel Blob Storage** (Cloud) ⭐ Chính

**Khi nào:**
- File PDF ≤ 10MB
- Upload thành công qua API `/api/upload-pdf`

**Nơi lưu:**
- **Vercel Blob Storage** (cloud storage của Vercel)
- Path: `pdfs/{timestamp}-{filename}.pdf`
- URL công khai: `https://{blob-id}.public.blob.vercel-storage.com/pdfs/...`

**Ưu điểm:**
- ✅ Sync giữa tất cả thiết bị
- ✅ Có thể truy cập từ mọi nơi qua URL
- ✅ Không tốn dung lượng browser
- ✅ Free tier: 1GB storage

**Ví dụ:**
```
File: document.pdf
→ Upload lên: pdfs/1769691234567-document.pdf
→ URL: https://abc123.public.blob.vercel-storage.com/pdfs/1769691234567-document.pdf
```

### 2. **IndexedDB** (Local Browser) - Fallback hoặc Cache

**Khi nào:**
- File PDF > 10MB → Tự động fallback về IndexedDB
- Upload lên Vercel Blob fail/timeout → Fallback về IndexedDB
- Local development (API không khả dụng)

**Nơi lưu:**
- **IndexedDB** trong browser của user
- Database name: `PDFReaderDB`
- Store name: `pdfs`
- Lưu toàn bộ file dưới dạng ArrayBuffer

**Nhược điểm:**
- ❌ Chỉ có trên thiết bị đó (không sync)
- ❌ Tốn dung lượng browser
- ❌ Có thể mất nếu clear browser data
- ❌ Giới hạn dung lượng browser (thường 50-100MB)

**Metadata được cache:**
- Ngay cả khi file lưu trên Vercel Blob
- Metadata (id, name, url, catalog) vẫn được cache trong IndexedDB
- Giúp load danh sách nhanh hơn

## 🔄 Flow Upload PDF:

```
User upload PDF
    ↓
Kiểm tra file size
    ↓
≤ 10MB? ──Yes──→ Upload lên Vercel Blob Storage
    │                    ↓
    No              Thành công?
    │                    │
    ↓                    Yes ──→ Cache metadata vào IndexedDB
    │                    │              ↓
    ↓                    No ──→ Fallback về IndexedDB
    │                    │
    └────────────────────┘
         ↓
    Lưu toàn bộ file vào IndexedDB
```

## 📊 So sánh:

| Tính năng | Vercel Blob | IndexedDB |
|----------|-------------|-----------|
| **Nơi lưu** | Cloud (Vercel) | Local Browser |
| **Sync thiết bị** | ✅ Có | ❌ Không |
| **Dung lượng** | 1GB free | ~50-100MB |
| **Tốc độ** | Phụ thuộc network | Rất nhanh |
| **Mất data** | ❌ Không | ✅ Có thể (clear browser) |
| **File size limit** | Không giới hạn | ~10MB+ |

## 🔍 Kiểm tra file đã upload ở đâu:

### Trong Code:
```javascript
// Xem trong IndexedDB
const files = await listPdfs();
files.forEach(file => {
  if (file.isLocal) {
    console.log('File lưu trong IndexedDB:', file.name);
  } else {
    console.log('File lưu trên Vercel Blob:', file.url);
  }
});
```

### Trong Browser DevTools:
1. Mở DevTools (F12)
2. Vào **Application** tab
3. **Storage** → **IndexedDB** → **PDFReaderDB** → **pdfs**
4. Xem các records:
   - `isLocal: false` → File trên Vercel Blob
   - `isLocal: true` → File trong IndexedDB

## 💡 Lưu ý:

1. **Metadata luôn được cache trong IndexedDB** (dù file ở đâu)
   - Giúp load danh sách nhanh
   - Không cần fetch từ cloud mỗi lần

2. **File trên Vercel Blob có thể truy cập công khai**
   - URL là public
   - Ai có URL đều có thể download

3. **File trong IndexedDB chỉ có trên thiết bị đó**
   - Không sync giữa thiết bị
   - Mất nếu clear browser data

## 🎯 Kết luận:

**PDF Files được lưu ở:**
- ✅ **Vercel Blob Storage** (cloud) - Chính, sync giữa thiết bị
- ✅ **IndexedDB** (local browser) - Fallback hoặc cache metadata

**Metadata (catalog, file list) được lưu ở:**
- ✅ **IndexedDB** (local cache)
- ✅ **GitHub API** (cloud sync) - Hiện tại đang dùng
