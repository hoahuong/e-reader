# Kiểm tra Trạng thái Setup

## ✅ Thông tin đã có:

### 1. Google Drive:
- ✅ **Client ID:** `507457583271-3ubut9f9nljo5gb1e2frrhqo52ctspp9.apps.googleusercontent.com` (trong .env local)
- ✅ **Email:** `gnouh.it@gmail.com`
- ✅ **Vercel project:** `reader-online.vercel.app`
- ✅ **Vercel CLI:** Đã login

### 2. Vercel Environment Variables hiện tại:
- ✅ `GITHUB_TOKEN` (Production, Preview, Development)
- ✅ `GITHUB_OWNER` (Production, Preview, Development)
- ✅ `GITHUB_REPO` (Production, Preview, Development)
- ❌ `VITE_GOOGLE_CLIENT_ID` - **CHƯA CÓ trên Vercel**
- ❌ `KV_REST_API_URL` - **CHƯA CÓ** (cần tạo Redis)
- ❌ `KV_REST_API_TOKEN` - **CHƯA CÓ** (cần tạo Redis)

---

## 🔧 Những gì cần làm:

### 1. Set VITE_GOOGLE_CLIENT_ID trên Vercel ✅ (Tôi có thể làm)

**Có thể tự động setup:**
- Đã có Client ID trong .env local
- Có thể dùng Vercel CLI để set

### 2. Tạo Upstash Redis trên Vercel Dashboard ❌ (Bạn cần làm)

**Không thể tự động:**
- Cần vào Vercel Dashboard
- Click vào Storage/Marketplace
- Chọn Upstash Redis
- Tạo store

**Tôi có thể:**
- Hướng dẫn chi tiết từng bước
- Kiểm tra sau khi bạn tạo xong

### 3. Kiểm tra Google OAuth Scopes ⚠️ (Cần kiểm tra)

**Cần kiểm tra:**
- OAuth consent screen có scope `drive.file` chưa?
- Nếu chưa có → Cần thêm scope này để upload files

---

## 📋 Checklist:

- [ ] Set `VITE_GOOGLE_CLIENT_ID` trên Vercel (Tôi sẽ làm)
- [ ] Tạo Upstash Redis trên Vercel Dashboard (Bạn cần làm)
- [ ] Kiểm tra OAuth scopes có `drive.file` (Cần kiểm tra)
- [ ] Test upload PDF lên Google Drive
- [ ] Test metadata sync với Redis

---

## 🚀 Tôi có thể làm ngay:

1. ✅ Set `VITE_GOOGLE_CLIENT_ID` trên Vercel
2. ✅ Kiểm tra và hướng dẫn setup Redis
3. ✅ Kiểm tra OAuth scopes

**Bạn chỉ cần:**
- Tạo Upstash Redis trên Vercel Dashboard (5 phút)
- Hoặc cho phép tôi hướng dẫn chi tiết
