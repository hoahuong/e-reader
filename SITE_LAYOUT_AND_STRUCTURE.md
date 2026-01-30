# 📐 Bố cục và Cấu trúc Site - PDF Reader App

## 🏗️ Tổng quan Kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                    App Header                           │
│  [Title] [Language Selector] [Upload PDF Button]      │
└─────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
   ┌────▼────┐                    ┌────▼────┐
   │  Home   │                    │  PDF    │
   │  Screen │                    │ Viewer  │
   └─────────┘                    └─────────┘
        │
   ┌────▼──────────────────────────────────┐
   │  Routes (Multi-language)              │
   │  /vi/ hoặc /en/                       │
   └───────────────────────────────────────┘
        │
   ┌────▼──────────────────────────────────┐
   │  • / (Home)                           │
   │  • /drive (Google Drive)              │
   │  • /uploaded-list (File Manager)      │
   └───────────────────────────────────────┘
```

---

## 📄 Các Trang (Routes)

### 1. **Home Page** (`/` hoặc `/vi/` hoặc `/en/`)

**Mục đích:** Trang chủ với các lựa chọn chính

**Bố cục:**
```
┌─────────────────────────────────────┐
│         Welcome Screen              │
│                                     │
│  👋 Chào mừng đến PDF Reader       │
│  Mô tả ứng dụng...                 │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │ 📁 Upload│  │☁️ Drive  │       │
│  │   PDF    │  │  View    │       │
│  └──────────┘  └──────────┘       │
│                                     │
│  ┌──────────┐                      │
│  │📋 Manage │                      │
│  │  Files   │                      │
│  └──────────┘                      │
│                                     │
│  ✨ Tính năng:                      │
│  • Upload PDF                       │
│  • Quản lý files                    │
│  • Google Drive                     │
│  • Đọc PDF                          │
│  • Ghi chú                          │
│  • ...                              │
└─────────────────────────────────────┘
```

**Tính năng:**
- ✅ Upload PDF button (mở file picker)
- ✅ Navigate to Google Drive View
- ✅ Navigate to File Manager
- ✅ Upload Modal với:
  - Catalog Selector
  - Drive Folder Selector (MỚI)
  - Upload button

---

### 2. **Google Drive View** (`/drive`)

**Mục đích:** Xem và chọn PDF từ Google Drive

**Bố cục:**
```
┌─────────────────────────────────────┐
│  ← Back to Home    ☁️ Google Drive │
├─────────────────────────────────────┤
│                                     │
│  [Login Button] (nếu chưa login)   │
│                                     │
│  Hoặc:                              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Navigation Tabs:             │   │
│  │ [My Drive] [Shared Drives]  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ View Mode:                  │   │
│  │ [📁 Folders] [📄 All]      │   │
│  │ [⭐ Starred] [🕒 Recent]    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Folder Tree:                │   │
│  │ 📁 Folder 1                 │   │
│  │   📁 Subfolder 1.1          │   │
│  │   📁 Subfolder 1.2          │   │
│  │ 📁 Folder 2                 │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ PDF Files List:            │   │
│  │ 📄 file1.pdf               │   │
│  │ 📄 file2.pdf               │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Tính năng:**
- ✅ Google OAuth Login
- ✅ List folders (tree structure)
- ✅ List PDF files
- ✅ Navigate folders
- ✅ Select và đọc PDF
- ✅ View modes: Folders, All, Starred, Recent, Trash
- ✅ Search files
- ✅ Sort files

---

### 3. **File Manager** (`/uploaded-list`)

**Mục đích:** Quản lý files đã upload và catalogs

**Bố cục:**
```
┌─────────────────────────────────────┐
│  ← Back    📋 Quản lý Files        │
│            [🔄 Sync Button]        │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Catalog List:                │   │
│  │ ┌──────────┐ ┌──────────┐ │   │
│  │ │📂 Books  │ │📂 Docs   │ │   │
│  │ │  (5)     │ │  (3)     │ │   │
│  │ └──────────┘ └──────────┘ │   │
│  │ [+ Tạo catalog mới]        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Files trong Catalog:        │   │
│  │ 📄 file1.pdf                │   │
│  │ 📄 file2.pdf                │   │
│  │ [Drag & Drop để di chuyển]  │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Tính năng:**
- ✅ List catalogs
- ✅ Create/Edit/Delete catalogs
- ✅ Reorder catalogs (drag & drop)
- ✅ List files trong mỗi catalog
- ✅ Move files giữa catalogs (drag & drop)
- ✅ Delete files
- ✅ Manual sync button
- ✅ Filter by catalog

---

### 4. **PDF Viewer** (Khi đang đọc PDF)

**Mục đích:** Đọc và annotate PDF

**Bố cục:**
```
┌─────────────────────────────────────┐
│  ← Back    📄 filename.pdf    💾📥 │
├─────────────────────────────────────┤
│                                     │
│         PDF Content Area            │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │      PDF Pages              │   │
│  │                             │   │
│  │  [Text Selection]          │   │
│  │  [Highlight]                │   │
│  │  [Annotations]               │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [◀ Prev]  Page 1/10  [Next ▶]     │
│                                     │
│  [Zoom Controls]                   │
│                                     │
└─────────────────────────────────────┘
```

**Tính năng:**
- ✅ Đọc PDF với PDF.js
- ✅ Text selection
- ✅ Highlight text
- ✅ Add annotations/notes
- ✅ Zoom in/out
- ✅ Page navigation
- ✅ Keyboard shortcuts
- ✅ Reading progress
- ✅ Export/Import annotations

---

## 🧩 Components

### **Core Components:**

1. **PDFViewerDirect.jsx**
   - PDF viewer chính
   - Text selection, highlight, annotations
   - Zoom, navigation
   - Keyboard shortcuts

2. **GoogleDriveViewer.jsx**
   - Google Drive integration
   - Folder navigation
   - File listing và selection
   - Multiple view modes

3. **FileManager.jsx**
   - Quản lý catalogs và files
   - Drag & drop
   - CRUD operations
   - Sync với cloud

4. **CatalogSelector.jsx**
   - Chọn catalog khi upload
   - Tạo catalog mới
   - Suggest catalog từ filename

5. **DriveFolderSelector.jsx** ⭐ MỚI
   - Chọn folder Google Drive khi upload
   - Tạo folder mới
   - Tree structure view

6. **LanguageSelector.jsx**
   - Chuyển đổi ngôn ngữ (Vi/En)
   - Lưu preference

---

## 🔄 User Flows

### **Flow 1: Upload PDF từ máy tính**

```
1. Home Page
   ↓
2. Click "📁 Upload PDF"
   ↓
3. Chọn file PDF từ máy tính
   ↓
4. Upload Modal mở:
   - Chọn Catalog (trong app)
   - Chọn Drive Folder (trên Google Drive) ⭐ MỚI
   - Có thể tạo folder mới ⭐ MỚI
   ↓
5. Click "Upload"
   ↓
6. File được upload lên Google Drive vào folder đã chọn
   ↓
7. Metadata được lưu vào Vercel KV ⭐ MỚI
   ↓
8. File hiển thị trong File Manager
   ↓
9. Có thể đọc ngay hoặc đọc sau
```

### **Flow 2: Đọc PDF từ Google Drive**

```
1. Home Page
   ↓
2. Click "☁️ Google Drive"
   ↓
3. Đăng nhập Google (nếu chưa)
   ↓
4. Navigate folders
   ↓
5. Chọn PDF file
   ↓
6. PDF Viewer mở
   ↓
7. Đọc và annotate
```

### **Flow 3: Quản lý Files**

```
1. Home Page
   ↓
2. Click "📋 Manage Files"
   ↓
3. File Manager mở:
   - Xem catalogs
   - Xem files trong mỗi catalog
   ↓
4. Có thể:
   - Tạo catalog mới
   - Di chuyển files (drag & drop)
   - Xóa files
   - Sync với cloud
```

---

## 💾 Data Storage

### **PDF Files:**
- **Google Drive** (Cloud) ⭐ MỚI
  - 15 GB free
  - Tổ chức theo folders
  - Sync giữa thiết bị

- **IndexedDB** (Local Browser)
  - Fallback nếu chưa login Google
  - Cache metadata

### **Metadata (Catalogs, File List):**
- **Vercel KV/Redis** (Cloud) ⭐ MỚI
  - 30K reads/day, 30K writes/day free
  - Low latency (< 1ms)
  - Sync giữa thiết bị

- **IndexedDB** (Local Browser)
  - Cache metadata
  - Load nhanh

### **Annotations:**
- **localStorage** (Local Browser)
  - Key: `pdf-annotations-{filename}`
  - Export/Import JSON

---

## 🎨 UI/UX Features

### **Responsive Design:**
- ✅ Mobile-friendly
- ✅ Tablet support
- ✅ Desktop optimized

### **Language Support:**
- ✅ Tiếng Việt (default)
- ✅ English
- ✅ URL-based routing (`/vi/`, `/en/`)

### **Accessibility:**
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ High contrast mode

### **Performance:**
- ✅ Lazy loading
- ✅ Code splitting
- ✅ Optimized PDF rendering

---

## 🔐 Authentication & Authorization

### **Google OAuth:**
- ✅ Client-side OAuth flow
- ✅ Access token management
- ✅ Auto logout khi token expire

### **Scopes:**
- `drive.readonly` - Đọc files
- `drive.file` - Upload files ⭐ MỚI

---

## 📱 Mobile Experience

### **Optimizations:**
- ✅ Touch gestures
- ✅ Swipe navigation
- ✅ Mobile-friendly modals
- ✅ Responsive layouts
- ✅ Scroll optimization

---

## 🚀 Tính năng Mới Đã Thêm

### **1. Google Drive Upload** ⭐
- Upload PDF vào folder cụ thể trên Google Drive
- Chọn folder khi upload
- Tạo folder mới trực tiếp trong app

### **2. Folder Management** ⭐
- Xem tree structure của folders
- Expand/collapse folders
- Tạo folder mới
- Lưu folder preference

### **3. Vercel KV Metadata Sync** ⭐
- Metadata sync với Vercel KV/Redis
- Low latency, không timeout
- Free tier đủ dùng

---

## 📊 Component Hierarchy

```
App
├── Header (khi không đọc PDF)
│   ├── Title
│   ├── LanguageSelector
│   └── Upload Button
│
├── Header Minimal (khi đọc PDF)
│   ├── Back Button
│   ├── File Name
│   └── Export/Import Buttons
│
└── Main Content
    ├── Routes
    │   ├── Home (/)
    │   │   ├── Welcome Screen
    │   │   ├── Upload Modal
    │   │   │   ├── CatalogSelector
    │   │   │   └── DriveFolderSelector ⭐
    │   │   └── Feature List
    │   │
    │   ├── Google Drive (/drive)
    │   │   └── GoogleDriveViewer
    │   │       ├── Login Button
    │   │       ├── Navigation Tabs
    │   │       ├── Folder Tree
    │   │       └── File List
    │   │
    │   └── File Manager (/uploaded-list)
    │       └── FileManager
    │           ├── Catalog List
    │           ├── File List
    │           └── Sync Button
    │
    └── PDF Viewer (khi đọc)
        └── PDFViewerDirect
            ├── PDF Canvas
            ├── Text Layer
            ├── Annotation Layer
            ├── Controls
            └── Sidebar (nếu có)
```

---

## 🎯 Navigation Structure

```
Home (/)
├── Upload PDF → Upload Modal
├── Google Drive (/drive) → GoogleDriveViewer
└── Manage Files (/uploaded-list) → FileManager

Google Drive (/drive)
├── Login → Google OAuth
├── Navigate Folders → Select PDF
└── Back to Home

File Manager (/uploaded-list)
├── View Catalogs
├── Manage Files
├── Sync → Cloud Sync
└── Back to Home

PDF Viewer (khi đọc)
├── Back → Return to previous page
├── Export Annotations
└── Import Annotations
```

---

## 📝 Key Features Summary

### **Core Features:**
- ✅ Upload PDF từ máy tính
- ✅ Upload PDF lên Google Drive vào folder cụ thể ⭐
- ✅ Đọc PDF từ Google Drive
- ✅ Quản lý catalogs và files
- ✅ Text selection và highlight
- ✅ Annotations/notes
- ✅ Zoom và navigation
- ✅ Export/Import annotations

### **Storage:**
- ✅ PDF Files → Google Drive (15 GB free) ⭐
- ✅ Metadata → Vercel KV/Redis (30K ops/day free) ⭐
- ✅ Annotations → localStorage

### **Sync:**
- ✅ Metadata sync giữa thiết bị (Vercel KV) ⭐
- ✅ PDF files sync (Google Drive) ⭐
- ✅ Folder preference (localStorage)

---

## 🎨 Design Patterns

### **State Management:**
- React useState/useEffect
- localStorage cho preferences
- IndexedDB cho local cache
- Cloud sync cho metadata

### **Routing:**
- React Router với language prefix
- URL-based navigation
- Browser history support

### **Error Handling:**
- Try-catch blocks
- User-friendly error messages
- Fallback mechanisms
- Retry logic

---

## 📱 Responsive Breakpoints

- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

---

## 🔄 Data Flow

```
User Action
    ↓
Component Handler
    ↓
Service Function (googleDrive.js, pdfStorage.js)
    ↓
API Route (nếu cần)
    ↓
Cloud Storage (Google Drive / Vercel KV)
    ↓
Update Local State
    ↓
Re-render UI
```

---

## 🎯 User Journey Map

### **Scenario 1: Upload và đọc PDF mới**
1. Vào Home → Click Upload
2. Chọn file → Chọn catalog → Chọn Drive folder ⭐
3. Upload → File lưu trên Drive
4. Tự động mở PDF Viewer
5. Đọc và annotate

### **Scenario 2: Đọc PDF từ Drive**
1. Vào Home → Click Google Drive
2. Login Google
3. Navigate folders → Chọn PDF
4. Đọc và annotate

### **Scenario 3: Quản lý files**
1. Vào Home → Click Manage Files
2. Xem catalogs và files
3. Tạo catalog mới hoặc di chuyển files
4. Sync với cloud

---

## 🚀 Performance Optimizations

- ✅ Lazy loading components
- ✅ Code splitting
- ✅ Image optimization
- ✅ PDF rendering optimization
- ✅ Debounced search
- ✅ Virtual scrolling (nếu cần)

---

## 📚 File Structure

```
src/
├── App.jsx (Main app, routing)
├── components/
│   ├── PDFViewerDirect.jsx
│   ├── GoogleDriveViewer.jsx
│   ├── FileManager.jsx
│   ├── CatalogSelector.jsx
│   ├── DriveFolderSelector.jsx ⭐
│   └── LanguageSelector.jsx
├── services/
│   ├── googleDrive.js
│   └── googleDriveRedirect.js
├── pdfStorage.js
├── catalogManager.js
├── metadataSyncConfig.js
├── metadataSyncKV.js ⭐
└── i18n/
    └── locales.js

api/
├── upload-pdf-google-drive.js ⭐
├── kv-metadata.js ⭐
└── github-metadata.js
```

---

## 🎉 Kết luận

App đã được cải thiện với:
- ✅ Google Drive storage cho PDF files
- ✅ Vercel KV cho metadata sync
- ✅ Folder management UI
- ✅ Tích hợp hoàn chỉnh giữa các components

**Chi phí:** $0/month (free tier đủ dùng)
**Hiệu năng:** Tốt, không timeout
**User Experience:** Tốt, dễ sử dụng
