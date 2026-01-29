# Troubleshooting: Metadata không sync giữa các thiết bị

## Vấn đề: Trên điện thoại không load được data giống máy tính

### Nguyên nhân có thể:

1. **File metadata.json chưa được tạo trên GitHub**
   - Metadata chỉ được lưu lên GitHub khi bạn tạo catalog hoặc upload file trên máy tính
   - Nếu chưa có file trên GitHub, điện thoại sẽ không có gì để sync

2. **GitHub API timeout**
   - Mobile network có thể chậm hơn WiFi
   - GitHub API có thể mất thời gian để phản hồi

3. **Code chưa được deploy hoặc browser cache**
   - Browser có thể đang dùng code cũ từ cache

## Cách kiểm tra và sửa:

### Bước 1: Kiểm tra xem metadata đã được lưu lên GitHub chưa

1. Vào GitHub repo: https://github.com/hoahuong/e-reader
2. Kiểm tra xem có folder `data/` và file `data/metadata.json` không
3. Nếu chưa có, bạn cần tạo catalog hoặc upload file trên máy tính để trigger save

### Bước 2: Tạo metadata ban đầu trên máy tính

1. Mở app trên máy tính
2. Vào "Quản lý file" (File Manager)
3. Tạo một catalog mới hoặc upload một file PDF
4. Đợi vài giây để metadata được lưu lên GitHub
5. Kiểm tra console log xem có thông báo "Lưu thành công" không

### Bước 3: Kiểm tra trên điện thoại

1. **Clear cache và reload**:
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Safari: Settings → Safari → Clear History and Website Data

2. **Mở app trên điện thoại**:
   - Vào "Quản lý file"
   - Xem console log (nếu có thể)
   - Tìm các log: `[Metadata Sync GitHub]` và `[FileManager]`

3. **Kiểm tra logs**:
   - Nếu thấy "File metadata chưa tồn tại trên GitHub" → Metadata chưa được lưu từ máy tính
   - Nếu thấy "Request timeout" → GitHub API chậm, cần đợi hoặc retry

### Bước 4: Manual Sync (nếu có button Sync)

1. Vào File Manager
2. Click nút "🔄 Sync"
3. Đợi vài giây
4. Kiểm tra xem có sync được không

## Giải pháp tạm thời:

Nếu GitHub API vẫn timeout, bạn có thể:

1. **Chuyển sang Local Storage**:
   - Sửa `src/metadataSyncConfig.js`
   - Đổi `STORAGE_TYPE = 'local'`
   - Metadata sẽ chỉ lưu local, không sync giữa các thiết bị

2. **Dùng Vercel Blob** (nếu đã setup):
   - Đổi `STORAGE_TYPE = 'vercel-blob'`
   - Cần set `BLOB_READ_WRITE_TOKEN` trên Vercel

## Debug trên Mobile:

### Chrome DevTools (Android):
1. Kết nối điện thoại qua USB
2. Mở Chrome trên máy tính
3. Vào `chrome://inspect`
4. Chọn device và click "Inspect"
5. Xem Console tab để xem logs

### Safari Web Inspector (iOS):
1. Settings → Safari → Advanced → Web Inspector (bật)
2. Kết nối iPhone qua USB
3. Mở Safari trên Mac
4. Develop → [Your iPhone] → [Your Website]
5. Xem Console để debug

## Kiểm tra API trực tiếp:

Test API endpoint:
```bash
curl https://reader-online.vercel.app/api/github-metadata
```

Nếu trả về empty metadata `{"catalogs":[],"files":[],"lastSync":null}` → File chưa tồn tại trên GitHub

## Next Steps:

1. ✅ Tạo catalog/file trên máy tính để trigger save metadata lên GitHub
2. ✅ Clear cache trên điện thoại và reload
3. ✅ Kiểm tra logs trên điện thoại
4. ✅ Nếu vẫn không được, thử manual sync hoặc chuyển sang local storage
