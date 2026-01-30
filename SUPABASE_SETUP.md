# 🔧 Setup Supabase cho Metadata Storage

## 📋 Tổng quan

Supabase là PostgreSQL database với REST API tự động. Perfect cho metadata storage với real-time sync.

**Ưu điểm:**
- ✅ Free tier: 500MB database
- ✅ Real-time sync tự động
- ✅ REST API tự động (không cần SDK)
- ✅ Predictable pricing
- ✅ PostgreSQL (queries mạnh)

---

## 🚀 Bước 1: Tạo Supabase Project

1. Vào https://supabase.com
2. Click **"Start your project"** hoặc **"New Project"**
3. Sign up/login với GitHub hoặc email
4. Tạo project mới:
   - **Name**: `pdf-reader-metadata` (hoặc tên bạn muốn)
   - **Database Password**: Tạo password mạnh (lưu lại!)
   - **Region**: Chọn gần bạn nhất
   - **Pricing Plan**: **Free** (đủ dùng cho metadata)
5. Click **"Create new project"**
6. Đợi project được tạo (2-3 phút)

---

## 🔑 Bước 2: Lấy API Credentials

1. Vào **Project Settings** (icon ⚙️ ở sidebar trái)
2. Click **API** tab
3. Copy các giá trị sau:

   - **Project URL**: `https://xxxxx.supabase.co`
     - Copy vào `SUPABASE_URL`
   
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
     - Copy vào `SUPABASE_ANON_KEY`
     - Đây là public key, an toàn để dùng ở client-side

---

## 🗄️ Bước 3: Tạo Database Table

1. Vào **SQL Editor** (icon 📝 ở sidebar trái)
2. Click **"New query"**
3. Paste SQL sau và chạy:

```sql
-- Tạo table để lưu metadata
CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tạo index để query nhanh hơn
CREATE INDEX IF NOT EXISTS idx_metadata_key ON metadata(key);

-- Enable Row Level Security (RLS) - Cho phép public read/write
ALTER TABLE metadata ENABLE ROW LEVEL SECURITY;

-- Tạo policy để cho phép public read/write
CREATE POLICY "Allow public read/write" ON metadata
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

4. Click **"Run"** để execute SQL
5. Verify table đã được tạo:
   - Vào **Table Editor** (icon 📊)
   - Bạn sẽ thấy table `metadata` với columns: `key`, `value`, `updated_at`

---

## ⚙️ Bước 4: Set Environment Variables trên Vercel

1. Vào Vercel Dashboard: https://vercel.com/dashboard
2. Chọn project của bạn
3. Vào **Settings** → **Environment Variables**
4. Thêm 2 biến sau:

   **SUPABASE_URL**
   - Value: `https://xxxxx.supabase.co` (từ Bước 2)
   - Environment: Production, Preview, Development (chọn tất cả)

   **SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (từ Bước 2)
   - Environment: Production, Preview, Development (chọn tất cả)

5. Click **Save**

---

## 🔄 Bước 5: Update Code để dùng Supabase

1. Mở `src/metadataSyncConfig.js`
2. Đổi `STORAGE_TYPE` thành `'supabase'`:

```javascript
const STORAGE_TYPE = 'supabase'; // 'supabase' | 'vercel-kv' | 'github' | 'local'
```

3. Thêm case cho Supabase trong `getMetadataSyncModule()`:

```javascript
case 'supabase':
  metadataSyncModule = await import('./metadataSyncSupabase');
  break;
```

---

## 🚀 Bước 6: Redeploy Project

```bash
git add .
git commit -m "Add Supabase metadata storage support"
git push
```

Hoặc redeploy từ Vercel Dashboard:
- Vào **Deployments** tab
- Click **"Redeploy"** trên deployment mới nhất

---

## ✅ Bước 7: Verify Setup

1. Mở app: https://reader-online.vercel.app
2. Mở Browser Console (F12)
3. Tạo một catalog mới
4. Kiểm tra logs:
   - ✅ `[Metadata Sync Supabase] Load thành công` → Setup thành công!
   - ❌ `Supabase chưa được setup` → Kiểm tra lại env vars

---

## 🔍 Troubleshooting

### Lỗi: "Supabase chưa được setup"

**Nguyên nhân:** Environment variables chưa được set hoặc chưa redeploy

**Giải pháp:**
1. Kiểm tra env vars trên Vercel Dashboard
2. Redeploy project
3. Đợi 1-2 phút để deploy xong

### Lỗi: "relation 'metadata' does not exist"

**Nguyên nhân:** Table chưa được tạo

**Giải pháp:**
1. Vào Supabase Dashboard → SQL Editor
2. Chạy lại SQL từ Bước 3
3. Verify table đã được tạo trong Table Editor

### Lỗi: "permission denied for table metadata"

**Nguyên nhân:** Row Level Security (RLS) policy chưa được set

**Giải pháp:**
1. Vào Supabase Dashboard → SQL Editor
2. Chạy lại phần policy từ Bước 3:

```sql
ALTER TABLE metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write" ON metadata
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## 📊 Chi phí

**Free Tier:**
- ✅ 500MB database storage
- ✅ 2GB bandwidth/month
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests

**Đủ dùng cho metadata:** 
- Metadata nhỏ (~KB) → 500MB đủ cho hàng triệu records
- Free tier đủ dùng cho cá nhân

**Khi nào cần upgrade:**
- Khi database > 500MB → $25/month (Pro plan)
- Khi bandwidth > 2GB/month → Pay-as-you-go

---

## 🎯 So sánh với Vercel KV

| Feature | Vercel KV | Supabase |
|---------|-----------|----------|
| **Chi phí** | $0 (30K ops/day) | $0 (500MB DB) |
| **Tốc độ** | ⭐⭐⭐⭐ (Fast) | ⭐⭐⭐⭐ (Fast) |
| **Real-time** | ❌ | ✅ |
| **Setup** | ⭐⭐⭐⭐⭐ (Dễ) | ⭐⭐⭐ (Cần setup) |
| **Queries** | Key-value only | SQL (mạnh hơn) |
| **Sync** | Manual | Real-time tự động |

---

## 💡 Kết luận

Supabase là giải pháp tốt nếu:
- ✅ Cần real-time sync
- ✅ Cần queries phức tạp
- ✅ Muốn có database thật sự
- ✅ Chấp nhận setup phức tạp hơn một chút

**Next Steps:**
1. Setup Supabase project
2. Tạo table
3. Set env vars trên Vercel
4. Update code và redeploy
5. Test và verify
