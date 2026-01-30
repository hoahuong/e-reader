# Quản lý Thư mục Google Drive trong App

## 📁 Cách hoạt động

### 1. Upload PDF vào folder nào?

**Mặc định:**
- Upload vào **My Drive (Root)** nếu chưa chọn folder

**Khi có chọn folder:**
- Upload vào folder đã chọn trên Google Drive
- Folder preference được lưu trong `localStorage`
- Lần upload sau sẽ tự động dùng folder đã chọn

### 2. Chọn folder khi upload

**Trong Upload Modal:**
1. Click nút upload PDF
2. Chọn file PDF
3. Modal hiển thị:
   - **Catalog Selector** (để phân loại trong app)
   - **Drive Folder Selector** (để chọn folder trên Google Drive)
4. Chọn folder từ danh sách hoặc tạo folder mới
5. Click "Upload"

### 3. Tạo folder mới

**Cách 1: Trong Upload Modal**
1. Click nút "➕ Tạo folder mới"
2. Nhập tên folder
3. Folder sẽ được tạo trong folder hiện tại đã chọn (hoặc root nếu chưa chọn)
4. Folder mới sẽ được chọn tự động

**Cách 2: Trên Google Drive**
- Tạo folder trực tiếp trên Google Drive
- Reload app để thấy folder mới trong danh sách

### 4. Quản lý folders

**Hiện tại hỗ trợ:**
- ✅ Xem danh sách folders (tree structure)
- ✅ Chọn folder để upload
- ✅ Tạo folder mới
- ✅ Expand/collapse folders

**Chưa hỗ trợ (có thể thêm sau):**
- ❌ Đổi tên folder
- ❌ Xóa folder
- ❌ Di chuyển folder

**Lưu ý:** Các thao tác này có thể làm trực tiếp trên Google Drive.

---

## 🔧 Cấu trúc Code

### Components:

1. **DriveFolderSelector.jsx**
   - Component để chọn folder
   - Hiển thị tree structure của folders
   - Cho phép tạo folder mới

2. **googleDrive.js**
   - `listFolders()` - Lấy danh sách folders
   - `createDriveFolder()` - Tạo folder mới
   - `uploadPdfToDrive()` - Upload PDF vào folder

### Data Flow:

```
User chọn file → Upload Modal
    ↓
Chọn Catalog (trong app)
    ↓
Chọn Drive Folder (trên Google Drive)
    ↓
Click Upload
    ↓
savePdf(file, catalog, driveFolderId)
    ↓
uploadPdfToDrive(file, driveFolderId)
    ↓
File được upload vào Google Drive folder
```

---

## 💾 Lưu trữ Preferences

**localStorage:**
- `pdf-upload-folder-id`: Lưu folder ID đã chọn lần cuối
- Tự động load khi mở upload modal

**IndexedDB:**
- Metadata của file (id, name, url, catalog, driveId)
- Không lưu folderId (vì file đã ở trong folder đó trên Drive)

---

## 📋 Ví dụ sử dụng

### Upload vào Root:
1. Chọn file PDF
2. Không chọn folder (hoặc chọn "My Drive (Root)")
3. Upload → File vào My Drive root

### Upload vào folder cụ thể:
1. Chọn file PDF
2. Chọn folder "Documents/PDFs" trong DriveFolderSelector
3. Upload → File vào folder đó trên Google Drive

### Tạo folder và upload:
1. Chọn file PDF
2. Click "➕ Tạo folder mới"
3. Nhập tên: "My PDFs"
4. Folder được tạo và tự động được chọn
5. Upload → File vào folder "My PDFs"

---

## 🎯 Best Practices

1. **Tổ chức folders:**
   - Tạo folder theo chủ đề: "Books", "Documents", "Work", etc.
   - Tạo subfolders để phân loại chi tiết hơn

2. **Sử dụng Catalog + Folder:**
   - **Catalog**: Phân loại trong app (metadata)
   - **Folder**: Tổ chức trên Google Drive (storage)
   - Có thể có nhiều catalogs nhưng cùng một folder

3. **Folder Preference:**
   - Folder đã chọn sẽ được nhớ cho lần upload sau
   - Có thể đổi folder bất cứ lúc nào

---

## 🔍 Kiểm tra file đã upload ở đâu

**Trên Google Drive:**
1. Vào https://drive.google.com
2. Tìm file theo tên (có timestamp prefix)
3. Xem folder chứa file

**Trong App:**
- File list hiển thị tất cả files đã upload
- Không hiển thị folder path (vì đã có catalog để phân loại)

---

## 💡 Tips

1. **Đặt tên folder rõ ràng:**
   - Dùng tiếng Việt có dấu được
   - Tránh ký tự đặc biệt

2. **Sử dụng folder structure:**
   ```
   My Drive/
   ├── Books/
   │   ├── Fiction/
   │   └── Non-Fiction/
   ├── Documents/
   │   ├── Work/
   │   └── Personal/
   └── PDFs/
   ```

3. **Sync với Catalog:**
   - Có thể map folder với catalog
   - Ví dụ: Folder "Books" → Catalog "Sách"
