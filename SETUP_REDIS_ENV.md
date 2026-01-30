# 🔧 Setup Upstash Redis Environment Variables

## ❌ Vấn đề

App đang báo lỗi 503 vì thiếu environment variables:
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

## ✅ Giải pháp: Tạo Upstash Redis trên Vercel

### Bước 1: Vào Vercel Dashboard

1. Mở: https://vercel.com/dashboard
2. Chọn project: **reader-online** (hoặc tên project của bạn)

### Bước 2: Tạo Upstash Redis Store

1. Vào tab **Storage** (hoặc **Integrations**)
2. Click **Create Database** hoặc **Browse Marketplace**
3. Tìm **"Upstash Redis"**
4. Click **Add Integration**
5. Chọn plan: **Free** (30K reads/day, 30K writes/day)
6. Click **Create**

### Bước 3: Environment Variables tự động

Sau khi tạo Redis, Vercel sẽ **tự động thêm** các environment variables:
- ✅ `KV_REST_API_URL`
- ✅ `KV_REST_API_TOKEN`
- ✅ `KV_REST_API_READ_ONLY_TOKEN` (optional)

### Bước 4: Redeploy Project

1. Vào **Deployments** tab
2. Click **Redeploy** trên deployment mới nhất
3. Hoặc push code mới lên Git để trigger auto-deploy

### Bước 5: Kiểm tra

```bash
# Kiểm tra env vars đã có chưa
vercel env ls | grep KV

# Hoặc vào Vercel Dashboard → Settings → Environment Variables
# Tìm các biến bắt đầu bằng KV_
```

## 🔍 Troubleshooting

### Lỗi: "503 Service Unavailable"

**Nguyên nhân**: Redis chưa được tạo hoặc env vars chưa được set

**Giải pháp**:
1. Kiểm tra Redis đã được tạo chưa (Vercel Dashboard → Storage)
2. Kiểm tra env vars (Vercel Dashboard → Settings → Environment Variables)
3. Redeploy project sau khi tạo Redis

### App tự động fallback về Local Storage

**Đây là tính năng tự động**:
- Nếu Redis chưa setup → App tự động dùng IndexedDB
- Không cần làm gì, app sẽ hoạt động bình thường
- Chỉ khác là không sync giữa các devices

**Để enable Redis sync**:
- Làm theo các bước trên để tạo Redis
- App sẽ tự động switch sang Redis sau khi redeploy

## 📊 Chi phí

**Free Tier:**
- ✅ 30,000 reads/day
- ✅ 30,000 writes/day
- ✅ Đủ cho app cá nhân

**Nếu vượt quá:**
- Pro plan: $20/month
- Hoặc dùng Local Storage (không sync cross-device)

## ✅ Checklist

- [ ] Đã tạo Upstash Redis trên Vercel Dashboard
- [ ] Đã kiểm tra env vars có `KV_REST_API_URL` và `KV_REST_API_TOKEN`
- [ ] Đã redeploy project
- [ ] Đã test app hoạt động (không còn lỗi 503)
