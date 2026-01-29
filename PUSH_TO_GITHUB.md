# Hướng dẫn Push Code lên GitHub

## ⚠️ Vấn đề hiện tại
Git đang sử dụng credentials của user `ss-huong` nhưng repo thuộc `hoahuong`, nên bị từ chối quyền truy cập.

## ✅ Giải pháp

### Cách 1: Sử dụng Personal Access Token (Khuyến nghị)

1. **Tạo Personal Access Token:**
   - Vào GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Đặt tên: `e-reader-push`
   - Chọn scope: ✅ `repo` (full control)
   - Click "Generate token"
   - **Copy token ngay** (chỉ hiện 1 lần!)

2. **Push code với token:**
   ```bash
   cd pdf-reader-app
   git remote set-url origin https://YOUR_TOKEN@github.com/hoahuong/e-reader.git
   git push -u origin main
   ```
   
   Thay `YOUR_TOKEN` bằng token bạn vừa copy.

3. **Hoặc nhập token khi push:**
   ```bash
   git push -u origin main
   # Username: hoahuong
   # Password: YOUR_TOKEN (paste token vào đây)
   ```

---

### Cách 2: Sử dụng SSH (Bảo mật hơn)

1. **Kiểm tra SSH key:**
   ```bash
   ls -al ~/.ssh
   ```

2. **Nếu chưa có SSH key, tạo mới:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # Nhấn Enter để chấp nhận default
   ```

3. **Copy public key:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

4. **Thêm SSH key vào GitHub:**
   - Vào GitHub → Settings → SSH and GPG keys
   - Click "New SSH key"
   - Paste public key vào
   - Click "Add SSH key"

5. **Đổi remote sang SSH:**
   ```bash
   cd pdf-reader-app
   git remote set-url origin git@github.com:hoahuong/e-reader.git
   git push -u origin main
   ```

---

### Cách 3: Đăng nhập lại với đúng account

1. **Xóa credentials cũ:**
   ```bash
   git config --global --unset credential.helper
   # macOS:
   git credential-osxkeychain erase
   host=github.com
   protocol=https
   # Nhấn Enter 2 lần
   ```

2. **Push lại:**
   ```bash
   git push -u origin main
   # Nhập username: hoahuong
   # Nhập password: YOUR_TOKEN (hoặc password nếu có 2FA thì dùng token)
   ```

---

## 📝 Lưu ý

- **Personal Access Token** là cách đơn giản nhất
- Token có quyền `repo` sẽ cho phép push/pull
- Nếu repo là private, cần quyền truy cập từ owner `hoahuong`
- Sau khi push thành công, code sẽ có trên GitHub và có thể deploy lên Vercel/Netlify

---

## 🚀 Sau khi push thành công

Code đã được push lên GitHub, bạn có thể:
1. Xem code tại: https://github.com/hoahuong/e-reader
2. Deploy lên Vercel (xem file `DEPLOY.md`)
3. Share URL với người khác
