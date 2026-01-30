# Hướng dẫn Authorize/Đăng nhập

## 🔐 Google Drive Authorization

### Cách hoạt động:

**OAuth 2.0 Flow:**
1. User click "Đăng nhập Google" trên app
2. Popup/Redirect đến Google OAuth consent screen
3. User chọn account và authorize
4. Google trả về access token
5. App dùng token để truy cập Google Drive API

### Tự động Authorize:

**❌ Không thể tự động hoàn toàn** vì:
- OAuth cần user interaction (click, chọn account)
- Google yêu cầu user consent
- Security best practice

**✅ Nhưng có thể:**
- Tự động mở popup khi cần
- Lưu token để không cần login lại
- Auto-refresh token khi hết hạn

### Setup cần thiết:

1. **OAuth Consent Screen:**
   - Đã có Client ID: `507457583271-3ubut9f9nljo5gb1e2frrhqo52ctspp9.apps.googleusercontent.com`
   - Cần kiểm tra scopes:
     - ✅ `drive.readonly` (đã có)
     - ⚠️ `drive.file` (cần thêm để upload)

2. **Test Users:**
   - Đã thêm: `gnouh.it@gmail.com`
   - Cần verify email này có thể login

### Cách test:

1. Mở app: https://reader-online.vercel.app
2. Vào "Google Drive" view
3. Click "Đăng nhập Google"
4. Chọn account `gnouh.it@gmail.com`
5. Authorize permissions
6. Kiểm tra xem có thể list folders không

---

## 🔧 Vercel Authorization

### Đã hoàn thành:

- ✅ Vercel CLI đã login
- ✅ Project đã được link
- ✅ Environment variables đã được set

### Còn thiếu:

- ⚠️ **Upstash Redis** chưa được tạo
- ⚠️ Cần authorize qua Vercel Dashboard

### Cách tạo Redis:

**Không thể tự động**, cần vào Dashboard:
1. Vào: https://vercel.com/dashboard
2. Chọn project
3. Vào **Storage** hoặc **Integrations**
4. Tìm "Upstash Redis"
5. Click **Add Integration** → **Create**

---

## 📋 Checklist Authorization:

### Google Drive:
- [x] Client ID đã có
- [x] Client ID đã set trên Vercel
- [ ] Kiểm tra OAuth scopes có `drive.file` chưa
- [ ] Test login trên app

### Vercel:
- [x] CLI đã login
- [x] Project đã link
- [x] Environment variables đã set
- [ ] Redis chưa tạo (cần làm thủ công)

---

## 🚀 Next Steps:

1. **Kiểm tra Google OAuth Scopes:**
   - Vào Google Cloud Console
   - Kiểm tra có scope `drive.file` chưa
   - Nếu chưa → Thêm scope này

2. **Tạo Redis:**
   - Vào Vercel Dashboard
   - Tạo Upstash Redis
   - Environment variables sẽ tự động được thêm

3. **Test:**
   - Test login Google Drive
   - Test upload PDF
   - Test metadata sync

---

## 💡 Lưu ý:

**Google OAuth:**
- Token được lưu trong browser (localStorage/sessionStorage)
- Token tự động expire sau 1 giờ
- Cần refresh token hoặc login lại

**Vercel:**
- Environment variables được encrypt
- Chỉ có thể xem trên Dashboard
- Cần redeploy sau khi thêm env vars
