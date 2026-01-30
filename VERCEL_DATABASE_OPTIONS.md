# Database Options trên Vercel

## ❌ KHÔNG thể tạo database cục bộ (SQLite) trên Vercel

### Tại sao?

**Vercel là Serverless Platform:**
- ❌ Không có persistent file system
- ❌ Mỗi function instance là ephemeral (tạm thời)
- ❌ Không thể lưu file database như SQLite
- ❌ Mỗi request có thể chạy trên instance khác nhau

**SQLite cần:**
- ✅ Persistent file system để lưu `.db` file
- ✅ Shared storage giữa các requests
- ❌ Không tương thích với Vercel architecture

## ✅ Các Database Options trên Vercel:

### Option 1: Vercel KV (Redis-compatible) ⭐ Khuyến nghị cho metadata

**Ưu điểm:**
- ✅ Serverless, không cần setup
- ✅ Low latency (< 1ms)
- ✅ Free tier: 30K reads/day, 30K writes/day
- ✅ Perfect cho key-value storage (metadata)
- ✅ Tích hợp sẵn với Vercel

**Nhược điểm:**
- ❌ Ephemeral data (có thể mất nếu không dùng)
- ❌ Không phải relational database

**Giá:**
- Free: 30K reads/day, 30K writes/day
- Pro: $0.20/100K reads, $0.20/100K writes

**Setup:**
```bash
# 1. Vào Vercel Dashboard → Storage → Create KV
# 2. Tự động có environment variables:
#    - KV_REST_API_URL
#    - KV_REST_API_TOKEN
#    - KV_REST_API_READ_ONLY_TOKEN
```

### Option 2: Vercel Postgres (qua Marketplace)

**Ưu điểm:**
- ✅ Relational database (SQL)
- ✅ Managed service (Neon/Supabase)
- ✅ Free tier có sẵn
- ✅ Tốt cho complex queries

**Nhược điểm:**
- ❌ Setup phức tạp hơn
- ❌ Overkill cho metadata đơn giản
- ❌ Có thể tốn phí nếu dùng nhiều

**Giá:**
- Free tier: 0.5GB storage, 1 project
- Pro: Tùy provider (Neon/Supabase)

### Option 3: Vercel Blob Storage (Đã có)

**Ưu điểm:**
- ✅ Đã setup sẵn
- ✅ Free tier: 1GB storage
- ✅ Tốt cho file storage

**Nhược điểm:**
- ❌ Không phải database
- ❌ Cần đọc/ghi toàn bộ file mỗi lần
- ❌ Có thể timeout với Hobby plan

### Option 4: External Database (Supabase, PlanetScale, etc.)

**Ưu điểm:**
- ✅ Free tier tốt
- ✅ Real-time sync
- ✅ Có authentication

**Nhược điểm:**
- ❌ Cần setup riêng
- ❌ Thêm dependency

## 🎯 Khuyến nghị cho use case của bạn:

### **Vercel KV** - Perfect cho metadata sync!

**Lý do:**
1. ✅ Key-value storage phù hợp với metadata (catalogs, files)
2. ✅ Nhanh hơn GitHub API (không timeout)
3. ✅ Free tier đủ dùng cho cá nhân
4. ✅ Setup đơn giản, tích hợp sẵn với Vercel
5. ✅ Không cần external service

**Cách hoạt động:**
```javascript
// Lưu metadata
await kv.set('metadata', JSON.stringify({ catalogs, files }));

// Đọc metadata
const metadata = JSON.parse(await kv.get('metadata'));
```

**So sánh với GitHub API:**
- ✅ Nhanh hơn (không timeout)
- ✅ Đơn giản hơn (không cần commit)
- ✅ Free tier đủ dùng
- ❌ Không có version control (nhưng không cần)

## 📝 Next Steps:

Nếu muốn dùng Vercel KV:
1. Tôi sẽ tạo implementation mới
2. Setup KV trên Vercel Dashboard
3. Update code để dùng KV thay vì GitHub API
4. Test và deploy

Bạn có muốn tôi implement Vercel KV không? 🚀
