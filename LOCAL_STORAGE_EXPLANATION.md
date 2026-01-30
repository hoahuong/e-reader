# Giải thích về Local Storage

## ❌ Local Storage KHÔNG lưu trên Vercel Server

### Local Storage là gì?

**Local Storage** (bao gồm `IndexedDB` và `localStorage`) là **browser-side storage**:
- ✅ Lưu trữ **trên browser của user** (máy tính, điện thoại)
- ✅ Mỗi thiết bị có local storage **riêng biệt**
- ❌ **KHÔNG lưu trên server/Vercel**
- ❌ **KHÔNG sync giữa các thiết bị**

### Cách hoạt động:

```
┌─────────────────┐         ┌─────────────────┐
│   Máy tính      │         │   Điện thoại    │
│                 │         │                 │
│  IndexedDB      │         │  IndexedDB      │
│  (riêng biệt)   │         │  (riêng biệt)   │
└─────────────────┘         └─────────────────┘
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │   Vercel   │
              │   Server   │
              │            │
              │ ❌ KHÔNG   │
              │   lưu ở    │
              │   đây      │
              └────────────┘
```

### Vấn đề:

1. **Tạo catalog trên máy tính** → Lưu vào IndexedDB của máy tính
2. **Mở trên điện thoại** → IndexedDB của điện thoại rỗng → Không thấy catalog
3. **Không sync** giữa 2 thiết bị

## ✅ Giải pháp để sync giữa các thiết bị:

### Option 1: GitHub API Storage (Hiện tại đang dùng)
- ✅ Lưu metadata trên GitHub repository
- ✅ Sync giữa tất cả thiết bị
- ✅ Có version control
- ❌ Có thể timeout trên mobile network

### Option 2: Vercel Blob Storage
- ✅ Lưu trên Vercel Blob
- ✅ Sync giữa các thiết bị
- ❌ Có thể timeout với Hobby plan

### Option 3: Local Storage Only (Không sync)
- ✅ Nhanh, không cần network
- ✅ Hoạt động offline
- ❌ **KHÔNG sync giữa thiết bị**
- ❌ Mỗi thiết bị có data riêng

## 📝 Kết luận:

**Local Storage KHÔNG thể lưu trên Vercel server** vì:
- Local Storage là browser API, chỉ chạy trên client
- Vercel server không có quyền truy cập local storage của user
- Mỗi user có local storage riêng trên browser của họ

**Nếu muốn sync giữa các thiết bị**, bạn **PHẢI** dùng:
- ✅ Cloud storage (GitHub API, Vercel Blob, Firebase, etc.)
- ✅ Database (Vercel Postgres, Supabase, etc.)
- ✅ API để lưu/đọc data

**Local Storage chỉ dùng khi:**
- Không cần sync giữa thiết bị
- Chỉ dùng trên 1 thiết bị
- Hoặc làm backup tạm thời
