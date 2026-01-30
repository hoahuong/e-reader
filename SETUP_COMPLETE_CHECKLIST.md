# ✅ Checklist Setup Hoàn chỉnh

## 📊 Trạng thái hiện tại:

### ✅ Đã hoàn thành:

1. **Google Drive Client ID:**
   - ✅ Đã có trong `.env` local
   - ✅ Đã set trên Vercel (Production, Preview, Development)

2. **Code Implementation:**
   - ✅ Google Drive upload function
   - ✅ Vercel KV/Redis metadata sync
   - ✅ API routes đã sẵn sàng

3. **Vercel CLI:**
   - ✅ Đã login
   - ✅ Project đã được link

---

## ⚠️ Còn thiếu (Bạn cần làm):

### 1. Tạo Upstash Redis trên Vercel Dashboard

**Tại sao cần:**
- Metadata sync cần Redis để lưu trữ
- Free tier: 30K reads/day, 30K writes/day

**Cách làm (5 phút):**
1. Vào: https://vercel.com/dashboard
2. Chọn project: **pdf-reader-app** (hoặc **reader-online**)
3. Vào tab **Storage** (hoặc **Integrations**)
4. Click **Create Database** hoặc **Browse Marketplace**
5. Tìm **"Upstash Redis"**
6. Click **Add Integration**
7. Chọn plan: **Free**
8. Click **Create**

**Sau khi tạo:**
- Vercel sẽ tự động thêm environment variables:
  - `KV_REST_API_URL`
  - `KV_REST_API_TOKEN`
  - `KV_REST_API_READ_ONLY_TOKEN`

**Kiểm tra:**
```bash
vercel env ls | grep KV
```

---

### 2. Kiểm tra Google OAuth Scopes

**Cần kiểm tra:**
- OAuth consent screen có scope `https://www.googleapis.com/auth/drive.file` chưa?

**Cách kiểm tra:**
1. Vào: https://console.cloud.google.com/
2. Chọn project của bạn
3. Vào **APIs & Services** → **OAuth consent screen**
4. Xem phần **Scopes**
5. Nếu chưa có `drive.file`:
   - Click **EDIT APP**
   - Vào **Scopes** tab
   - Click **ADD OR REMOVE SCOPES**
   - Tìm và chọn: `https://www.googleapis.com/auth/drive.file`
   - Click **UPDATE** → **SAVE**

**Tại sao cần:**
- `drive.readonly` → Chỉ đọc files
- `drive.file` → Upload files (cần cho upload PDF)

---

## 🎯 Sau khi hoàn thành:

### Test Google Drive Upload:
1. Mở app: https://reader-online.vercel.app
2. Click "Đăng nhập Google"
3. Chọn account `gnouh.it@gmail.com`
4. Upload một file PDF
5. Kiểm tra Google Drive xem file đã được upload chưa

### Test Metadata Sync:
1. Tạo một catalog mới
2. Kiểm tra console log:
   - `[Metadata Sync KV] Lưu thành công`
3. Reload trang
4. Kiểm tra catalog có còn không

---

## 📝 Tóm tắt:

**Tôi đã làm:**
- ✅ Set `VITE_GOOGLE_CLIENT_ID` trên Vercel
- ✅ Code implementation đã sẵn sàng

**Bạn cần làm:**
1. ⚠️ Tạo Upstash Redis trên Vercel Dashboard (5 phút)
2. ⚠️ Kiểm tra OAuth scope có `drive.file` chưa (2 phút)

**Sau đó:**
- ✅ Test upload PDF
- ✅ Test metadata sync
- ✅ Hoàn thành!

---

## 🆘 Nếu gặp vấn đề:

**Redis không tạo được:**
- Kiểm tra Vercel plan (cần Hobby trở lên)
- Thử tạo qua Vercel Marketplace

**Upload PDF không được:**
- Kiểm tra đã đăng nhập Google chưa
- Kiểm tra OAuth scope có `drive.file` chưa
- Kiểm tra console log để xem lỗi

**Metadata không sync:**
- Kiểm tra Redis đã tạo chưa
- Kiểm tra environment variables có `KV_REST_API_URL` chưa
- Kiểm tra console log
