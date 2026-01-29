# 📚 PDF Reader - bà già (baza)

Ứng dụng web đọc PDF mô phỏng trải nghiệm đọc sách trên máy đọc sách (e-reader) với đầy đủ tính năng ghi chú và điều hướng.

## ✨ Tính năng

### 🎨 Chế độ đọc như máy đọc sách
- ☀️ **Chế độ sáng (Day)**: Nền trắng sáng cho đọc ban ngày
- 📖 **Chế độ Sepia**: Nền màu be ấm áp, dễ chịu cho mắt
- 🌙 **Chế độ tối (Night)**: Nền đen cho đọc ban đêm, bảo vệ mắt

### 📖 Trải nghiệm đọc sách
- 🖱️ **Click để lật trang**: Click vào 1/3 bên trái để lùi trang, 1/3 bên phải để tiến trang
- ⌨️ **Điều hướng bằng bàn phím**: 
  - `←` / `↑` / `Space`: Lùi trang
  - `→` / `↓`: Tiến trang
  - `F`: Bật/tắt fullscreen
  - `H`: Ẩn/hiện điều khiển
- 🎬 **Animation lật trang**: Hiệu ứng chuyển trang mượt mà như sách thật
- 📊 **Progress bar**: Thanh tiến trình hiển thị % đã đọc

### 🎯 Tính năng nâng cao
- 📖 **Đọc PDF mượt mà**: Hỗ trợ đọc các file PDF với chất lượng cao
- 📝 **Ghi chú trực tiếp**: Thêm, chỉnh sửa và xóa ghi chú ngay trên PDF
- 🔍 **Zoom in/out**: Phóng to/thu nhỏ để đọc dễ dàng hơn
- 📑 **Bookmark**: Đánh dấu các trang quan trọng
- 💾 **Tự động lưu**: Ghi chú và vị trí đọc được lưu tự động
- 📤 **Xuất/Nhập ghi chú**: Xuất ghi chú ra file JSON hoặc nhập từ file
- 🖥️ **Fullscreen mode**: Chế độ toàn màn hình với UI tối giản
- 📱 **Responsive**: Giao diện đẹp và tương thích với mọi thiết bị

## 🚀 Cài đặt và chạy

### Yêu cầu
- Node.js (phiên bản 16 trở lên)
- npm hoặc yarn

### Cài đặt dependencies

```bash
npm install
```

### Chạy ứng dụng

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5173`

### Build cho production

```bash
npm run build
```

## 📖 Hướng dẫn sử dụng

### Cơ bản
1. **Chọn file PDF**: Click vào nút "📁 Chọn PDF" và chọn file PDF của bạn
2. **Điều hướng**: 
   - Click vào 1/3 bên trái trang để lùi, 1/3 bên phải để tiến
   - Hoặc dùng nút "Trước"/"Sau" ở thanh điều khiển
   - Hoặc dùng phím mũi tên/space trên bàn phím
3. **Chọn chế độ đọc**: Click vào các icon ☀️📖🌙 ở thanh điều khiển trên cùng
4. **Zoom**: Sử dụng nút "+" và "-" ở thanh điều khiển dưới cùng

### Nâng cao
5. **Fullscreen**: Click icon ⤢ hoặc nhấn phím `F` để vào chế độ toàn màn hình
6. **Ẩn điều khiển**: Nhấn phím `H` hoặc di chuyển chuột ra ngoài (trong fullscreen)
7. **Bookmark**: Click icon 📑 để đánh dấu trang hiện tại
8. **Thêm ghi chú**: 
   - Click vào nút "✎" để bật chế độ ghi chú
   - Click vào vị trí bất kỳ trên PDF để thêm ghi chú
   - Nhập nội dung và click "Lưu"
9. **Xem ghi chú & bookmark**: Tất cả được hiển thị ở sidebar bên phải
10. **Xuất ghi chú**: Click "💾 Xuất ghi chú" để tải file JSON chứa tất cả ghi chú

## 🛠️ Công nghệ sử dụng

- **React 19**: Framework UI
- **Vite**: Build tool và dev server
- **react-pdf**: Thư viện render PDF
- **pdfjs-dist**: PDF.js để xử lý PDF

## 👤 Tác giả

**bà già (baza)**

## 📄 License

MIT
