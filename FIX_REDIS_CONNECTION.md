# 🔧 Fix: Redis chưa được connect với project

## ❌ Vấn đề

Bạn đã tạo Redis database "ereader" nhưng env vars `KV_REST_API_URL` và `KV_REST_API_TOKEN` không xuất hiện trên Vercel Dashboard.

**Nguyên nhân**: Redis database chưa được connect đúng với project.

## ✅ Giải pháp

### Cách 1: Connect Redis với Project (Khuyến nghị)

1. **Vào Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Chọn project của bạn

2. **Vào Storage tab:**
   - Click tab **Storage** (hoặc **Integrations**)
   - Tìm database **"ereader"**

3. **Kiểm tra connection:**
   - Click vào database "ereader"
   - Xem phần **"Connected Projects"** hoặc **"Linked Projects"**
   - Nếu không thấy project của bạn → Cần connect

4. **Connect database với project:**
   - Tìm nút **"Connect"**, **"Link Project"**, hoặc **"Attach to Project"**
   - Chọn project của bạn từ dropdown
   - Click **"Connect"** hoặc **"Save"**

5. **Đợi vài giây:**
   - Vercel sẽ tự động thêm env vars
   - Refresh trang Settings → Environment Variables
   - Bây giờ sẽ thấy `KV_REST_API_URL` và `KV_REST_API_TOKEN`

### Cách 2: Tạo lại Redis và Connect ngay từ đầu

Nếu Cách 1 không hoạt động:

1. **Xóa database "ereader" cũ:**
   - Vào Storage tab
   - Click vào "ereader"
   - Tìm nút **"Delete"** hoặc **"Remove"**
   - Xác nhận xóa

2. **Tạo Redis mới:**
   - Click **"Create Database"** hoặc **"Browse Marketplace"**
   - Tìm **"Upstash Redis"**
   - Click **"Add Integration"**

3. **Khi tạo, chọn project ngay:**
   - Trong form tạo, có phần **"Connect to Project"**
   - Chọn project của bạn
   - Đặt tên: **"ereader"** (hoặc tên khác)
   - Click **"Create"**

4. **Verify:**
   - Sau khi tạo, vào Settings → Environment Variables
   - Sẽ thấy env vars được tự động thêm

### Cách 3: Manually Add Environment Variables (Nếu cần)

Nếu vẫn không tự động, có thể manually add:

1. **Lấy credentials từ Upstash:**
   - Vào: https://console.upstash.com/
   - Login với Google account (cùng account dùng cho Vercel)
   - Tìm database "ereader"
   - Copy **REST API URL** và **REST API Token**

2. **Add vào Vercel:**
   - Vào Vercel Dashboard → Settings → Environment Variables
   - Click **"Add New"**
   - Name: `KV_REST_API_URL`
   - Value: Paste REST API URL (bắt đầu bằng `https://`)
   - Environments: Chọn **Production**, **Preview**, **Development**
   - Click **"Save"**

   - Lặp lại cho `KV_REST_API_TOKEN`:
     - Name: `KV_REST_API_TOKEN`
     - Value: Paste REST API Token
     - Environments: Chọn tất cả
     - Click **"Save"**

## 🔍 Verify Setup

Sau khi connect hoặc add env vars:

1. **Kiểm tra env vars:**
   ```bash
   vercel env ls | grep KV
   ```
   
   Sẽ thấy:
   ```
   KV_REST_API_URL    Production, Preview, Development
   KV_REST_API_TOKEN  Production, Preview, Development
   ```

2. **Redeploy project:**
   - Vercel Dashboard → Deployments → ... → Redeploy
   - Hoặc: `git push` để trigger auto-deploy

3. **Test API:**
   - Mở app: https://reader-online.vercel.app
   - Mở Browser Console (F12)
   - Kiểm tra logs:
     - ✅ `[Metadata Sync KV] Load thành công` → Thành công!
     - ❌ `503 Service Unavailable` → Vẫn thiếu env vars

## 📝 Checklist

- [ ] Đã vào Storage tab và kiểm tra database "ereader"
- [ ] Đã verify database được connect với project
- [ ] Đã thấy `KV_REST_API_URL` và `KV_REST_API_TOKEN` trong Environment Variables
- [ ] Đã redeploy project
- [ ] Đã test và thấy `[Metadata Sync KV] Load thành công`

## 🎯 Khuyến nghị

**Thử Cách 1 trước** (connect database với project) - Đơn giản nhất và đúng cách nhất.

Nếu không được, thử **Cách 2** (tạo lại và connect ngay từ đầu).

Chỉ dùng **Cách 3** (manually add) nếu 2 cách trên không hoạt động.
