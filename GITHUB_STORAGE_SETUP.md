# Hướng dẫn setup GitHub Storage cho Metadata

## Bước 1: Tạo GitHub Personal Access Token

1. Vào GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Đặt tên token (ví dụ: "PDF Reader Metadata Sync")
4. Chọn scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click "Generate token"
6. **Copy token ngay** (chỉ hiển thị 1 lần)

## Bước 2: Set Environment Variables trên Vercel

1. Vào Vercel Dashboard → Project → Settings → Environment Variables
2. Thêm các biến sau:

```
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo-name
```

3. Click "Save"
4. Redeploy project để áp dụng changes

## Bước 3: Tạo folder `data` trong repository

1. Tạo folder `data` trong root của repository
2. File `metadata.json` sẽ được tự động tạo khi sync lần đầu

## Bước 4: Switch sang GitHub Storage

Trong code, thay đổi import từ:
```javascript
import { loadMetadataFromCloud, saveMetadataToCloud } from './metadataSync';
```

Thành:
```javascript
import { loadMetadataFromCloud, saveMetadataToCloud } from './metadataSyncGitHub';
```

## Lưu ý

- File `metadata.json` sẽ được commit vào GitHub repository
- Có thể xem/edit trực tiếp trên GitHub
- Mỗi lần sync sẽ tạo 1 commit mới
- Free và không giới hạn
