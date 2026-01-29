# Hướng dẫn Thêm Test User vào Google Cloud Console

## Vấn đề
Nếu bạn thấy lỗi "Access blocked: reader-online has not completed the Google verification process" hoặc "The app is currently being tested, and can only be accessed by developer-approved testers", bạn cần thêm email vào danh sách Test Users.

## Cách thêm Test User

### Bước 1: Vào OAuth Consent Screen
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project **reader-online** (hoặc project của bạn)
3. Vào **APIs & Services** → **OAuth consent screen**

### Bước 2: Thêm Test Users
1. Scroll xuống phần **Test users**
2. Click nút **+ ADD USERS**
3. Nhập email: `gnouh.it@gmail.com`
4. Click **ADD**
5. **Lưu ý**: Nếu có nhiều email cần thêm, nhập từng email một hoặc cách nhau bằng dấu phẩy

### Bước 3: Kiểm tra App Status
- **Publishing status**: Phải là "Testing" (không phải "In production")
- **User type**: Có thể là "External" hoặc "Internal" (nếu dùng Google Workspace)

### Bước 4: Đảm bảo Scopes đã được thêm
Trong OAuth consent screen, phần **Scopes** phải có:
- `https://www.googleapis.com/auth/drive.readonly`

### Bước 5: Test lại
1. Đăng xuất khỏi Google (nếu đã đăng nhập)
2. Refresh trang app
3. Click "Đăng nhập Google Drive"
4. Chọn account `gnouh.it@gmail.com`
5. Cho phép truy cập Drive

## Lưu ý quan trọng

### Nếu vẫn không được:
1. **Kiểm tra Authorized JavaScript origins**:
   - Vào **APIs & Services** → **Credentials**
   - Click vào OAuth 2.0 Client ID của bạn
   - Đảm bảo có:
     - `http://localhost:5173` (cho local dev)
     - `https://reader-online.vercel.app` (cho production)
   - Click **Save**

2. **Kiểm tra Redirect URIs** (nếu dùng redirect flow):
   - Thêm:
     - `http://localhost:5173`
     - `https://reader-online.vercel.app`

3. **Clear browser cache và cookies**:
   - Xóa cookies của `accounts.google.com`
   - Thử lại

### Nếu muốn publish app (cho mọi người dùng):
1. Vào **OAuth consent screen**
2. Click **PUBLISH APP**
3. Điền đầy đủ thông tin:
   - App name
   - User support email
   - Developer contact information
   - Privacy policy URL (bắt buộc)
   - Terms of service URL (bắt buộc)
4. Submit for verification (có thể mất vài ngày)

**Nhưng với use case cá nhân, chỉ cần thêm Test Users là đủ!**

## Email cần thêm
- `gnouh.it@gmail.com` ✅
