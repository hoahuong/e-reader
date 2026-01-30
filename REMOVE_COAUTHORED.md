# Loại bỏ Co-authored-by từ Git Commits

## Vấn đề

Một số commits có trailer `Co-authored-by: Cursor <cursoragent@cursor.com>` được tự động thêm vào.

## Giải pháp

### 1. Đã tắt commit template tự động

Đã set empty commit template để không tự động thêm trailer.

### 2. Xóa trailer khỏi commits cũ (nếu cần)

Nếu muốn xóa trailer khỏi các commits đã push:

```bash
# Xóa trailer khỏi commit cuối cùng (chưa push)
git commit --amend --no-edit

# Hoặc chỉnh sửa message
git commit --amend -m "feat: Thêm UI chọn folder Google Drive khi upload và tạo folder mới"
```

**Lưu ý:** Nếu đã push lên GitHub, cần force push:
```bash
git push --force-with-lease origin main
```

### 3. Đảm bảo commits sau không có trailer

- ✅ Đã set empty commit template
- ✅ Các commits sau sẽ không tự động thêm trailer
- ✅ Chỉ cần commit message bình thường

## Cách commit không có trailer

```bash
# Commit bình thường (không có --trailer)
git commit -m "feat: Tính năng mới"

# Hoặc
git commit
# (Chỉ nhập message, không thêm trailer)
```

## Kiểm tra

```bash
# Xem commit message
git log -1 --format="%B"

# Không nên thấy "Co-authored-by"
```
