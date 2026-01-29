# Hướng dẫn Triển khai Miễn phí

## 🚀 Triển khai trên Vercel (Khuyến nghị - Dễ nhất)

### Bước 1: Đẩy code lên GitHub
```bash
# Nếu chưa có git repo
cd pdf-reader-app
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Tạo repo mới trên GitHub, sau đó:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Bước 2: Deploy trên Vercel
1. Truy cập https://vercel.com
2. Đăng nhập bằng GitHub account
3. Click "Add New Project"
4. Import repository từ GitHub
5. Vercel sẽ tự động detect Vite và cấu hình
6. Click "Deploy"
7. Đợi vài phút, bạn sẽ có URL miễn phí như: `https://your-app.vercel.app`

### Ưu điểm:
- ✅ Miễn phí hoàn toàn
- ✅ Tự động deploy khi push code mới
- ✅ SSL tự động
- ✅ CDN toàn cầu (nhanh)
- ✅ Preview cho mỗi PR
- ✅ Không cần cấu hình phức tạp

---

## 🌐 Triển khai trên Netlify

### Bước 1: Đẩy code lên GitHub (giống như trên)

### Bước 2: Deploy trên Netlify
1. Truy cập https://www.netlify.com
2. Đăng nhập bằng GitHub
3. Click "Add new site" → "Import an existing project"
4. Chọn repository
5. Cấu hình:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click "Deploy site"

### Ưu điểm:
- ✅ Miễn phí
- ✅ Tự động deploy
- ✅ SSL tự động
- ✅ Form handling miễn phí

---

## 📄 Triển khai trên GitHub Pages

### Bước 1: Cài đặt gh-pages
```bash
npm install --save-dev gh-pages
```

### Bước 2: Thêm script vào package.json
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

### Bước 3: Cập nhật vite.config.js
```js
export default defineConfig({
  base: '/YOUR_REPO_NAME/', // Tên repo của bạn
  // ... rest of config
})
```

### Bước 4: Deploy
```bash
npm run deploy
```

### Lưu ý:
- URL sẽ là: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`
- Cần rebuild và redeploy mỗi khi có thay đổi

---

## 🔧 Triển khai trên Render

1. Truy cập https://render.com
2. Đăng nhập bằng GitHub
3. Tạo "Static Site"
4. Connect repository
5. Cấu hình:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
6. Deploy

---

## 📝 Lưu ý quan trọng

### 1. Environment Variables
Nếu app cần biến môi trường, thêm vào Vercel/Netlify dashboard:
- Settings → Environment Variables

### 2. Build Optimization
Đảm bảo file `.gitignore` có:
```
node_modules/
dist/
.env.local
```

### 3. PDF Worker Path
Kiểm tra xem PDF worker có đúng path không trong production:
- File: `src/pdfWorkerConfig.js`
- Đảm bảo worker file được copy vào `public/`

### 4. Test Build Locally
Trước khi deploy, test build:
```bash
npm run build
npm run preview
```

---

## 🎯 Khuyến nghị

**Vercel** là lựa chọn tốt nhất vì:
- Setup đơn giản nhất
- Performance tốt nhất
- Tích hợp GitHub tốt
- Free tier rộng rãi

Sau khi deploy, bạn sẽ có URL công khai và app sẽ chạy 24/7 mà không cần mở Cursor!
