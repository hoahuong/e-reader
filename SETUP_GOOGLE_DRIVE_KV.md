# Setup Google Drive + Vercel KV Storage

## 📋 Tổng quan

App đã được cấu hình để:
- **PDF Files:** Lưu trên Google Drive (15 GB free)
- **Metadata:** Lưu trên Vercel KV (30K ops/day free)

## 🔧 Bước 1: Setup Google Drive (Cho PDF Files)

### 1.1. Enable Google Drive API

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào **APIs & Services** → **Library**
4. Tìm "Google Drive API"
5. Click **Enable**

### 1.2. Tạo OAuth 2.0 Credentials

1. Vào **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Nếu chưa có OAuth consent screen:
   - Chọn **External**
   - Điền thông tin: App name, User support email
   - Thêm scopes:
     - `https://www.googleapis.com/auth/drive.readonly`
     - `https://www.googleapis.com/auth/drive.file`
   - Thêm test users: `gnouh.it@gmail.com`
   - Save và Continue

4. Tạo OAuth Client ID:
   - **Application type**: Web application
   - **Name**: PDF Reader App
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `https://reader-online.vercel.app`
   - Click **Create**

5. Copy **Client ID** (dạng: `xxxxx.apps.googleusercontent.com`)

### 1.3. Set Environment Variables

**Local (.env):**
```env
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

**Vercel:**
1. Vào Vercel Dashboard → Project → Settings → Environment Variables
2. Thêm:
   - `VITE_GOOGLE_CLIENT_ID` = your-client-id
3. Redeploy project

## 🔧 Bước 2: Setup Vercel KV (Cho Metadata)

### 2.1. Tạo Vercel KV Store

**Lưu ý:** Vercel KV đã deprecated, cần dùng Upstash Redis qua Vercel Marketplace.

1. Vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project của bạn
3. Vào **Storage** tab
4. Click **Create Database** hoặc **Browse Marketplace**
5. Tìm "Upstash Redis" hoặc "Redis"
6. Click **Add Integration**
7. Chọn plan: **Free** (hoặc Pro nếu cần)
8. Click **Create**

### 2.2. Environment Variables tự động

Sau khi tạo Redis, Vercel sẽ tự động thêm:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

### 2.3. Update Code (Nếu cần)

Nếu dùng Upstash Redis thay vì @vercel/kv:

**api/kv-metadata.js:**
```javascript
// Thay vì:
import { kv } from '@vercel/kv';

// Dùng:
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// Thay kv.get() → redis.get()
// Thay kv.set() → redis.set()
```

Hoặc dùng REST API trực tiếp:
```javascript
const response = await fetch(`${process.env.KV_REST_API_URL}/get/pdf-metadata`, {
  headers: {
    'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
  },
});
```

## ✅ Bước 3: Test

### 3.1. Test Google Drive Upload

1. Mở app
2. Click "Đăng nhập Google"
3. Chọn account `gnouh.it@gmail.com`
4. Upload một file PDF
5. Kiểm tra Google Drive xem file đã được upload chưa

### 3.2. Test Vercel KV Metadata

1. Tạo một catalog mới
2. Kiểm tra console log:
   - `[Metadata Sync KV] Lưu thành công`
3. Reload trang
4. Kiểm tra catalog có còn không

## 🐛 Troubleshooting

### Google Drive không upload được

**Lỗi:** "Chưa đăng nhập Google"
- **Giải pháp:** Click "Đăng nhập Google" trước khi upload

**Lỗi:** "API not enabled"
- **Giải pháp:** Enable Google Drive API trên Google Cloud Console

**Lỗi:** "Access blocked"
- **Giải pháp:** Thêm email vào Test Users trong OAuth consent screen

### Vercel KV không hoạt động

**Lỗi:** "Vercel KV chưa được setup"
- **Giải pháp:** Tạo Redis store trên Vercel Dashboard

**Lỗi:** "KV_REST_API_URL not found"
- **Giải pháp:** Kiểm tra Environment Variables trên Vercel

**Lỗi:** "@vercel/kv deprecated"
- **Giải pháp:** Dùng Upstash Redis thay vì @vercel/kv (xem Bước 2.3)

## 📊 Chi phí

### Google Drive
- **Free:** 15 GB storage
- **Paid:** $1.99/month cho 100 GB

### Vercel KV / Upstash Redis
- **Free:** 30K reads/day, 30K writes/day
- **Paid:** $0.20/100K operations

**Tổng chi phí:** $0/month (free tier đủ dùng)

## 🎯 Kết luận

Sau khi setup xong:
- ✅ PDF files sẽ được lưu trên Google Drive (15 GB free)
- ✅ Metadata sẽ được lưu trên Vercel KV/Redis (30K ops/day free)
- ✅ Sync giữa tất cả thiết bị
- ✅ Không timeout như GitHub API
- ✅ Hoàn toàn miễn phí cho use case cá nhân
