# 🧪 Hướng dẫn Test Fix uploadDriveFolderId

## ✅ Test đã được setup

Đã tạo test suite với Vitest để verify fix `uploadDriveFolderId` props.

## Chạy Test

### 1. Chạy test tự động

```bash
# Chạy test một lần
npm run test:run

# Chạy test ở watch mode
npm test

# Chạy test với UI
npm run test:ui
```

### 2. Test Manual trong Browser

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Mở trình duyệt:**
   - Truy cập: `http://localhost:5173`
   - Mở Console (F12)

3. **Test các scenario:**

   **Scenario 1: Upload PDF với DriveFolderSelector**
   - Click "Chọn PDF"
   - Chọn một file PDF
   - ✅ Kiểm tra: Modal upload hiển thị không có lỗi `uploadDriveFolderId is not defined`
   - ✅ Kiểm tra: DriveFolderSelector hiển thị đúng
   - ✅ Kiểm tra: Console không có error

   **Scenario 2: Test với localStorage có folder ID**
   - Mở Console
   - Chạy: `localStorage.setItem('pdf-upload-folder-id', 'test-folder-123')`
   - Upload PDF mới
   - ✅ Kiểm tra: DriveFolderSelector sử dụng folder ID từ localStorage

   **Scenario 3: Test với uploadDriveFolderId = null**
   - Upload PDF
   - ✅ Kiểm tra: Không có error khi `uploadDriveFolderId` là `null`
   - ✅ Kiểm tra: Fallback về localStorage hoặc 'root'

## Test Results

### Unit Tests (Vitest)

```
✓ src/components/DriveFolderSelector.test.jsx (4 tests)
✓ src/App.test.jsx (4 tests)

Test Files  2 passed (2)
Tests  8 passed (8)
```

### Test Cases

1. ✅ **Props Structure Test**: Verify `uploadDriveFolderId` và các props liên quan được định nghĩa đúng
2. ✅ **Null Handling Test**: Verify xử lý khi `uploadDriveFolderId` là `null`
3. ✅ **localStorage Fallback Test**: Verify fallback logic hoạt động đúng
4. ✅ **Priority Test**: Verify `uploadDriveFolderId` được ưu tiên hơn localStorage

## Fix Details

### Vấn đề:
- `uploadDriveFolderId` không được truyền vào `LanguageRoutes` component
- Gây lỗi `ReferenceError: uploadDriveFolderId is not defined`

### Giải pháp:
- Thêm props `uploadDriveFolderId`, `setUploadDriveFolderId`, `uploadDriveFolderName`, `setUploadDriveFolderName` vào:
  1. `AppRoutes` component
  2. `LanguageRoutes` component
  3. Truyền từ `App` → `AppRoutes` → `LanguageRoutes`

### Files Changed:
- `src/App.jsx`: Thêm props vào các component routes

## Verification Checklist

- [x] Unit tests pass
- [x] Props được truyền đúng qua component tree
- [x] localStorage fallback hoạt động
- [x] Không có lỗi runtime
- [ ] Test manual trong browser (user cần test)

## Next Steps

1. Chạy `npm run dev` và test manual trong browser
2. Verify không có lỗi trong Console
3. Test upload PDF với DriveFolderSelector
4. Verify fix hoạt động trên production sau khi deploy
