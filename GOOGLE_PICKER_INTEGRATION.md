# ✅ Tích hợp Google Drive Picker API

## 🎯 Thay đổi

Đã thay thế custom search input bằng **Google Drive Picker API** để dùng thanh search native của Google Drive.

## ✅ Đã implement

### 1. Load Google Picker API Script

Thêm vào `loadGoogleAPIs()`:
```javascript
// Load Google Picker API
const pickerScript = document.createElement('script');
pickerScript.src = 'https://apis.google.com/js/picker.js';
```

### 2. Tạo `openDriveFolderPicker()` Function

Trong `src/services/googleDrive.js`:
```javascript
export async function openDriveFolderPicker(callback) {
  // Tạo DocsView với folder selection enabled
  const docsView = new google.picker.DocsView(google.picker.ViewId.DOCS)
    .setIncludeFolders(true)
    .setMimeTypes('application/vnd.google-apps.folder')
    .setSelectFolderEnabled(true);

  // Tạo Picker với OAuth token
  const picker = new google.picker.PickerBuilder()
    .setOAuthToken(token.access_token)
    .addView(docsView)
    .setCallback((data) => {
      if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
        const folder = data[google.picker.Response.DOCUMENTS][0];
        callback(folder.id, folder.name);
      }
    })
    .build();

  picker.setVisible(true);
}
```

### 3. Thay thế Search Input bằng Picker Button

Trong `DriveFolderSelector.jsx`:
- ❌ Xóa: Custom search input với `searchQuery` state
- ✅ Thêm: Button "🔍 Tìm folder bằng Google Drive"
- ✅ Click button → Mở Google Drive Picker với search native

### 4. UI Improvements

- Button có gradient Google blue
- Hiển thị folder đã chọn sau khi pick
- Loading state khi đang mở picker

## 🎯 Lợi ích

1. **Search chính xác hơn**: Dùng Google Drive search engine
2. **UI native**: Giống như trên Google Drive
3. **Tìm kiếm mạnh**: Search theo tên, nội dung, metadata
4. **Dễ sử dụng**: User đã quen với Google Drive UI

## 📝 Cách sử dụng

1. Click button **"🔍 Tìm folder bằng Google Drive"**
2. Google Drive Picker sẽ mở với search bar
3. Tìm folder bằng Google Drive search
4. Chọn folder và click "Select"
5. Folder sẽ được chọn và hiển thị trong preview

## 🔍 Technical Details

### Google Picker API Requirements

- ✅ OAuth token (đã có từ login)
- ✅ Google Picker API script loaded
- ⚠️ API Key (optional nhưng khuyến nghị)

### Picker Configuration

```javascript
.setIncludeFolders(true)           // Include folders
.setMimeTypes('application/vnd.google-apps.folder')  // Chỉ folders
.setSelectFolderEnabled(true)      // Enable folder selection
```

## ✅ Test

1. Login Google
2. Click "🔍 Tìm folder bằng Google Drive"
3. Google Picker sẽ mở
4. Search folder và chọn
5. Folder sẽ được set trong upload modal
