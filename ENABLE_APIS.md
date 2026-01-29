# ✅ APIs Cần Enable trên Google Cloud Console

## 🎯 API BẮT BUỘC:

### 1. Google Drive API ⭐ (QUAN TRỌNG NHẤT)

**Cách enable:**
1. Vào **Google Cloud Console**: https://console.cloud.google.com/
2. Chọn project của bạn
3. Vào **APIs & Services** → **Library** (hoặc **Enabled APIs & services**)
4. Tìm kiếm: `Google Drive API`
5. Click vào **Google Drive API**
6. Click nút **ENABLE** (màu xanh)
7. Đợi vài giây để API được enable

**Tại sao cần:**
- Để đọc danh sách folders từ Google Drive
- Để list PDF files trong folders
- Để download PDF files từ Google Drive

## 📋 Checklist APIs:

- [ ] ✅ **Google Drive API** - BẮT BUỘC
- [ ] (Không cần API khác cho tính năng hiện tại)

## ⚠️ Lưu ý:

- **Google Drive API** là API duy nhất cần enable
- Không cần enable Google Picker API (đang dùng Drive API trực tiếp)
- Không cần enable Google Identity Services (tự động có sẵn)

## 🔍 Kiểm tra đã enable chưa:

1. Vào **APIs & Services** → **Enabled APIs & services**
2. Tìm trong danh sách xem có **Google Drive API** không
3. Nếu có → ✅ Đã enable
4. Nếu không có → Cần enable theo hướng dẫn trên

## 🚨 Nếu chưa enable Google Drive API:

Bạn sẽ gặp lỗi khi:
- Click "Đăng nhập Google" → Thành công
- Nhưng khi list folders → Lỗi "API not enabled"
- Hoặc lỗi "Drive API has not been used in project"

## ✅ Sau khi enable:

1. Đợi 1-2 phút để Google cập nhật
2. Refresh trình duyệt
3. Thử đăng nhập và list folders lại

---

**Tóm lại: Chỉ cần enable Google Drive API là đủ!** ✅
