# Quick Setup - Set Vercel Environment Variables

## Option 1: Qua Vercel Dashboard (Dễ nhất - Khuyến nghị)

1. **Mở Vercel Dashboard:**
   - Vào: https://vercel.com/dashboard
   - Đăng nhập nếu chưa

2. **Chọn Project:**
   - Tìm và click vào project của bạn (có thể là `pdf-reader-app` hoặc tên khác)

3. **Vào Settings:**
   - Click tab **Settings** ở trên cùng
   - Scroll xuống phần **Environment Variables**

4. **Thêm các biến sau (click "Add New" cho mỗi biến):**

   **Biến 1:**
   - Key: `GITHUB_TOKEN`
   - Value: `[Paste token của bạn - đã được lưu trong .env.local]`
   - Environment: ✅ Production (và Preview nếu muốn)
   - Click **Save**

   **Biến 2:**
   - Key: `GITHUB_OWNER`
   - Value: `hoahuong`
   - Environment: ✅ Production
   - Click **Save**

   **Biến 3:**
   - Key: `GITHUB_REPO`
   - Value: `e-reader`
   - Environment: ✅ Production
   - Click **Save**

5. **Redeploy:**
   - Vào tab **Deployments**
   - Click vào deployment mới nhất
   - Click menu "..." → **Redeploy**
   - Hoặc đợi auto-deploy khi push code mới

## Option 2: Qua Vercel CLI

### Bước 1: Cài Vercel CLI (nếu chưa có)
```bash
npm i -g vercel
```

### Bước 2: Login vào Vercel
```bash
vercel login
```

### Bước 3: Link project (nếu chưa link)
```bash
cd /Users/admin/Documents/HOAHUONG/MYPJ/0.hoahuong/pdf-reader-app
vercel link
```

### Bước 4: Set environment variables
```bash
# Set GITHUB_TOKEN (paste token của bạn)
echo "[YOUR_GITHUB_TOKEN]" | vercel env add GITHUB_TOKEN production

# Set GITHUB_OWNER
echo "hoahuong" | vercel env add GITHUB_OWNER production

# Set GITHUB_REPO
echo "e-reader" | vercel env add GITHUB_REPO production
```

**Lưu ý:** Token đã được lưu trong `.env.local`, bạn có thể copy từ đó.

### Bước 5: Redeploy
```bash
vercel --prod
```

## Kiểm tra

Sau khi deploy, check logs trên Vercel để xem:
- Nếu thấy log `[Metadata Sync GitHub] Load thành công` → ✅ Đã setup đúng
- Nếu thấy lỗi về `GITHUB_TOKEN` → ❌ Cần kiểm tra lại env vars

## Lưu ý

- Token đã được lưu trong `.env.local` cho local development
- File `data/metadata.json` sẽ được tự động tạo trong repo khi sync lần đầu
- Mỗi lần sync sẽ tạo 1 commit mới trong repo `hoahuong/e-reader`
