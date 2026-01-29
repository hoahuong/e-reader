# 🔧 Sửa lỗi "Xoay vòng" - Không redirect về app

## ❌ Vấn đề:
Sau khi authorize trên Google, trang cứ loading mãi không redirect về app.

## 🔍 Nguyên nhân:

1. **Redirect URI không khớp** với cấu hình trong Google Cloud Console
2. **Google đang dùng legacy approval flow** thay vì redirect
3. **Redirect URI chưa được thêm** vào Authorized redirect URIs

## ✅ Giải pháp:

### Bước 1: Kiểm tra Redirect URI trong Google Cloud Console

1. Vào **Google Cloud Console**: https://console.cloud.google.com/
2. Chọn project của bạn
3. Vào **APIs & Services** → **Credentials**
4. Click vào **OAuth Client ID** của bạn
5. Kiểm tra phần **Authorized redirect URIs**

### Bước 2: Thêm Redirect URI chính xác

Thêm các URI sau (phải khớp CHÍNH XÁC):

```
http://localhost:5173
http://localhost:5173/
http://localhost:5173/index.html
```

**QUAN TRỌNG:**
- Không có dấu `/` ở cuối nếu không cần
- Phải khớp chính xác với URL hiện tại của bạn
- Nếu bạn đang ở `http://localhost:5173/` → Thêm cả 2: có và không có `/`

### Bước 3: Kiểm tra URL hiện tại

Mở Console (F12) và chạy:
```javascript
console.log(window.location.origin);
console.log(window.location.href);
```

Copy kết quả và đảm bảo nó khớp với Redirect URI trong Google Cloud Console.

### Bước 4: Xóa cache và thử lại

1. **Xóa localStorage**:
   ```javascript
   localStorage.clear();
   ```
2. **Xóa cookies** của Google
3. **Refresh trang** (F5)
4. **Thử đăng nhập lại**

## 🔄 Nếu vẫn không được:

### Giải pháp thay thế: Dùng Popup Flow (không cần redirect URI)

Nếu redirect flow vẫn không hoạt động, có thể dùng popup flow:

1. **Cho phép popup** trong trình duyệt:
   - Click icon popup blocker ở thanh địa chỉ
   - Cho phép popup từ `localhost:5173`

2. **Hoặc dùng incognito mode** để test (popup blocker ít strict hơn)

## ⚠️ Lưu ý:

- Redirect URI phải khớp **CHÍNH XÁC** (case-sensitive)
- Không có trailing space hoặc ký tự đặc biệt
- Phải là HTTP (không phải HTTPS) cho localhost
- Đợi 1-2 phút sau khi thêm redirect URI để Google cập nhật

## 🐛 Debug:

Mở Console (F12) và kiểm tra:
1. URL hiện tại: `window.location.href`
2. Redirect URI được dùng: Check trong Network tab khi redirect
3. Có lỗi gì trong Console không

---

**Sau khi thêm redirect URI đúng, đợi 1-2 phút rồi thử lại!** ✅
