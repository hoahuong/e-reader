# Hướng dẫn Switch Storage Options

## Vấn đề hiện tại

Nếu bạn gặp lỗi `FUNCTION_INVOCATION_TIMEOUT` hoặc `504 Gateway Timeout` khi lưu metadata:
- Đây là do Vercel serverless function timeout
- Với Hobby plan, timeout tối đa là 60s nhưng vẫn có thể timeout

## Giải pháp: Dùng Local Storage (Khuyến nghị)

**Local Storage không cần API call, không có timeout, hoạt động ngay lập tức.**

### Cách switch sang Local Storage:

1. Mở file `src/metadataSyncConfig.js`
2. Đảm bảo dòng này:
   ```javascript
   const STORAGE_TYPE = 'local'; // 'vercel-blob' | 'github' | 'local'
   ```
3. Deploy lại app

### Kết quả:
- ✅ Không còn lỗi timeout
- ✅ Lưu/load ngay lập tức
- ✅ Không cần cloud config
- ✅ Hoạt động offline hoàn toàn
- ⚠️ Không sync giữa devices (chỉ local)

## Nếu cần sync giữa devices

### Option 1: GitHub Storage (Free, Recommended)

1. Tạo GitHub Personal Access Token:
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token với scope `repo`

2. Set environment variables trên Vercel:
   ```
   GITHUB_TOKEN=ghp_xxxxxxxxxxxx
   GITHUB_OWNER=your-username
   GITHUB_REPO=your-repo-name
   ```

3. Đổi trong `src/metadataSyncConfig.js`:
   ```javascript
   const STORAGE_TYPE = 'github';
   ```

4. Deploy lại

### Option 2: Fix Vercel Blob (Nếu muốn giữ nguyên)

1. Kiểm tra `BLOB_READ_WRITE_TOKEN` đã được set chưa
2. Đổi trong `src/metadataSyncConfig.js`:
   ```javascript
   const STORAGE_TYPE = 'vercel-blob';
   ```
3. Có thể vẫn gặp timeout với files lớn

## So sánh các options

| Feature | Local Storage | GitHub Storage | Vercel Blob |
|---------|--------------|----------------|-------------|
| Setup | ✅ Không cần | ⚠️ Cần token | ⚠️ Cần token |
| Speed | ✅ Ngay lập tức | ⚠️ ~1-2s | ⚠️ ~1-5s |
| Sync devices | ❌ Không | ✅ Có | ✅ Có |
| Timeout | ✅ Không | ✅ Không | ⚠️ Có thể |
| Free | ✅ Có | ✅ Có | ⚠️ Có giới hạn |
| Version control | ❌ Không | ✅ Có | ❌ Không |

## Khuyến nghị

**Cho use case cá nhân (1 device):**
→ Dùng **Local Storage** - Đơn giản, nhanh, không lỗi

**Nếu cần sync giữa devices:**
→ Dùng **GitHub Storage** - Free, reliable, có version control
