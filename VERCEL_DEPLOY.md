# 🚀 Hướng dẫn Deploy lên Vercel (Từng bước)

## ✅ Bước 1: Đăng nhập Vercel

1. Truy cập: https://vercel.com
2. Click **"Sign Up"** hoặc **"Log In"**
3. Chọn **"Continue with GitHub"** (khuyến nghị)
4. Authorize Vercel để truy cập GitHub account

---

## ✅ Bước 2: Import Project

1. Sau khi đăng nhập, bạn sẽ thấy Dashboard
2. Click **"Add New..."** → **"Project"**
3. Bạn sẽ thấy danh sách repositories từ GitHub
4. Tìm và click vào repository **`hoahuong/e-reader`**
5. Click **"Import"**

---

## ✅ Bước 3: Cấu hình Project

Vercel sẽ tự động detect Vite và cấu hình, nhưng bạn có thể kiểm tra:

### Framework Preset:
- ✅ **Vite** (tự động detect)

### Build Settings:
- **Build Command**: `npm run build` (tự động)
- **Output Directory**: `dist` (tự động)
- **Install Command**: `npm install` (tự động)

### Root Directory:
- Để trống (hoặc `./` nếu code ở root)

### Environment Variables:
- Không cần thêm gì cho app này

---

## ✅ Bước 4: Deploy

1. Click **"Deploy"** button
2. Đợi Vercel build và deploy (khoảng 2-5 phút)
3. Bạn sẽ thấy progress bar và logs

---

## ✅ Bước 5: Hoàn thành!

Sau khi deploy thành công:

1. **URL Production**: `https://e-reader-xxxxx.vercel.app`
   - Hoặc custom domain nếu bạn có

2. **Tự động deploy**: 
   - Mỗi khi bạn push code lên GitHub `main` branch
   - Vercel sẽ tự động deploy lại

3. **Preview Deployments**:
   - Mỗi PR sẽ có preview URL riêng

---

## 🔧 Troubleshooting

### Nếu build fail:

1. **Kiểm tra logs** trong Vercel dashboard
2. **Common issues**:
   - Node version: Vercel tự động dùng Node 18+
   - Missing dependencies: Kiểm tra `package.json`
   - Build errors: Xem logs chi tiết

### Nếu app không chạy đúng:

1. **Kiểm tra console** trong browser
2. **PDF Worker path**: Đảm bảo worker file ở `public/`
3. **Routes**: Vercel đã cấu hình rewrite trong `vercel.json`

---

## 📝 Lưu ý quan trọng

- ✅ Code đã được push lên GitHub: https://github.com/hoahuong/e-reader
- ✅ File `vercel.json` đã được cấu hình đúng
- ✅ Build test đã thành công local
- ✅ App sẽ chạy 24/7 sau khi deploy

---

## 🎯 Sau khi deploy

Bạn sẽ có:
- ✅ URL công khai để share
- ✅ SSL tự động (HTTPS)
- ✅ CDN toàn cầu (nhanh)
- ✅ Tự động deploy khi có code mới

**Chúc bạn deploy thành công! 🎉**
