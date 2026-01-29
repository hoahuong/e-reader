# Troubleshooting Upload PDF trên Vercel

## 🔍 Các vấn đề thường gặp và cách fix

### 1. **Upload không hoạt động - "Đứng ở đó"**

#### Nguyên nhân có thể:
- ❌ API route không được deploy
- ❌ Thiếu `BLOB_READ_WRITE_TOKEN` trong environment variables
- ❌ File size quá lớn (> 4.5MB cho free tier)
- ❌ Lỗi network hoặc timeout

#### Cách kiểm tra:

1. **Kiểm tra API route đã được deploy:**
   ```bash
   # Vào Vercel Dashboard → Project → Functions
   # Kiểm tra xem có `/api/upload-pdf` không
   ```

2. **Kiểm tra Environment Variables:**
   ```bash
   # Vào Vercel Dashboard → Project → Settings → Environment Variables
   # Phải có: BLOB_READ_WRITE_TOKEN
   ```

3. **Kiểm tra Vercel Blob Store:**
   ```bash
   # Vào Vercel Dashboard → Storage
   # Phải có Blob store đã được tạo
   ```

4. **Kiểm tra Console Logs:**
   ```bash
   # Vào Vercel Dashboard → Project → Logs
   # Xem có lỗi gì khi upload không
   ```

### 2. **Lỗi: "Thiếu cấu hình Vercel Blob Storage"**

#### Fix:
1. Tạo Blob Store trong Vercel Dashboard:
   - Vào **Storage** → **Create Database** → Chọn **Blob**
   - Đặt tên (ví dụ: `pdf-storage`)
   - Chọn region

2. Token sẽ tự động được inject vào environment variables

3. Redeploy project:
   ```bash
   git push
   # Hoặc
   vercel --prod
   ```

### 3. **Lỗi: "File size quá lớn"**

#### Giới hạn:
- **Free tier**: 4.5MB per request
- **Pro tier**: 4.5MB per request (có thể tăng với config)

#### Fix:
- Nén PDF trước khi upload
- Hoặc upgrade plan

### 4. **Upload thành công nhưng không hiển thị trong danh sách**

#### Nguyên nhân:
- IndexedDB cache không được update
- Lỗi khi lưu metadata vào IndexedDB

#### Fix:
- Refresh trang
- Clear browser cache và thử lại
- Kiểm tra Console để xem có lỗi IndexedDB không

### 5. **API route trả về 404**

#### Nguyên nhân:
- File API route không nằm đúng vị trí
- Vercel không nhận diện được API route

#### Fix:
- Đảm bảo file nằm trong `/api/upload-pdf.js` (root của project)
- Kiểm tra `vercel.json` nếu có
- Redeploy project

### 6. **Upload chậm hoặc timeout**

#### Nguyên nhân:
- File quá lớn
- Network chậm
- Vercel function timeout (10s cho free tier)

#### Fix:
- Giảm file size
- Kiểm tra network connection
- Upgrade plan để có timeout dài hơn

## 🛠️ Debug Steps

### Bước 1: Kiểm tra API route hoạt động

Mở browser console và chạy:
```javascript
fetch('/api/upload-pdf', { method: 'POST' })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

Nếu trả về `405 Method not allowed` → API route hoạt động ✅
Nếu trả về `404` → API route không được deploy ❌

### Bước 2: Kiểm tra Environment Variables

Vào Vercel Dashboard → Settings → Environment Variables:
- Phải có `BLOB_READ_WRITE_TOKEN`
- Nếu không có → Tạo Blob Store

### Bước 3: Kiểm tra Logs

Vào Vercel Dashboard → Project → Logs:
- Xem có lỗi gì khi upload không
- Copy error message và search trên Google

### Bước 4: Test với file nhỏ

Thử upload file PDF nhỏ (< 1MB) để xem có phải vấn đề file size không.

## 📝 Checklist trước khi deploy

- [ ] Đã tạo Vercel Blob Store
- [ ] Environment variable `BLOB_READ_WRITE_TOKEN` đã được set tự động
- [ ] File `/api/upload-pdf.js` tồn tại và đúng format
- [ ] Đã test upload local với `vercel dev`
- [ ] Đã kiểm tra file size không quá 4.5MB

## 🔗 Tài liệu tham khảo

- [Vercel Blob Storage Docs](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
