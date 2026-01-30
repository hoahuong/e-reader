# 🐛 Fix: Error Message Formatting

## ❌ Vấn đề

1. **"[object Object]" trong error messages** - Error objects không được format đúng
2. **JSON parsing error trong metadataSyncKV** - API trả về code thay vì JSON
3. **Google Drive API 403 error** - Error không được extract đúng

## ✅ Giải pháp đã implement

### 1. Better Error Extraction trong DriveFolderSelector

```javascript
// Before
setError('Không thể tải danh sách folders: ' + err.message);

// After
let errorMessage = 'Lỗi không xác định';
if (err) {
  if (typeof err === 'string') {
    errorMessage = err;
  } else if (err.message) {
    errorMessage = err.message;
  } else if (err.error) {
    // Google API error format
    errorMessage = err.error.message || err.error.error || err.error;
  } else if (err.result?.error) {
    // Google API nested error
    const apiError = err.result.error;
    errorMessage = apiError.message || apiError.error || JSON.stringify(apiError);
  }
}
setError('Không thể tải danh sách folders: ' + errorMessage);
```

### 2. Content-Type Check trong metadataSyncKV

```javascript
// Check content-type để đảm bảo là JSON
const contentType = response.headers.get('content-type');
if (!contentType || !contentType.includes('application/json')) {
  const text = await response.text();
  console.error('[Metadata Sync KV] Response không phải JSON:', text.substring(0, 200));
  return null;
}

// Try-catch cho JSON parsing
try {
  metadata = await response.json();
} catch (jsonError) {
  console.error('[Metadata Sync KV] Lỗi parse JSON:', jsonError);
  return null;
}
```

### 3. Better Google Drive API Error Handling

```javascript
// Handle Google API errors properly
try {
  response = await window.gapi.client.drive.files.list(params);
} catch (apiError) {
  let errorMessage = 'Lỗi Google Drive API';
  if (apiError.result?.error) {
    const error = apiError.result.error;
    errorMessage = error.message || error.errors?.[0]?.message || error.error;
  } else if (apiError.message) {
    errorMessage = apiError.message;
  }
  throw new Error(errorMessage);
}
```

### 4. Better Redis Response Handling

```javascript
// Handle different Upstash response formats
if (data.result) {
  try {
    return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
  } catch (parseError) {
    console.error('[KV Metadata] Error parsing Redis result:', parseError);
    return null;
  }
}
```

## 🎯 Error Types Handled

1. **String errors** - `typeof err === 'string'`
2. **Error objects** - `err.message`
3. **Google API errors** - `err.error` hoặc `err.result.error`
4. **Nested errors** - `err.error.message` hoặc `err.error.errors[0].message`
5. **Unknown format** - `JSON.stringify(err)` as fallback

## ✅ Test Status

```
✅ Test Files  3 passed (3)
✅ Tests  14 passed (14)
```

## 📝 Benefits

1. **User-friendly errors**: Messages rõ ràng thay vì "[object Object]"
2. **Better debugging**: Console logs chi tiết hơn
3. **Robust**: Handle nhiều error formats
4. **Graceful degradation**: Không crash khi có lỗi
