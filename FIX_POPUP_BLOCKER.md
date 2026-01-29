# 🔧 Sửa lỗi Popup Blocker - Chuyển sang Redirect Flow

## ❌ Lỗi bạn gặp:
```
Failed to open popup window... Maybe blocked by the browser?
```

## ✅ Giải pháp: Dùng Redirect Flow

Tôi đã cập nhật code để tự động chuyển sang **Redirect Flow** khi popup bị block.

### Bước 1: Thêm Redirect URI vào Google Cloud Console

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

### Bước 2: Refresh và thử lại

1. **Refresh trình duyệt** (F5)
2. Click **"🔐 Đăng nhập Google"**
3. Nếu popup bị block, app sẽ tự động redirect đến Google
4. Sau khi authorize, bạn sẽ được redirect về app
5. Token sẽ được lưu tự động

## 🔄 Cách hoạt động:

1. **Popup Flow** (ưu tiên):
   - Thử mở popup để đăng nhập
   - Nếu thành công → Hoàn tất

2. **Redirect Flow** (fallback):
   - Nếu popup bị block → Tự động redirect đến Google
   - Sau khi authorize → Redirect về app với token
   - Token được lưu và app tiếp tục

## ⚠️ Lưu ý:

- **Redirect URI** phải khớp chính xác với URL trong Google Cloud Console
- Nếu deploy lên production, nhớ thêm production URL vào redirect URIs
- Token sẽ được lưu trong localStorage và tự động dùng lại

## ✅ Sau khi setup:

1. Thêm redirect URI vào Google Cloud Console
2. Refresh trình duyệt
3. Click đăng nhập → Sẽ redirect đến Google (không còn popup)
4. Authorize → Tự động quay về app
5. Xong! 🎉

---

**Popup blocker sẽ không còn là vấn đề nữa!** ✅
