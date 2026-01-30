# ✅ Set Upstash Redis Environment Variables lên Vercel

## 🎉 Bạn đã có Upstash Redis credentials!

Bây giờ cần set các env vars này lên Vercel:

```
KV_REST_API_URL="https://precious-ostrich-60844.upstash.io"
KV_REST_API_TOKEN="Ae2sAAIncDEwYzk1OTBiNzc4OGI0OGQ1YmZkYzg2OTUxZGY3YTMxZXAxNjA4NDQ"
KV_REST_API_READ_ONLY_TOKEN="Au2sAAIgcDHw0OllbemxdyD-OsxQfBEBrneNpB6u1b6l4lHNq_FANA" (optional)
```

## 🔧 Cách 1: Vercel Dashboard (Khuyến nghị)

### Bước 1: Vào Environment Variables

1. Vào: https://vercel.com/dashboard
2. Chọn project của bạn
3. Vào **Settings** → **Environment Variables**

### Bước 2: Add KV_REST_API_URL

1. Click **"Add New"**
2. **Name**: `KV_REST_API_URL`
3. **Value**: `https://precious-ostrich-60844.upstash.io`
4. **Environments**: Chọn tất cả (Production, Preview, Development)
5. Click **"Save"**

### Bước 3: Add KV_REST_API_TOKEN

1. Click **"Add New"** (lần nữa)
2. **Name**: `KV_REST_API_TOKEN`
3. **Value**: `Ae2sAAIncDEwYzk1OTBiNzc4OGI0OGQ1YmZkYzg2OTUxZGY3YTMxZXAxNjA4NDQ`
4. **Environments**: Chọn tất cả (Production, Preview, Development)
5. Click **"Save"**

### Bước 4: Add KV_REST_API_READ_ONLY_TOKEN (Optional)

1. Click **"Add New"**
2. **Name**: `KV_REST_API_READ_ONLY_TOKEN`
3. **Value**: `Au2sAAIgcDHw0OllbemxdyD-OsxQfBEBrneNpB6u1b6l4lHNq_FANA`
4. **Environments**: Chọn tất cả
5. Click **"Save"**

## 🔧 Cách 2: Vercel CLI (Nhanh hơn)

```bash
cd pdf-reader-app

# Set KV_REST_API_URL
vercel env add KV_REST_API_URL production
# Paste: https://precious-ostrich-60844.upstash.io
# Chọn: Production, Preview, Development

# Set KV_REST_API_TOKEN
vercel env add KV_REST_API_TOKEN production
# Paste: Ae2sAAIncDEwYzk1OTBiNzc4OGI0OGQ1YmZkYzg2OTUxZGY3YTMxZXAxNjA4NDQ
# Chọn: Production, Preview, Development

# Set KV_REST_API_READ_ONLY_TOKEN (optional)
vercel env add KV_REST_API_READ_ONLY_TOKEN production
# Paste: Au2sAAIgcDHw0OllbemxdyD-OsxQfBEBrneNpB6u1b6l4lHNq_FANA
# Chọn: Production, Preview, Development
```

## ✅ Bước 3: Verify Env Vars

Sau khi set xong, verify:

```bash
vercel env ls | grep KV
```

Sẽ thấy:
```
KV_REST_API_URL              Production, Preview, Development
KV_REST_API_TOKEN           Production, Preview, Development
KV_REST_API_READ_ONLY_TOKEN Production, Preview, Development
```

## 🚀 Bước 4: Redeploy Project

**Quan trọng**: Sau khi set env vars, cần redeploy để áp dụng:

### Cách 1: Vercel Dashboard
1. Vào **Deployments** tab
2. Click **...** trên deployment mới nhất
3. Chọn **Redeploy**

### Cách 2: Git Push
```bash
git commit --allow-empty -m "Redeploy after setting Upstash Redis env vars"
git push
```

## ✅ Bước 5: Test

Sau khi redeploy, test API:

1. Mở app: https://reader-online.vercel.app
2. Mở Browser Console (F12)
3. Kiểm tra logs:
   - ✅ `[Metadata Sync KV] Load thành công` → Thành công!
   - ❌ `503 Service Unavailable` → Vẫn thiếu env vars

### Test thủ công:

Mở Browser Console và chạy:
```javascript
fetch('/api/kv-metadata', { method: 'GET' })
  .then(r => r.json())
  .then(data => {
    if (data.error) {
      console.error('❌ Lỗi:', data.error);
    } else {
      console.log('✅ Redis hoạt động!', data);
    }
  });
```

## 📝 Checklist

- [ ] Đã set `KV_REST_API_URL` trên Vercel
- [ ] Đã set `KV_REST_API_TOKEN` trên Vercel
- [ ] Đã verify env vars bằng `vercel env ls | grep KV`
- [ ] Đã redeploy project
- [ ] Đã test và thấy `[Metadata Sync KV] Load thành công`

## 🎉 Sau khi hoàn thành

App sẽ:
- ✅ Sync metadata giữa các devices
- ✅ Lưu catalogs và files trên Upstash Redis
- ✅ Load nhanh từ Redis (< 1ms latency)
- ✅ Free tier: 30K reads/day, 30K writes/day
