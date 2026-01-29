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

### 3. **Lỗi 504: Gateway Timeout**

#### Nguyên nhân:
- **Vercel Hobby plan**: Function timeout mặc định 10s, có thể config lên 60s
- File quá lớn (> 5MB) upload chậm
- Network chậm

#### Fix:
- ✅ **Đã fix**: Function timeout đã được tăng lên 60s trong code
- Upload file nhỏ hơn 5MB để đảm bảo thành công
- App sẽ tự động fallback về IndexedDB nếu timeout
- Kiểm tra kết nối mạng

#### Giới hạn Vercel Hobby:
- **Function timeout**: 10s default → 60s max (đã config)
- **Blob Storage**: 1GB/month, 2,000 advanced operations/month
- **Khuyến nghị**: Upload file < 5MB để tránh timeout

### 4. **Lỗi: "File size quá lớn"**

#### Giới hạn:
- **Khuyến nghị**: < 5MB để tránh timeout trên Hobby plan
- **Tối đa**: 10MB (sẽ có warning)

#### Fix:
- Nén PDF trước khi upload
- Hoặc upgrade lên Pro plan (timeout lên đến 300s)

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
- File quá lớn (> 5MB)
- Network chậm
- Vercel function timeout (10s default, 60s max cho Hobby)

#### Fix:
- ✅ **Đã fix**: Timeout đã được tăng lên 60s
- Giảm file size xuống < 5MB
- Kiểm tra network connection
- App sẽ tự động fallback về IndexedDB nếu timeout
- Upgrade lên Pro plan để có timeout lên đến 300s

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
- [ ] Function timeout đã được config (60s cho Hobby plan)
- [ ] Đã test upload local với `vercel dev`
- [ ] Đã kiểm tra file size khuyến nghị < 5MB

## ⚠️ Lưu ý cho Vercel Hobby Plan

### Giới hạn:
- **Function timeout**: 10s default → **60s max** (đã config trong code)
- **Blob Storage**: 1GB/month, 2,000 operations/month
- **Khuyến nghị file size**: < 5MB để tránh timeout

### Fallback tự động:
- Nếu upload timeout hoặc fail → App tự động fallback về IndexedDB (local storage)
- File vẫn được lưu và có thể đọc, nhưng chỉ trên browser hiện tại
- Không sync giữa các devices

### Upgrade lên Pro nếu:
- Cần upload file lớn hơn (> 5MB)
- Cần timeout dài hơn (lên đến 300s)
- Cần nhiều storage hơn

## 🔗 Tài liệu tham khảo

- [Vercel Blob Storage Docs](https://vercel.com/docs/storage/vercel-blob)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
