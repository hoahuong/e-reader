# 🔧 Setup Redis Labs (Thay vì Upstash Redis)

## 📋 Tình trạng

Bạn đang có Redis Labs connection string:
```
REDIS_URL="redis://default:YF5Wjpzvf5D1CpWzUZ2jdKiItmQLkgyj@redis-17882.crce194.ap-seast-1-1.ec2.cloud.redislabs.com:17882"
```

Đây là Redis Labs (cloud.redislabs.com), không phải Upstash Redis qua Vercel Marketplace.

## ✅ Giải pháp: Dùng Redis Labs trực tiếp

### Bước 1: Cài đặt Redis Client Library

```bash
cd pdf-reader-app
npm install redis
```

### Bước 2: Set Environment Variable trên Vercel

1. Vào Vercel Dashboard → Settings → Environment Variables
2. Click **"Add New"**
3. Name: `REDIS_URL`
4. Value: `redis://default:YF5Wjpzvf5D1CpWzUZ2jdKiItmQLkgyj@redis-17882.crce194.ap-seast-1-1.ec2.cloud.redislabs.com:17882`
5. Environments: Chọn **Production**, **Preview**, **Development**
6. Click **"Save"**

### Bước 3: Update API Route

Code sẽ được update để dùng `redis` package thay vì REST API.

### Bước 4: Redeploy

```bash
git add .
git commit -m "Add Redis Labs support"
git push
```

Hoặc redeploy từ Vercel Dashboard.

## 🔄 Hoặc: Chuyển sang Upstash Redis (Khuyến nghị)

Nếu muốn dùng Upstash Redis qua Vercel Marketplace (đơn giản hơn):

1. **Tạo Upstash Redis trên Vercel:**
   - Vào Vercel Dashboard → Storage
   - Click "Create Database" → "Upstash Redis"
   - Connect với project
   - Vercel sẽ tự động thêm `KV_REST_API_URL` và `KV_REST_API_TOKEN`

2. **Code đã sẵn sàng:**
   - Code hiện tại đã support Upstash Redis REST API
   - Không cần thay đổi gì

## 📊 So sánh

### Redis Labs:
- ✅ Đã có connection string
- ❌ Cần cài thêm `redis` package
- ❌ Cần update code để dùng Redis client
- ❌ Không tự động sync env vars

### Upstash Redis (Vercel Marketplace):
- ✅ Tự động sync env vars
- ✅ Code đã sẵn sàng (dùng REST API)
- ✅ Không cần cài thêm package
- ❌ Cần tạo mới trên Vercel

## 🎯 Khuyến nghị

**Nếu muốn giữ Redis Labs hiện tại:**
- Follow Bước 1-4 ở trên
- Code sẽ được update để support Redis Labs

**Nếu muốn đơn giản hơn:**
- Tạo Upstash Redis trên Vercel Marketplace
- Code đã sẵn sàng, không cần thay đổi

Bạn muốn dùng Redis Labs hay chuyển sang Upstash Redis?
