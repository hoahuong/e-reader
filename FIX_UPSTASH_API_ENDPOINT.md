# 🔧 Fix: Upstash REST API Endpoint Format

## ❌ Vấn đề

API route timeout sau 10s vì endpoint format không đúng.

## ✅ Đã sửa

### 1. SET Command Format

**Trước (SAI):**
```javascript
fetch(`${KV_REST_API_URL}/set/${key}`, {
  method: 'POST',
  body: JSON.stringify(value),
})
```

**Sau (ĐÚNG):**
```javascript
// Upstash REST API: SET cần value trong URL path
const encodedValue = encodeURIComponent(JSON.stringify(value));
fetch(`${KV_REST_API_URL}/set/${key}/${encodedValue}`, {
  method: 'GET', // Upstash dùng GET cho SET command
})
```

### 2. Thêm Timeout

Thêm timeout 8s để tránh hang:
```javascript
signal: AbortSignal.timeout(8000)
```

### 3. Better Error Handling

Handle timeout errors properly:
```javascript
if (error.name === 'TimeoutError' || error.name === 'AbortError') {
  throw new Error('Redis request timeout');
}
```

## 📚 Upstash REST API Format

Theo [Upstash Documentation](https://upstash.com/docs/redis/features/restapi):

### GET Command
```
GET https://{region}-{database-name}-{id}.upstash.io/get/{key}
Headers: Authorization: Bearer {TOKEN}
```

### SET Command
```
GET https://{region}-{database-name}-{id}.upstash.io/set/{key}/{value}
Headers: Authorization: Bearer {TOKEN}
```

**Lưu ý**: 
- SET dùng **GET method**, không phải POST
- Value phải ở trong **URL path**, không phải body
- Value cần được **encode** để tránh special characters

## ✅ Test

Sau khi fix, test lại:

1. Redeploy project
2. Mở app và kiểm tra console logs
3. Sẽ thấy: `[Metadata Sync KV] Load thành công` thay vì timeout
