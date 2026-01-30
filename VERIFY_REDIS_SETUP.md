# ✅ Verify Redis Setup

## Bạn đã tạo Redis database "ereader" và connect với project

Bây giờ cần verify setup đã hoàn tất:

## 🔍 Bước 1: Kiểm tra Environment Variables

### Cách 1: Vercel Dashboard (Khuyến nghị)

1. Vào: https://vercel.com/dashboard
2. Chọn project của bạn
3. Vào **Settings** → **Environment Variables**
4. Tìm các biến sau:
   - ✅ `KV_REST_API_URL` (bắt đầu bằng `https://`)
   - ✅ `KV_REST_API_TOKEN` (chuỗi dài)
   - ✅ `KV_REST_API_READ_ONLY_TOKEN` (optional)

### Cách 2: Vercel CLI

```bash
cd pdf-reader-app
vercel env ls | grep KV
```

Bạn sẽ thấy:
```
KV_REST_API_URL              Production, Preview, Development
KV_REST_API_TOKEN           Production, Preview, Development
KV_REST_API_READ_ONLY_TOKEN Production, Preview, Development
```

## 🔍 Bước 2: Pull Environment Variables về Local (Optional)

Nếu muốn test local với `vercel dev`:

```bash
vercel env pull .env.local
```

File `.env.local` sẽ chứa các env vars (không commit file này vào Git).

## 🔍 Bước 3: Redeploy Project

**Quan trọng**: Sau khi tạo Redis, cần redeploy để env vars có hiệu lực:

### Cách 1: Vercel Dashboard
1. Vào **Deployments** tab
2. Click **...** trên deployment mới nhất
3. Chọn **Redeploy**

### Cách 2: Git Push
```bash
git commit --allow-empty -m "Trigger redeploy after Redis setup"
git push
```

## ✅ Bước 4: Test API

Sau khi redeploy, test API:

1. Mở app: https://reader-online.vercel.app
2. Mở Browser Console (F12)
3. Kiểm tra logs:
   - ✅ `[Metadata Sync KV] Load thành công` → Redis hoạt động!
   - ❌ `503 Service Unavailable` → Cần kiểm tra lại env vars

### Test thủ công:

Mở Browser Console và chạy:
```javascript
fetch('/api/kv-metadata', { method: 'GET' })
  .then(r => r.json())
  .then(data => {
    if (data.error) {
      console.error('❌ Lỗi:', data.error);
      console.info('📋 Hướng dẫn:', data.instructions);
    } else {
      console.log('✅ Redis hoạt động!', data);
    }
  })
  .catch(err => console.error('❌ Network error:', err));
```

## 🎯 Kết quả mong đợi

### ✅ Thành công:
- API trả về `200 OK`
- Response có `catalogs` và `files` arrays
- App tự động sync metadata với Redis

### ❌ Nếu vẫn lỗi:

1. **Kiểm tra env vars có đúng không:**
   - Vào Vercel Dashboard → Settings → Environment Variables
   - Verify `KV_REST_API_URL` và `KV_REST_API_TOKEN` có giá trị

2. **Kiểm tra Redis database:**
   - Vào Vercel Dashboard → Storage
   - Verify database "ereader" đã được connect với project

3. **Redeploy lại:**
   - Đảm bảo đã redeploy sau khi tạo Redis
   - Env vars chỉ có hiệu lực sau khi redeploy

4. **Kiểm tra logs:**
   - Vào Vercel Dashboard → Project → Logs
   - Xem có lỗi gì không

## 📝 Checklist

- [ ] Đã tạo Redis database "ereader"
- [ ] Đã connect với project
- [ ] Đã kiểm tra env vars có `KV_REST_API_URL` và `KV_REST_API_TOKEN`
- [ ] Đã redeploy project
- [ ] Đã test API và thấy `200 OK`
- [ ] App đã sync metadata với Redis thành công

## 🎉 Sau khi verify thành công

App sẽ:
- ✅ Sync metadata giữa các devices
- ✅ Lưu catalogs và files trên Redis
- ✅ Load nhanh từ Redis (< 1ms latency)
- ✅ Free tier: 30K reads/day, 30K writes/day
