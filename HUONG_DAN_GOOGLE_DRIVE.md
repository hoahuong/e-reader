# 🚀 Hướng dẫn Lấy Google Client ID - Đơn giản nhất!

## ⚡ Cách nhanh nhất (5 phút)

### Bước 1: Vào Google Cloud Console
👉 Truy cập: https://console.cloud.google.com/

### Bước 2: Tạo Project mới
1. Click vào dropdown **Project** ở trên cùng (bên cạnh logo Google Cloud)
2. Click **NEW PROJECT**
3. Đặt tên: `PDF Reader App` (hoặc tên gì cũng được)
4. Click **CREATE**
5. Chờ vài giây, sau đó chọn project vừa tạo

### Bước 3: Bật Google Drive API
1. Vào menu bên trái → **APIs & Services** → **Library**
2. Tìm kiếm: `Google Drive API`
3. Click vào **Google Drive API**
4. Click nút **ENABLE** (màu xanh)

### Bước 4: Tạo OAuth Consent Screen (Lần đầu tiên)
1. Vào **APIs & Services** → **OAuth consent screen**
2. Chọn **External** → Click **CREATE**
3. Điền thông tin:
   - **App name**: `PDF Reader` (hoặc tên bạn muốn)
   - **User support email**: Email của bạn
   - **Developer contact information**: Email của bạn
4. Click **SAVE AND CONTINUE**
5. Ở màn hình **Scopes**, click **ADD OR REMOVE SCOPES**
   - Tìm và chọn: `.../auth/drive.readonly`
   - Click **UPDATE** → **SAVE AND CONTINUE**
6. Ở màn hình **Test users** (nếu cần):
   - Click **ADD USERS**
   - Thêm email Google của bạn
   - Click **SAVE AND CONTINUE**
7. Click **BACK TO DASHBOARD**

### Bước 5: Tạo OAuth Client ID
1. Vào **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → Chọn **OAuth client ID**
3. Nếu hỏi **Application type**, chọn **Web application**
4. Điền thông tin:
   - **Name**: `PDF Reader Web Client`
   - **Authorized JavaScript origins**: 
     ```
     http://localhost:5173
     http://localhost:5174
     ```
   - **Authorized redirect URIs**: (Để trống)
5. Click **CREATE**
6. **QUAN TRỌNG**: Copy **Client ID** (sẽ có dạng: `123456789-abc...xyz.apps.googleusercontent.com`)
   - ⚠️ Chỉ hiển thị 1 lần, copy ngay!

### Bước 6: Tạo API Key (Tùy chọn nhưng khuyến nghị)
1. Vẫn ở trang **Credentials**
2. Click **+ CREATE CREDENTIALS** → Chọn **API key**
3. Copy **API Key** ngay (cũng chỉ hiển thị 1 lần)
4. (Tùy chọn) Click vào API key vừa tạo để restrict:
   - **Application restrictions**: HTTP referrers
   - **Website restrictions**: Thêm `http://localhost:5173/*`
   - **API restrictions**: Restrict to "Google Drive API"
   - Click **SAVE**

### Bước 7: Thêm vào file .env
1. Tạo file `.env` trong thư mục `pdf-reader-app/` (cùng cấp với `package.json`)
2. Thêm vào:
```env
VITE_GOOGLE_CLIENT_ID=paste-client-id-ở-đây
VITE_GOOGLE_API_KEY=paste-api-key-ở-đây
```

Ví dụ:
```env
VITE_GOOGLE_CLIENT_ID=123456789-abc123xyz.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=AIzaSyAbc123xyz...
```

### Bước 8: Restart server
```bash
# Dừng server (Ctrl+C)
# Sau đó chạy lại:
npm run dev
```

## ✅ Xong! Bây giờ bạn có thể:
1. Mở app → Thấy nút "🔐 Đăng nhập Google"
2. Click đăng nhập → Chọn Google account
3. Chọn folder hoặc file PDF từ Google Drive
4. Đọc PDF ngay!

## 🆘 Troubleshooting

### Lỗi: "redirect_uri_mismatch"
→ Kiểm tra lại **Authorized JavaScript origins** đã thêm `http://localhost:5173` chưa

### Lỗi: "Access blocked"
→ Kiểm tra OAuth consent screen đã thêm bạn vào **Test users** chưa (nếu ở chế độ Testing)

### Không thấy nút đăng nhập
→ Kiểm tra file `.env` có đúng tên biến `VITE_GOOGLE_CLIENT_ID` không
→ Restart server sau khi thêm `.env`

## 📸 Screenshots mô tả

### 1. Tạo Project
- Click dropdown Project → NEW PROJECT → Đặt tên → CREATE

### 2. Enable API
- APIs & Services → Library → Tìm "Google Drive API" → ENABLE

### 3. OAuth Consent Screen
- APIs & Services → OAuth consent screen → External → CREATE
- Điền App name, email → SAVE AND CONTINUE
- Thêm scope `drive.readonly` → SAVE AND CONTINUE

### 4. Tạo Client ID
- APIs & Services → Credentials → CREATE CREDENTIALS → OAuth client ID
- Web application → Điền Name, Origins → CREATE
- **COPY CLIENT ID ngay!**

### 5. Tạo API Key
- Credentials → CREATE CREDENTIALS → API key
- **COPY API KEY ngay!**

---

**Mất khoảng 5-10 phút để setup xong!** 🎉
