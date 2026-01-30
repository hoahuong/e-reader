# 🔍 Kiểm tra Redis Environment Variables

## Tình trạng hiện tại

Bạn đã tạo Redis database "ereader" và connect với project, nhưng env vars chưa xuất hiện trong CLI output.

## ✅ Các bước kiểm tra

### Bước 1: Kiểm tra trên Vercel Dashboard

1. Vào: https://vercel.com/dashboard
2. Chọn project của bạn
3. Vào **Settings** → **Environment Variables**
4. Tìm các biến bắt đầu bằng `KV_`:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN` (optional)

**Nếu thấy các biến này:**
- ✅ Redis đã được connect đúng
- Tiếp tục Bước 2

**Nếu KHÔNG thấy:**
- ❌ Có thể Redis chưa được connect đúng với project
- Xem phần "Troubleshooting" bên dưới

### Bước 2: Verify Redis Connection

1. Vào **Storage** tab trên Vercel Dashboard
2. Tìm database "ereader"
3. Kiểm tra:
   - ✅ Database đã được connect với project chưa?
   - ✅ Có thấy "Connected to: [project-name]" không?

### Bước 3: Redeploy Project

**Quan trọng**: Sau khi connect Redis, cần redeploy để env vars có hiệu lực:

**Cách 1: Vercel Dashboard**
1. Vào **Deployments** tab
2. Click **...** trên deployment mới nhất
3. Chọn **Redeploy**

**Cách 2: Git Push**
```bash
git commit --allow-empty -m "Redeploy after Redis setup"
git push
```

### Bước 4: Test sau khi redeploy

Sau khi redeploy xong, test lại:

```bash
vercel env ls | grep KV
```

Bây giờ bạn sẽ thấy:
```
KV_REST_API_URL              Production, Preview, Development
KV_REST_API_TOKEN           Production, Preview, Development
```

## 🐛 Troubleshooting

### Nếu vẫn không thấy env vars:

#### 1. Kiểm tra Redis có được connect đúng project không

- Vào Vercel Dashboard → Storage
- Click vào database "ereader"
- Kiểm tra "Connected Projects" có project của bạn không
- Nếu không có → Click "Connect" và chọn project

#### 2. Refresh Vercel Dashboard

- Đôi khi env vars cần vài phút để sync
- Refresh trang và đợi 1-2 phút
- Kiểm tra lại

#### 3. Tạo lại Redis (nếu cần)

Nếu vẫn không hoạt động:
1. Xóa database "ereader" cũ
2. Tạo lại Redis database mới
3. Connect với project
4. Redeploy

## ✅ Sau khi verify thành công

Khi đã thấy env vars, app sẽ:
- ✅ Tự động sync metadata với Redis
- ✅ Load nhanh từ Redis (< 1ms)
- ✅ Sync giữa các devices

## 📝 Checklist

- [ ] Đã kiểm tra Vercel Dashboard → Settings → Environment Variables
- [ ] Đã thấy `KV_REST_API_URL` và `KV_REST_API_TOKEN`
- [ ] Đã verify Redis database "ereader" được connect với project
- [ ] Đã redeploy project
- [ ] Đã test lại `vercel env ls | grep KV` và thấy env vars
- [ ] Đã test app và thấy `[Metadata Sync KV] Load thành công`
