# 📝 Hướng dẫn Thêm Test User - Chi tiết từng bước

## 🎯 Bạn đang ở đâu?

Bạn đang ở: **APIs & Services** → **Enabled APIs & services**

## ✅ Cần làm gì?

### Bước 1: Click vào "OAuth consent screen" trong menu bên trái

Trong menu bên trái, bạn sẽ thấy:
- ✅ Enabled APIs & services (đang chọn)
- ✅ Library
- ✅ Credentials
- ✅ **OAuth consent screen** ← **CLICK VÀO ĐÂY!**
- ✅ Page usage agreements

### Bước 2: Scroll xuống phần "Test users"

Sau khi vào **OAuth consent screen**, bạn sẽ thấy:
1. **Publishing status** (ở trên cùng)
2. **App information**
3. **App domain**
4. **Authorized domains**
5. **Developer contact information**
6. **Scopes**
7. **Test users** ← **ĐÂY LÀ NƠI CẦN TÌM!**

Scroll xuống để tìm phần **"Test users"**

### Bước 3: Click "+ ADD USERS"

Trong phần **Test users**, bạn sẽ thấy:
- Danh sách test users hiện tại (nếu có)
- Nút **"+ ADD USERS"** hoặc **"ADD USERS"**

Click vào nút đó!

### Bước 4: Thêm email

1. Một popup/dialog sẽ hiện ra
2. Nhập email bạn muốn thêm: `gnouh.it@gmail.com`
3. Click **ADD** hoặc **SAVE**

### Bước 5: Xác nhận

- Email sẽ xuất hiện trong danh sách Test users
- Đợi 1-2 phút để Google cập nhật
- Thử đăng nhập lại trong app

## ⚠️ Lưu ý quan trọng:

### Nếu không thấy phần "Test users":

1. **Kiểm tra Publishing status**:
   - Phải là **"Testing"** (không phải "In production")
   - Nếu là "In production", bạn cần quay lại và chọn "Testing"

2. **Kiểm tra User type**:
   - Phải là **"External"** (nếu không dùng Google Workspace)
   - Nếu là "Internal", chỉ có thể dùng với Google Workspace accounts

### Nếu vẫn không thấy:

1. Đảm bảo bạn đã hoàn thành OAuth consent screen setup:
   - App name đã điền
   - User support email đã điền
   - Scopes đã thêm (`drive.readonly`)

2. Thử refresh trang (F5)

## 📸 Mô tả giao diện:

```
OAuth consent screen
├── Publishing status: Testing ← Phải là Testing
├── App information
├── Scopes
└── Test users ← Scroll xuống đây
    ├── [Danh sách users hiện tại]
    └── [+ ADD USERS] ← Click vào đây
```

## ✅ Checklist:

- [ ] Đã vào **OAuth consent screen** (không phải Enabled APIs)
- [ ] Publishing status là **Testing**
- [ ] Đã scroll xuống phần **Test users**
- [ ] Đã click **+ ADD USERS**
- [ ] Đã thêm email `gnouh.it@gmail.com`
- [ ] Đã đợi 1-2 phút
- [ ] Đã thử đăng nhập lại

---

**Quan trọng: Phải vào "OAuth consent screen" chứ không phải "Enabled APIs & services"!** 🎯
