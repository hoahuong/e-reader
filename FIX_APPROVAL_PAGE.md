# 🔧 Sửa lỗi "Xoay vòng" ở Legacy Approval Page

## ❌ Vấn đề:
Sau khi authorize, bạn đang ở trang `https://accounts.google.com/signin/oauth/legacy/approval?...` và cứ loading mãi không về app.

## 🔍 Nguyên nhân:

1. **Popup bị block** → Google redirect đến approval page thay vì popup
2. **Redirect URI không khớp** → Google không biết redirect về đâu
3. **Chưa thêm Redirect URI** vào Google Cloud Console

## ✅ Giải pháp:

### Bước 1: Thêm Redirect URI vào Google Cloud Console

**QUAN TRỌNG**: Ngay cả khi dùng popup flow, vẫn cần có redirect URI!

1. Vào **Google Cloud Console**: https://console.cloud.google.com/
2. Chọn project của bạn
3. Vào **APIs & Services** → **Credentials**
4. Click vào **OAuth Client ID** của bạn
5. Trong phần **Authorized redirect URIs**, thêm:
   ```
   http://localhost:5173
   http://localhost:5173/
   ```
6. Click **SAVE**

### Bước 2: Cho phép Popup trong trình duyệt

1. Khi click "Đăng nhập Google", xem có thông báo popup bị block không
2. Click vào icon popup blocker ở thanh địa chỉ
3. Cho phép popup từ `localhost:5173`

### Bước 3: Xóa cache và thử lại

1. **Đóng tab approval page** đang bị kẹt
2. **Xóa localStorage**:
   - Mở Console (F12)
   - Chạy: `localStorage.clear()`
3. **Refresh trang app** (F5)
4. **Thử đăng nhập lại**

### Bước 4: Nếu vẫn không được - Dùng Incognito Mode

1. Mở **Incognito/Private window**
2. Vào `http://localhost:5173`
3. Thử đăng nhập lại
4. Popup blocker ít strict hơn trong incognito mode

## 🔄 Cách hoạt động đúng:

1. Click "Đăng nhập Google"
2. **Popup mở** với Google login (KHÔNG phải redirect)
3. Đăng nhập và authorize
4. **Popup tự đóng**
5. **Callback được gọi** → Token được lưu
6. App tiếp tục → List folders

## ⚠️ Nếu đang ở Legacy Approval Page:

1. **Đóng tab đó ngay**
2. **Quay về app**
3. **Xóa localStorage**: `localStorage.clear()`
4. **Thêm Redirect URI** vào Google Cloud Console (Bước 1)
5. **Đợi 1-2 phút** để Google cập nhật
6. **Thử lại**

## 🐛 Debug:

Mở Console (F12) và kiểm tra:
- Có log "Requesting new access token..." không?
- Có log "OAuth callback received" không?
- Có lỗi gì không?

---

**Sau khi thêm Redirect URI và cho phép popup, thử lại!** ✅
