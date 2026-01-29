# Hướng dẫn Setup Google Drive Integration

## Bước 1: Tạo Google Cloud Project

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Ghi nhớ **Project ID**

## Bước 2: Enable Google Drive API

1. Vào **APIs & Services** → **Library**
2. Tìm "Google Drive API"
3. Click **Enable**

## Bước 3: Tạo OAuth 2.0 Credentials

1. Vào **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Nếu chưa có OAuth consent screen:
   - Chọn **External** (hoặc Internal nếu dùng Google Workspace)
   - Điền thông tin: App name, User support email, Developer contact
   - Thêm scopes: `https://www.googleapis.com/auth/drive.readonly`
   - Thêm test users (nếu ở chế độ Testing)
   - Save và Continue

4. Tạo OAuth Client ID:
   - **Application type**: Web application
   - **Name**: PDF Reader App (hoặc tên bạn muốn)
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (cho local dev)
     - `http://localhost:5174` (nếu port khác)
     - `https://your-domain.vercel.app` (cho production)
   - **Authorized redirect URIs**: (không cần thiết cho client-side OAuth)
   - Click **Create**

5. Copy **Client ID** (sẽ có dạng: `xxxxx.apps.googleusercontent.com`)

## Bước 4: Tạo API Key (Optional nhưng khuyến nghị)

1. Vào **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API key**
3. Copy **API Key**
4. (Optional) Restrict API key:
   - Click vào API key vừa tạo
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: Thêm domains của bạn
   - **API restrictions**: Restrict to "Google Drive API"
   - Save

## Bước 5: Cấu hình Environment Variables

Tạo file `.env` trong thư mục root của project:

```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-api-key
```

**Lưu ý**: 
- Với Vite, biến môi trường phải bắt đầu bằng `VITE_` để được expose ra client
- Không commit file `.env` vào git (đã có trong `.gitignore`)

## Bước 6: Thêm vào Vercel (nếu deploy)

1. Vào Vercel Dashboard → Project → Settings → Environment Variables
2. Thêm:
   - `VITE_GOOGLE_CLIENT_ID` = your-client-id
   - `VITE_GOOGLE_API_KEY` = your-api-key
3. Redeploy project

## Bước 7: Test

1. Chạy `npm run dev`
2. Mở app trong browser
3. Click "Đăng nhập Google"
4. Chọn Google account và authorize
5. Chọn folder từ Google Drive
6. Click vào PDF file để load và đọc

## Troubleshooting

### Lỗi: "VITE_GOOGLE_CLIENT_ID không được cấu hình"

- Kiểm tra file `.env` có đúng tên biến không
- Đảm bảo biến bắt đầu bằng `VITE_`
- Restart dev server sau khi thêm `.env`

### Lỗi: "redirect_uri_mismatch"

- Kiểm tra Authorized JavaScript origins trong Google Cloud Console
- Đảm bảo đã thêm đúng URL (http://localhost:5173 hoặc domain production)

### Lỗi: "Access blocked: This app's request is invalid"

- Kiểm tra OAuth consent screen đã được publish hoặc thêm test users
- Đảm bảo scopes đã được thêm: `https://www.googleapis.com/auth/drive.readonly`

### Lỗi: "API key not valid"

- Kiểm tra API key đã được tạo và copy đúng
- Nếu đã restrict API key, đảm bảo domain/API đã được thêm vào restrictions

## Security Notes

- **API Key**: Có thể public nhưng nên restrict theo domain và API
- **Client ID**: Có thể public (OAuth 2.0 client-side flow)
- **Access Token**: Được lưu trong localStorage, tự động expire sau 1 giờ
- **Scopes**: Chỉ request `drive.readonly` - chỉ đọc, không thể chỉnh sửa/xóa files

## Features

- ✅ Login với Google OAuth 2.0
- ✅ List folders từ Google Drive
- ✅ List PDF files trong folder
- ✅ Download và đọc PDF từ Google Drive
- ✅ Tự động logout khi token expire
- ✅ Responsive UI
