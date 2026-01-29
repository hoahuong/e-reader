# Các phương án lưu trữ metadata thay thế

## Vấn đề hiện tại
- Metadata được lưu trên Vercel Blob Storage
- Catalog tạo thành công nhưng không tìm thấy khi load lại từ cloud
- Có thể do API timeout hoặc blob storage không hoạt động đúng

## Các phương án thay thế

### Option 1: GitHub API Storage (Khuyến nghị)
**Ưu điểm:**
- ✅ Free, không giới hạn
- ✅ Version control tự động
- ✅ Có thể xem/edit trực tiếp trên GitHub
- ✅ Backup tự động

**Cách hoạt động:**
- Commit file `metadata.json` vào GitHub repository
- Sử dụng GitHub API để read/write
- Cần GitHub Personal Access Token

**Implementation:**
- Tạo API route `/api/github-metadata` để read/write qua GitHub API
- File được lưu tại `data/metadata.json` trong repo

### Option 2: LocalStorage + IndexedDB (Đơn giản nhất)
**Ưu điểm:**
- ✅ Không cần server
- ✅ Hoạt động offline hoàn toàn
- ✅ Nhanh, không có network delay

**Nhược điểm:**
- ❌ Không sync giữa devices
- ❌ Có thể mất data nếu clear browser data

**Implementation:**
- Chỉ dùng IndexedDB làm primary storage
- Backup vào localStorage
- Bỏ cloud sync hoàn toàn

### Option 3: Firebase Firestore (Nếu muốn cloud sync)
**Ưu điểm:**
- ✅ Real-time sync
- ✅ Free tier đủ dùng
- ✅ Dễ setup

**Nhược điểm:**
- ❌ Cần setup Firebase project
- ❌ Thêm dependency

### Option 4: Fix Vercel Blob (Giữ nguyên)
**Ưu điểm:**
- ✅ Đã có code sẵn
- ✅ Không cần thay đổi nhiều

**Nhược điểm:**
- ❌ Cần debug tại sao không hoạt động
- ❌ Có thể tốn phí nếu dùng nhiều

## Khuyến nghị

**Cho use case hiện tại (cá nhân, ít files):**
→ **Option 2: LocalStorage + IndexedDB** - Đơn giản, không cần cloud

**Nếu cần sync giữa devices:**
→ **Option 1: GitHub API** - Free, reliable, có version control

**Nếu muốn real-time sync:**
→ **Option 3: Firebase** - Professional nhưng cần setup
