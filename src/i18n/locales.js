/**
 * Internationalization (i18n) - Đa ngôn ngữ
 * Hỗ trợ tiếng Việt và tiếng Anh
 */

export const translations = {
  vi: {
    // Navigation
    'nav.myDrive': 'Drive của tôi',
    'nav.sharedWithMe': 'Được chia sẻ với tôi',
    'nav.recent': 'Gần đây',
    'nav.starred': 'Có gắn dấu sao',
    'nav.trash': 'Thùng rác',
    'nav.sharedDrives': 'Shared Drives',
    
    // Header
    'header.search': 'Tìm kiếm trong Drive',
    'header.login': 'Đăng nhập',
    'header.logout': 'Đăng xuất',
    'header.selectPdf': 'Chọn PDF',
    
    // Toolbar
    'toolbar.sortBy': 'Sắp xếp theo',
    'toolbar.sort.name': 'Tên',
    'toolbar.sort.modified': 'Ngày sửa đổi',
    'toolbar.sort.size': 'Kích thước',
    'toolbar.view.list': 'Danh sách',
    'toolbar.view.grid': 'Lưới',
    
    // Views
    'view.myDrive': 'Drive của tôi',
    'view.sharedWithMe': 'Được chia sẻ với tôi',
    'view.recent': 'Gần đây',
    'view.starred': 'Có gắn dấu sao',
    'view.trash': 'Thùng rác',
    
    // Messages
    'msg.loading': 'Đang tải...',
    'msg.noFiles': 'Không có files',
    'msg.noFolders': 'Không có folders',
    'msg.error': 'Lỗi',
    'msg.errorLoading': 'Không thể tải dữ liệu',
    'msg.loginRequired': 'Vui lòng đăng nhập để tiếp tục',
    'msg.initializing': 'Đang khởi tạo Google API...',
    
    // File types
    'file.folder': 'Thư mục',
    'file.pdf': 'PDF',
    'file.image': 'Hình ảnh',
    'file.document': 'Tài liệu',
    'file.unknown': 'File',
    
    // Actions
    'action.open': 'Mở',
    'action.download': 'Tải xuống',
    'action.delete': 'Xóa',
    'action.share': 'Chia sẻ',
    
    // App
    'app.title': 'PDF Reader - bà già (baza)',
    'app.welcome': 'Chào mừng đến với PDF Reader!',
    'app.description': 'Ứng dụng đọc PDF với đầy đủ tính năng ghi chú và điều hướng',
    'app.upload': 'Upload PDF (chọn file để tải lên và đọc)',
    'app.googleDrive': 'Google Drive',
    'app.manageFiles': 'Quản lý Files đã Upload',
    'app.backToHome': '← Về Trang chủ',
    'app.features': 'Tính năng',
    'app.feature.upload': 'Upload PDF và lưu vào danh sách',
    'app.feature.manage': 'Quản lý files với catalog và drag & drop',
    'app.feature.drive': 'Truy cập Google Drive đầy đủ',
    'app.feature.read': 'Đọc PDF mượt mà',
    'app.feature.annotate': 'Ghi chú trực tiếp trên PDF',
    'app.feature.zoom': 'Zoom in/out',
    'app.feature.navigate': 'Điều hướng trang dễ dàng',
    'app.feature.save': 'Tự động lưu ghi chú',
    'app.feature.export': 'Xuất/Nhập ghi chú',
    
    // File Manager
    'fileManager.title': 'Quản lý Files đã Upload',
    'fileManager.createCatalog': '+ Tạo Catalog',
    'fileManager.edit': 'Chỉnh sửa',
    'fileManager.delete': 'Xóa',
    'fileManager.noCatalog': 'Không có catalog',
    'fileManager.dragHere': 'Kéo thả files vào đây',
    'fileManager.deleteFile': 'Xóa file này?',
    'fileManager.deleteCatalog': 'Xóa catalog này? Files sẽ được chuyển về "Không có catalog"',
    'fileManager.catalogName': 'Nhập tên catalog mới:',
    'fileManager.loading': 'Đang tải...',
    'fileManager.error': 'Lỗi khi tải dữ liệu',
    'fileManager.retry': 'Thử lại',
    
    // Language
    'lang.select': 'Ngôn ngữ',
    'lang.vi': 'Tiếng Việt',
    'lang.en': 'English',
  },
  en: {
    // Navigation
    'nav.myDrive': 'My Drive',
    'nav.sharedWithMe': 'Shared with me',
    'nav.recent': 'Recent',
    'nav.starred': 'Starred',
    'nav.trash': 'Trash',
    'nav.sharedDrives': 'Shared Drives',
    
    // Header
    'header.search': 'Search in Drive',
    'header.login': 'Sign in',
    'header.logout': 'Sign out',
    'header.selectPdf': 'Select PDF',
    
    // Toolbar
    'toolbar.sortBy': 'Sort by',
    'toolbar.sort.name': 'Name',
    'toolbar.sort.modified': 'Modified',
    'toolbar.sort.size': 'Size',
    'toolbar.view.list': 'List',
    'toolbar.view.grid': 'Grid',
    
    // Views
    'view.myDrive': 'My Drive',
    'view.sharedWithMe': 'Shared with me',
    'view.recent': 'Recent',
    'view.starred': 'Starred',
    'view.trash': 'Trash',
    
    // Messages
    'msg.loading': 'Loading...',
    'msg.noFiles': 'No files',
    'msg.noFolders': 'No folders',
    'msg.error': 'Error',
    'msg.errorLoading': 'Failed to load data',
    'msg.loginRequired': 'Please sign in to continue',
    'msg.initializing': 'Initializing Google API...',
    
    // File types
    'file.folder': 'Folder',
    'file.pdf': 'PDF',
    'file.image': 'Image',
    'file.document': 'Document',
    'file.unknown': 'File',
    
    // Actions
    'action.open': 'Open',
    'action.download': 'Download',
    'action.delete': 'Delete',
    'action.share': 'Share',
    
    // App
    'app.title': 'PDF Reader - bà già (baza)',
    'app.welcome': 'Welcome to PDF Reader!',
    'app.description': 'PDF reading app with full annotation and navigation features',
    'app.upload': 'Upload PDF (select file to upload and read)',
    'app.googleDrive': 'Google Drive',
    'app.manageFiles': 'Manage Uploaded Files',
    'app.backToHome': '← Back to Home',
    'app.features': 'Features',
    'app.feature.upload': 'Upload PDF and save to list',
    'app.feature.manage': 'Manage files with catalog and drag & drop',
    'app.feature.drive': 'Full Google Drive access',
    'app.feature.read': 'Smooth PDF reading',
    'app.feature.annotate': 'Annotate directly on PDF',
    'app.feature.zoom': 'Zoom in/out',
    'app.feature.navigate': 'Easy page navigation',
    'app.feature.save': 'Auto-save annotations',
    'app.feature.export': 'Export/Import annotations',
    
    // File Manager
    'fileManager.title': 'Manage Uploaded Files',
    'fileManager.createCatalog': '+ Create Catalog',
    'fileManager.edit': 'Edit',
    'fileManager.delete': 'Delete',
    'fileManager.noCatalog': 'No catalog',
    'fileManager.dragHere': 'Drag files here',
    'fileManager.deleteFile': 'Delete this file?',
    'fileManager.deleteCatalog': 'Delete this catalog? Files will be moved to "No catalog"',
    'fileManager.catalogName': 'Enter new catalog name:',
    'fileManager.loading': 'Loading...',
    'fileManager.error': 'Error loading data',
    'fileManager.retry': 'Retry',
    
    // Language
    'lang.select': 'Language',
    'lang.vi': 'Tiếng Việt',
    'lang.en': 'English',
  },
};

// Get current language from localStorage or default to Vietnamese
export function getCurrentLanguage() {
  const saved = localStorage.getItem('pdfReaderLanguage');
  return saved || 'vi';
}

// Set current language
export function setCurrentLanguage(lang) {
  localStorage.setItem('pdfReaderLanguage', lang);
}

// Get translation
export function t(key, lang = null) {
  const currentLang = lang || getCurrentLanguage();
  return translations[currentLang]?.[key] || key;
}
