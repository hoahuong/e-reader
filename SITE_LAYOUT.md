# 📐 Bố cục và Cấu trúc Site

## 🏗️ Tổng quan Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    App Header                            │
│  📚 PDF Reader | 🌐 Language | 📁 Upload PDF            │
└─────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
   ┌────▼────┐                    ┌────▼────┐
   │  Home   │                    │  PDF    │
   │  Page   │                    │ Viewer  │
   └────┬────┘                    └─────────┘
        │
   ┌────┴────────────────────────────┐
   │                                  │
┌──▼──────────┐              ┌───────▼────────┐
│ Google      │              │ File Manager    │
│ Drive View  │              │ (Uploaded Files) │
└─────────────┘              └─────────────────┘
```

---

## 📱 Các Trang (Routes)

### 1. **Home Page** (`/` hoặc `/vi/` hoặc `/en/`)

**URL:** `https://reader-online.vercel.app/vi/`

**Bố cục:**
```
┌─────────────────────────────────────┐
│         Welcome Screen              │
│                                     │
│  👋 Chào mừng đến PDF Reader        │
│                                     │
│  ┌──────────┐  ┌──────────┐         │
│  │ 📁 Upload│  │ ☁️ Drive │         │
│  │   PDF    │  │  Google  │         │
│  └──────────┘  └──────────┘         │
│                                     │
│  ┌──────────┐                       │
│  │ 📋 Quản  │                       │
│  │   lý File│                       │
│  └──────────┘                       │
│                                     │
│  ✨ Tính năng:                      │
│  • Upload PDF                       │
│  • Quản lý files                    │
│  • Google Drive                     │
│  • Đọc PDF                          │
│  • Ghi chú                          │
└─────────────────────────────────────┘
```

**Tính năng:**
- Upload PDF button (mở file picker)
- Navigate đến Google Drive view
- Navigate đến File Manager
- Upload Modal (khi chọn file):
  - Catalog Selector
  - Drive Folder Selector
  - Upload button

---

### 2. **Google Drive View** (`/drive`)

**URL:** `https://reader-online.vercel.app/vi/drive`

**Bố cục:**
```
┌─────────────────────────────────────┐
│  ← Quay lại  |  ☁️ Google Drive     │
├─────────────────────────────────────┤
│                                     │
│  [🔐 Đăng nhập Google]              │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │ 📁 My    │  │ 👥 Shared│        │
│  │  Drive   │  │  Drives  │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  Navigation:                        │
│  • My Drive                         │
│  • Shared with me                   │
│  • Recent                           │
│  • Starred                          │
│                                     │
│  Folder Tree:                       │
│  📁 Documents                       │
│    📁 Work                          │
│    📁 Personal                      │
│  📁 Books                           │
│                                     │
│  Files List:                        │
│  📄 document1.pdf                   │
│  📄 document2.pdf                   │
└─────────────────────────────────────┘
```

**Tính năng:**
- Login/Logout Google
- Chọn Drive (My Drive / Shared Drives)
- Navigation views (My Drive, Shared, Recent, Starred)
- Folder tree với expand/collapse
- List PDF files trong folder
- Click file để đọc

---

### 3. **File Manager** (`/uploaded-list`)

**URL:** `https://reader-online.vercel.app/vi/uploaded-list`

**Bố cục:**
```
┌─────────────────────────────────────┐
│  ← Quay lại  |  📋 Quản lý Files    │
├─────────────────────────────────────┤
│  🔄 Sync  |  Filter: [All Catalogs] │
├─────────────────────────────────────┤
│                                     │
│  📂 Catalog 1                       │
│  ┌─────────────────────────────┐   │
│  │ 📄 file1.pdf        [✏️] [🗑️]│   │
│  │ 📄 file2.pdf        [✏️] [🗑️]│   │
│  └─────────────────────────────┘   │
│                                     │
│  📂 Catalog 2                       │
│  ┌─────────────────────────────┐   │
│  │ 📄 file3.pdf        [✏️] [🗑️]│   │
│  └─────────────────────────────┘   │
│                                     │
│  Drag & Drop:                      │
│  Kéo file để di chuyển giữa catalogs│
└─────────────────────────────────────┘
```

**Tính năng:**
- List tất cả files đã upload
- Group theo Catalog
- Drag & drop để di chuyển file giữa catalogs
- Edit catalog name
- Delete file/catalog
- Reorder catalogs
- Manual sync button

---

### 4. **PDF Viewer** (Khi đang đọc PDF)

**URL:** `https://reader-online.vercel.app/vi/` (không có route riêng)

**Bố cục:**
```
┌─────────────────────────────────────┐
│  ← Back  |  📄 filename.pdf  | 💾 📥│
├─────────────────────────────────────┤
│                                     │
│         ┌───────────────┐           │
│         │               │           │
│         │   PDF Page    │           │
│         │               │           │
│         └───────────────┘           │
│                                     │
│  [← Prev]  Page 1/100  [Next →]    │
│                                     │
│  Controls:                          │
│  • Zoom In/Out                      │
│  • Fit Width/Height                 │
│  • Fullscreen                       │
│  • Highlight text                   │
│  • Add note                         │
└─────────────────────────────────────┘
```

**Tính năng:**
- Đọc PDF với zoom, pan
- Highlight text
- Add notes/annotations
- Navigate pages
- Export annotations
- Import annotations
- Auto-hide header khi đọc

---

## 🧩 Components Structure

### Core Components:

1. **PDFViewerDirect.jsx**
   - PDF rendering
   - Text selection & highlight
   - Annotations
   - Zoom & navigation

2. **GoogleDriveViewer.jsx**
   - Google Drive integration
   - Folder navigation
   - File listing
   - Login/logout

3. **FileManager.jsx**
   - Uploaded files management
   - Catalog management
   - Drag & drop
   - Sync với cloud

4. **DriveFolderSelector.jsx** ⭐ MỚI
   - Chọn folder Google Drive
   - Tạo folder mới
   - Tree structure

5. **CatalogSelector.jsx**
   - Chọn catalog khi upload
   - Tạo catalog mới
   - Catalog suggestions

6. **LanguageSelector.jsx**
   - Chuyển đổi ngôn ngữ (VI/EN)

---

## 🔄 Data Flow

### Upload PDF Flow:

```
User chọn file PDF
    ↓
Upload Modal mở
    ↓
Chọn Catalog (trong app)
    ↓
Chọn Drive Folder (trên Google Drive) ⭐ MỚI
    ↓
Click Upload
    ↓
savePdf(file, catalog, driveFolderId)
    ↓
uploadPdfToDrive(file, driveFolderId) → Google Drive
    ↓
Cache metadata vào IndexedDB
    ↓
Sync metadata lên Redis (background)
    ↓
File hiển thị trong File Manager
```

### Read PDF Flow:

```
User click file
    ↓
getPdfData(fileId)
    ↓
Nếu có driveId → downloadPdfFile(driveId)
Nếu có URL → fetchPdfFromUrl(url)
Nếu local → get từ IndexedDB
    ↓
PDFViewerDirect render PDF
    ↓
User đọc, highlight, ghi chú
    ↓
Annotations lưu vào localStorage
```

---

## 💾 Storage Architecture

### PDF Files:
```
Google Drive (Cloud)
    ↓
15 GB free storage
    ↓
Files được upload vào folder đã chọn
    ↓
Metadata (id, name, url) cache trong IndexedDB
```

### Metadata (Catalogs, File List):
```
Vercel KV/Redis (Cloud)
    ↓
30K ops/day free
    ↓
Sync với IndexedDB (local cache)
    ↓
Fast access, không timeout
```

---

## 🎨 UI/UX Features

### Responsive Design:
- ✅ Mobile-friendly
- ✅ Tablet support
- ✅ Desktop optimized

### Language Support:
- ✅ Tiếng Việt (default)
- ✅ English
- ✅ URL-based routing (`/vi/`, `/en/`)

### User Experience:
- ✅ Auto-hide header khi đọc
- ✅ Smooth scrolling
- ✅ Drag & drop
- ✅ Keyboard shortcuts
- ✅ Loading states
- ✅ Error handling

---

## 📊 Feature Matrix

| Feature | Home | Drive | Manager | Viewer |
|---------|------|-------|---------|--------|
| Upload PDF | ✅ | ❌ | ✅ | ❌ |
| Chọn folder Drive | ✅ | ❌ | ❌ | ❌ |
| Tạo folder Drive | ✅ | ❌ | ❌ | ❌ |
| Browse Drive | ❌ | ✅ | ❌ | ❌ |
| Quản lý Catalog | ❌ | ❌ | ✅ | ❌ |
| Đọc PDF | ❌ | ✅ | ✅ | ✅ |
| Highlight/Note | ❌ | ❌ | ❌ | ✅ |
| Export annotations | ❌ | ❌ | ❌ | ✅ |

---

## 🔐 Authorization Flow

### Google Drive:
1. User click "Đăng nhập Google"
2. OAuth popup/redirect
3. User authorize
4. Token lưu trong localStorage
5. Dùng token để access Drive API

### Vercel:
- ✅ CLI đã login: `gnouhit-1521`
- ✅ Project đã link
- ✅ Environment variables đã set

---

## 📝 Routes Summary

```
/ (hoặc /vi/ hoặc /en/)
  ├── /drive → Google Drive View
  └── /uploaded-list → File Manager

(Khi đọc PDF, không có route riêng, chỉ render PDFViewerDirect)
```

---

## 🎯 Key Improvements Đã Thêm:

1. ✅ **Drive Folder Selector** - Chọn folder khi upload
2. ✅ **Create Folder** - Tạo folder mới trên Drive
3. ✅ **Folder Preference** - Nhớ folder đã chọn
4. ✅ **Google Drive Storage** - Upload PDF vào Drive
5. ✅ **Vercel KV Metadata** - Sync metadata nhanh

---

## 🚀 Next Steps:

1. Test upload với folder selection
2. Test tạo folder mới
3. Verify files trên Google Drive
4. Test metadata sync với Redis
