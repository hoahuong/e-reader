# Hướng dẫn Set Environment Variables trên Vercel

## Environment Variables cần set:

1. Vào Vercel Dashboard: https://vercel.com/dashboard
2. Chọn project `pdf-reader-app` (hoặc tên project của bạn)
3. Vào **Settings** → **Environment Variables**
4. Thêm các biến sau:

### GitHub Storage Variables:

```
GITHUB_TOKEN = [YOUR_GITHUB_TOKEN]
GITHUB_OWNER = hoahuong
GITHUB_REPO = e-reader
```

### Cách thêm:

1. Click **Add New**
2. **Key**: `GITHUB_TOKEN`
3. **Value**: `[Paste token của bạn ở đây]`
4. Chọn **Environment**: Production, Preview, Development (hoặc chỉ Production)
5. Click **Save**

Lặp lại cho:
- `GITHUB_OWNER` = `hoahuong`
- `GITHUB_REPO` = `e-reader`

**Lưu ý:** Token đã được lưu trong `.env.local` cho local development. Trên Vercel, bạn cần tự set lại.

### Sau khi set xong:

1. **Redeploy** project để áp dụng changes
2. Hoặc Vercel sẽ tự động redeploy khi bạn push code mới

## Kiểm tra:

Sau khi deploy, check logs trên Vercel để xem có lỗi gì không. Nếu thấy log `[Metadata Sync GitHub] Load thành công` thì đã setup đúng.

## Lưu ý:

- Token này có quyền truy cập repo, giữ bí mật
- File `data/metadata.json` sẽ được tự động tạo trong repo khi sync lần đầu
- Mỗi lần sync sẽ tạo 1 commit mới trong repo
