# Vấn đề: Catalog và File List không sync giữa các devices

## 🔍 Nguyên nhân

### Hiện trạng:
1. **PDF Files**: Được lưu trên **Vercel Blob Storage** (cloud) ✅
   - Có thể truy cập từ mọi device qua URL
   - Sync giữa devices

2. **Metadata (Catalog & File List)**: Được lưu trong **IndexedDB** (local browser storage) ❌
   - IndexedDB là local storage của từng browser/device
   - **KHÔNG sync** giữa các devices
   - Mỗi device có IndexedDB riêng biệt

### Kết quả:
- Upload file từ máy tính → File lưu trên Vercel Blob ✅
- Catalog và file list lưu trong IndexedDB của máy tính ❌
- Mở trên điện thoại → IndexedDB của điện thoại rỗng → Không thấy catalog và file list ❌
- File PDF vẫn có thể truy cập qua URL, nhưng không biết file nào đã upload

---

## 💡 Giải pháp đề xuất

### Option 1: Sync Metadata lên Vercel Blob Storage (Khuyến nghị)

Lưu metadata (catalog và file list) lên Vercel Blob Storage dưới dạng JSON:

**Ưu điểm:**
- ✅ Đơn giản, không cần database riêng
- ✅ Tận dụng Vercel Blob đã có
- ✅ Sync tự động giữa devices
- ✅ Free tier đủ dùng cho metadata

**Cách hoạt động:**
1. Khi tạo/cập nhật catalog → Upload metadata JSON lên Vercel Blob
2. Khi upload file → Cập nhật file list JSON lên Vercel Blob
3. Khi load app → Fetch metadata từ Vercel Blob và sync với IndexedDB local

### Option 2: Sử dụng Database (Vercel Postgres hoặc Supabase)

**Ưu điểm:**
- ✅ Quản lý tốt hơn với queries
- ✅ Real-time sync
- ✅ Có thể thêm user authentication

**Nhược điểm:**
- ❌ Cần setup database riêng
- ❌ Có thể tốn phí

### Option 3: Sử dụng localStorage với Cloud Sync (Firebase/Supabase)

**Ưu điểm:**
- ✅ Real-time sync
- ✅ Có authentication

**Nhược điểm:**
- ❌ Cần thêm dependency
- ❌ Setup phức tạp hơn

---

## 🎯 Khuyến nghị: Option 1 - Vercel Blob Storage

### Implementation Plan:

1. **Tạo API routes:**
   - `GET /api/metadata` - Lấy metadata từ Vercel Blob
   - `POST /api/metadata` - Lưu metadata lên Vercel Blob

2. **Cập nhật catalogManager.js:**
   - Sync catalog lên cloud khi create/update/delete
   - Load catalog từ cloud khi app khởi động

3. **Cập nhật pdfStorage.js:**
   - Sync file list lên cloud khi upload/delete
   - Load file list từ cloud khi app khởi động

4. **Hybrid approach:**
   - IndexedDB làm cache local (fast access)
   - Vercel Blob làm source of truth (sync giữa devices)
   - Sync khi có thay đổi và khi app load

---

## 📝 Lưu ý

- Metadata JSON sẽ nhỏ (< 100KB) → Không tốn nhiều storage
- Có thể dùng một file JSON duy nhất hoặc tách riêng catalog và file list
- Cần handle conflict khi nhiều devices cùng update
