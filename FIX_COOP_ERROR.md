# 🔧 Fix: Cross-Origin-Opener-Policy (COOP) Error với Google Picker

## ❌ Vấn đề

Lỗi: `Cross-Origin-Opener-Policy policy would block the window.opener call`

**Nguyên nhân**: Browser security policy (COOP) block cross-origin window communication mà Google Picker cần.

## ✅ Giải pháp đã implement

### 1. Set COOP Header trong Vite Config

Thêm headers vào `vite.config.js`:
```javascript
headers: {
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups', // Cho phép popup từ same origin
  'Cross-Origin-Embedder-Policy': 'unsafe-none', // Không block cross-origin embeds
}
```

### 2. Set Origin trong Picker Builder

Thêm `.setOrigin()` vào Picker:
```javascript
const pickerBuilder = new google.picker.PickerBuilder()
  .setOAuthToken(token.access_token)
  .setOrigin(window.location.origin) // Set origin để tránh COOP error
  .addView(docsView)
  // ...
```

### 3. Better Error Handling

- Try-catch khi build/show picker
- Fallback message nếu picker không hoạt động
- User vẫn có thể chọn folder từ danh sách bên dưới

## 🔍 COOP Headers Explained

### `same-origin-allow-popups`
- Cho phép popup từ same origin
- Google Picker cần popup để hoạt động
- Vẫn giữ security nhưng cho phép popup

### `unsafe-none` (COEP)
- Không block cross-origin embeds
- Google Picker cần embed content từ Google domains
- `unsafe-none` cho phép điều này

## 📝 Lưu ý

- Headers này chỉ áp dụng cho **development** (Vite dev server)
- **Production** (Vercel) sẽ có headers riêng
- Nếu vẫn lỗi trên production, cần config headers trên Vercel

## ✅ Test

1. Restart dev server: `npm run dev`
2. Click "🔍 Tìm folder bằng Google Drive"
3. Google Picker sẽ mở không còn COOP error
4. Nếu vẫn lỗi, user có thể chọn folder từ danh sách

## 🐛 Troubleshooting

### Nếu vẫn lỗi trên production:

Cần config headers trên Vercel:
1. Vào Vercel Dashboard → Project → Settings → Headers
2. Thêm:
   - `Cross-Origin-Opener-Policy: same-origin-allow-popups`
   - `Cross-Origin-Embedder-Policy: unsafe-none`

Hoặc trong `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin-allow-popups"
        },
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "unsafe-none"
        }
      ]
    }
  ]
}
```
