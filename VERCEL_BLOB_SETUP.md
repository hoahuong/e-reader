# Hướng dẫn Setup Vercel Blob Storage

## Bước 1: Cài đặt package

```bash
npm install
```

## Bước 2: Tạo Vercel Blob Store

1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Vào project của bạn
3. Vào tab **Storage**
4. Click **Create Database** → Chọn **Blob**
5. Đặt tên store (ví dụ: `pdf-storage`)
6. Chọn region gần bạn nhất
7. Click **Create**

## Bước 3: Lấy Token (tự động)

Vercel sẽ tự động inject token vào environment variables khi deploy. Không cần setup thủ công!

## Bước 4: Deploy

```bash
vercel --prod
```

Hoặc push code lên GitHub và Vercel sẽ tự động deploy.

## Bước 5: Kiểm tra

1. Upload một file PDF
2. Kiểm tra trong Vercel Dashboard → Storage → Blob store để thấy file đã upload
3. File sẽ có URL công khai và có thể truy cập từ bất kỳ đâu

## Lưu ý

- **Free tier**: 256MB storage, 1GB bandwidth/tháng
- **File công khai**: Tất cả PDF được upload với `access: 'public'` nên có thể truy cập trực tiếp qua URL
- **Bảo mật**: Nếu cần bảo mật, có thể thêm authentication sau

## Troubleshooting

### Lỗi: "BLOB_READ_WRITE_TOKEN is not defined"

- Đảm bảo đã tạo Blob store trong Vercel Dashboard
- Token sẽ tự động được inject khi deploy trên Vercel
- Nếu test local, có thể set environment variable tạm thời (không khuyến khích)

### Lỗi: "Cannot find module '@vercel/blob'"

```bash
npm install @vercel/blob
```

### API routes không hoạt động

- Đảm bảo file API routes nằm trong thư mục `/api/` ở root
- Vercel sẽ tự động nhận diện và deploy như serverless functions
