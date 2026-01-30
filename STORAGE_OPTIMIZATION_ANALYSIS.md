# Phân tích Tối ưu Lưu trữ PDF và Metadata - 2025

## 📊 Tổng quan Use Case

**Yêu cầu:**
- Lưu trữ PDF files (kích thước: vài MB đến vài chục MB)
- Lưu trữ metadata (catalogs, file list) - nhỏ (~KB)
- Sync giữa các thiết bị (máy tính, điện thoại)
- Chi phí thấp hoặc miễn phí
- Hiệu năng tốt, không timeout

**Hiện trạng:**
- PDF: Vercel Blob Storage (1GB free)
- Metadata: GitHub API (đang timeout trên mobile)

---

## 🔍 Phân tích Chi tiết các Options

### 1. **Vercel Blob Storage** (Đang dùng cho PDF)

#### Chi phí:
- **Free tier (Hobby plan):**
  - 1 GB storage/month
  - 10,000 simple operations (reads)
  - 2,000 advanced operations (uploads)
  - 10 GB data transfer/month
- **Pay-as-you-go:**
  - Storage: $0.023/GB/month
  - Simple ops: $0.40/1M operations
  - Advanced ops: $5.00/1M operations
  - Transfer: $0.050/GB

#### Ưu điểm:
- ✅ Tích hợp sẵn với Vercel
- ✅ CDN global, tốc độ cao
- ✅ Public URLs, dễ truy cập
- ✅ Free tier đủ cho cá nhân

#### Nhược điểm:
- ❌ Timeout với Hobby plan (60s max)
- ❌ Có thể tốn phí nếu dùng nhiều
- ❌ Không phù hợp cho metadata (overhead lớn)

#### Đánh giá:
- **PDF Storage: ⭐⭐⭐⭐ (4/5)** - Tốt cho files
- **Metadata: ⭐⭐ (2/5)** - Không phù hợp

---

### 2. **GitHub API Storage** (Đang dùng cho Metadata)

#### Chi phí:
- **Hoàn toàn miễn phí** (không giới hạn)
- Rate limits:
  - Authenticated: 5,000 requests/hour
  - Unauthenticated: 60 requests/hour

#### Giới hạn:
- File size: 100 MB max (không phù hợp cho PDF lớn)
- Repository size: 10 GB recommended
- Git LFS: 10 GB free/month (cho files > 100MB)

#### Ưu điểm:
- ✅ Hoàn toàn miễn phí
- ✅ Version control tự động
- ✅ Backup tự động
- ✅ Có thể xem/edit trên GitHub
- ✅ Không giới hạn storage (trong repo)

#### Nhược điểm:
- ❌ API chậm trên mobile network (timeout)
- ❌ Rate limits (5K/hour)
- ❌ File size limit 100MB (cần Git LFS cho files lớn)
- ❌ Không phù hợp cho PDF files (chỉ metadata)

#### Đánh giá:
- **PDF Storage: ⭐ (1/5)** - Không phù hợp
- **Metadata: ⭐⭐⭐ (3/5)** - OK nhưng chậm

---

### 3. **Google Drive API** (Chưa dùng)

#### Chi phí:
- **API: Miễn phí** (không giới hạn requests)
- **Storage:**
  - Free: 15 GB (shared với Gmail, Photos)
  - Paid: $1.99/month cho 100 GB

#### Giới hạn:
- Rate limit: 12,000 requests/60 seconds
- File size: 5 TB max
- Upload: 750 GB/day (Workspace)

#### Ưu điểm:
- ✅ API miễn phí
- ✅ 15 GB free storage
- ✅ File size lớn (5 TB)
- ✅ Tốc độ tốt
- ✅ Tích hợp với Google ecosystem

#### Nhược điểm:
- ❌ Cần OAuth setup
- ❌ Storage shared với Gmail/Photos
- ❌ Có thể tốn phí nếu cần nhiều storage
- ❌ Phụ thuộc vào Google account

#### Đánh giá:
- **PDF Storage: ⭐⭐⭐⭐ (4/5)** - Tốt
- **Metadata: ⭐⭐⭐⭐ (4/5)** - Tốt

---

### 4. **Vercel KV** (Chưa dùng)

#### Chi phí:
- **Free tier:**
  - 30,000 reads/day
  - 30,000 writes/day
- **Pay-as-you-go:**
  - $0.20/100K reads
  - $0.20/100K writes

#### Ưu điểm:
- ✅ Low latency (< 1ms)
- ✅ Tích hợp sẵn với Vercel
- ✅ Perfect cho key-value (metadata)
- ✅ Free tier đủ cho cá nhân

#### Nhược điểm:
- ❌ Ephemeral data (có thể mất)
- ❌ Không phù hợp cho PDF files (chỉ metadata)
- ❌ Giới hạn 30K ops/day

#### Đánh giá:
- **PDF Storage: ⭐ (1/5)** - Không phù hợp
- **Metadata: ⭐⭐⭐⭐⭐ (5/5)** - Perfect!

---

### 5. **Supabase Storage** (Chưa dùng)

#### Chi phí:
- **Free tier:**
  - 1 GB file storage
  - 500 MB database
  - 50,000 monthly active users
  - 5 GB egress/month
- **Pro: $25/month:**
  - 100 GB storage
  - 200 GB egress

#### Ưu điểm:
- ✅ Free tier tốt
- ✅ Real-time sync
- ✅ PostgreSQL database
- ✅ Authentication built-in
- ✅ Predictable pricing

#### Nhược điểm:
- ❌ Cần setup project riêng
- ❌ Thêm dependency
- ❌ Có thể tốn phí nếu scale

#### Đánh giá:
- **PDF Storage: ⭐⭐⭐⭐ (4/5)** - Tốt
- **Metadata: ⭐⭐⭐⭐⭐ (5/5)** - Rất tốt

---

### 6. **Firebase Storage** (Chưa dùng)

#### Chi phí:
- **Free tier (Spark plan):**
  - 5 GB Cloud Storage
  - 50K Firestore reads/day
  - 20K Firestore writes/day
- **Pay-as-you-go (Blaze plan):**
  - Storage: $0.026/GB/month
  - Downloads: $0.12/GB
  - Operations: $0.18/100K

#### Ưu điểm:
- ✅ Free tier tốt
- ✅ Real-time sync
- ✅ Authentication built-in
- ✅ Dễ setup

#### Nhược điểm:
- ❌ Pricing unpredictable (pay-as-you-go)
- ❌ Có thể tốn phí bất ngờ
- ❌ Cần setup Firebase project

#### Đánh giá:
- **PDF Storage: ⭐⭐⭐⭐ (4/5)** - Tốt
- **Metadata: ⭐⭐⭐⭐ (4/5)** - Tốt nhưng pricing không predictable

---

### 7. **Backblaze B2** (Chưa dùng)

#### Chi phí:
- **Storage: $6/TB/month** (rất rẻ!)
- **Download: Free** (up to 3x storage)
- **Operations: $0.004/10K Class C**

#### Ưu điểm:
- ✅ Rất rẻ ($6/TB vs $26/TB của AWS S3)
- ✅ Free egress (download)
- ✅ Không giới hạn file size
- ✅ S3-compatible API

#### Nhược điểm:
- ❌ Cần setup riêng
- ❌ Không có free tier
- ❌ Cần payment method ngay

#### Đánh giá:
- **PDF Storage: ⭐⭐⭐⭐⭐ (5/5)** - Rất rẻ!
- **Metadata: ⭐⭐⭐ (3/5)** - OK nhưng không có free tier

---

## 🎯 Đề xuất Giải pháp Tối ưu

### **Option A: Hybrid Approach (Khuyến nghị nhất)** ⭐⭐⭐⭐⭐

**PDF Files:**
- **Vercel Blob Storage** (giữ nguyên)
  - Free tier: 1 GB
  - Đủ cho ~100-200 PDF files (5-10MB mỗi file)
  - Nếu vượt quá → chuyển sang Google Drive hoặc Backblaze B2

**Metadata:**
- **Vercel KV** (thay GitHub API)
  - Free tier: 30K reads/day, 30K writes/day
  - Low latency (< 1ms)
  - Không timeout
  - Perfect cho metadata

**Chi phí: $0/month** (hoàn toàn miễn phí)

**Ưu điểm:**
- ✅ Hoàn toàn miễn phí
- ✅ Tốc độ cao, không timeout
- ✅ Tích hợp sẵn với Vercel
- ✅ Đủ cho use case cá nhân

**Nhược điểm:**
- ⚠️ Vercel Blob chỉ 1GB (có thể cần upgrade sau)
- ⚠️ Vercel KV ephemeral (nhưng metadata nhỏ, không sao)

---

### **Option B: Google Drive Full Stack** ⭐⭐⭐⭐

**PDF Files:**
- **Google Drive API**
  - Free: 15 GB
  - Đủ cho ~1,500-3,000 PDF files

**Metadata:**
- **Google Drive API** (lưu metadata.json)
  - Hoặc Firebase Firestore (real-time sync)

**Chi phí: $0/month** (free tier)

**Ưu điểm:**
- ✅ 15 GB free (nhiều hơn Vercel Blob)
- ✅ Tốc độ tốt
- ✅ Tích hợp với Google ecosystem

**Nhược điểm:**
- ❌ Cần OAuth setup
- ❌ Storage shared với Gmail/Photos
- ❌ Phụ thuộc Google account

---

### **Option C: Supabase Full Stack** ⭐⭐⭐⭐

**PDF Files:**
- **Supabase Storage**
  - Free: 1 GB
  - Pro: $25/month cho 100 GB

**Metadata:**
- **Supabase Database (PostgreSQL)**
  - Free: 500 MB
  - Real-time sync

**Chi phí: $0/month** (free tier) hoặc **$25/month** (nếu cần nhiều)

**Ưu điểm:**
- ✅ Real-time sync
- ✅ Database tốt cho metadata
- ✅ Authentication built-in
- ✅ Predictable pricing

**Nhược điểm:**
- ❌ Cần setup project riêng
- ❌ Thêm dependency
- ❌ Free tier chỉ 1 GB

---

### **Option D: Backblaze B2 (Khi scale)** ⭐⭐⭐⭐⭐

**PDF Files:**
- **Backblaze B2**
  - $6/TB/month (rất rẻ!)
  - Free egress

**Metadata:**
- **Vercel KV** hoặc **Supabase Database**

**Chi phí: ~$6-12/month** (khi cần nhiều storage)

**Ưu điểm:**
- ✅ Rất rẻ cho storage lớn
- ✅ Không giới hạn file size
- ✅ Free egress

**Nhược điểm:**
- ❌ Không có free tier
- ❌ Cần setup riêng
- ❌ Overkill cho use case nhỏ

---

## 📋 Bảng So sánh Tổng hợp

| Option | PDF Storage | Metadata | Chi phí/tháng | Setup | Tốc độ | Sync |
|--------|-------------|----------|---------------|-------|--------|------|
| **A: Vercel Blob + KV** | 1 GB free | 30K ops/day | **$0** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **B: Google Drive** | 15 GB free | Unlimited | **$0** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **C: Supabase** | 1 GB free | 500 MB DB | **$0** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **D: Backblaze B2** | $6/TB | Vercel KV | **$6-12** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🚀 Khuyến nghị Cuối cùng

### **Cho Use Case Cá nhân (Hiện tại):**

**→ Option A: Vercel Blob + Vercel KV** ⭐⭐⭐⭐⭐

**Lý do:**
1. ✅ Hoàn toàn miễn phí
2. ✅ Đã tích hợp sẵn với Vercel
3. ✅ Tốc độ cao, không timeout
4. ✅ Đủ cho ~100-200 PDF files
5. ✅ Setup đơn giản nhất

**Implementation:**
- Giữ nguyên Vercel Blob cho PDF
- Chuyển metadata từ GitHub API → Vercel KV
- Chi phí: $0/month

---

### **Khi Cần Nhiều Storage (> 1 GB):**

**→ Option B: Google Drive** hoặc **Option D: Backblaze B2**

**Google Drive:**
- Nếu cần 15 GB → Free
- Nếu cần nhiều hơn → $1.99/month cho 100 GB

**Backblaze B2:**
- Nếu cần > 100 GB → $6/TB/month (rất rẻ!)

---

## 📝 Next Steps

1. **Ngay lập tức:** Implement Vercel KV cho metadata
   - Thay thế GitHub API
   - Giải quyết timeout issue
   - Chi phí: $0

2. **Giữ nguyên:** Vercel Blob cho PDF
   - Đủ cho use case hiện tại
   - Monitor usage

3. **Khi scale:** Đánh giá lại và chuyển sang Google Drive hoặc Backblaze B2

---

## 💡 Kết luận

**Giải pháp tối ưu nhất:**
- **PDF:** Vercel Blob Storage (1 GB free) ✅
- **Metadata:** Vercel KV (30K ops/day free) ✅
- **Chi phí:** $0/month ✅
- **Hiệu năng:** Tốt nhất ✅
- **Setup:** Đơn giản nhất ✅

**Khi nào cần thay đổi:**
- Khi PDF storage > 1 GB → Chuyển sang Google Drive hoặc Backblaze B2
- Khi metadata ops > 30K/day → Upgrade Vercel KV hoặc chuyển Supabase
