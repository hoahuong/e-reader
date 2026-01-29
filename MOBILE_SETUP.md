# Hướng dẫn chạy ứng dụng trên iPad/iPhone

## Cách 1: Chạy qua mạng local (Khuyến nghị)

### Bước 1: Khởi động server
```bash
npm run dev
# hoặc
npm run dev:mobile
```

### Bước 2: Tìm IP address của máy
IP address của máy bạn: **192.168.1.5**

Nếu IP thay đổi, chạy lệnh sau để tìm IP mới:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Bước 3: Truy cập từ iPad/iPhone

1. Đảm bảo iPad/iPhone và máy tính cùng mạng WiFi
2. Mở Safari trên iPad/iPhone
3. Truy cập địa chỉ:
   ```
   http://192.168.1.5:5173
   ```
   (Thay 192.168.1.5 bằng IP của máy bạn)

### Bước 4: Thêm vào Home Screen (Tùy chọn)

1. Trong Safari, nhấn nút Share (hình vuông với mũi tên)
2. Chọn "Add to Home Screen"
3. Đặt tên và nhấn "Add"
4. Bây giờ bạn có thể mở ứng dụng như một app thật!

## Cách 2: Sử dụng ngrok (Cho truy cập từ xa)

### Cài đặt ngrok
```bash
# macOS
brew install ngrok

# Hoặc tải từ https://ngrok.com/download
```

### Chạy ngrok
```bash
# Terminal 1: Chạy dev server
npm run dev

# Terminal 2: Chạy ngrok
ngrok http 5173
```

### Truy cập
- Ngrok sẽ cung cấp URL công khai (ví dụ: https://abc123.ngrok.io)
- Truy cập URL này từ iPad/iPhone (không cần cùng WiFi)

## Lưu ý

1. **Firewall**: Đảm bảo firewall cho phép kết nối trên port 5173
2. **Cùng mạng WiFi**: iPad/iPhone và máy tính phải cùng mạng WiFi
3. **HTTPS**: Một số tính năng (như camera) yêu cầu HTTPS. Nếu cần, dùng ngrok hoặc cấu hình SSL

## Troubleshooting

### Không truy cập được từ iPad/iPhone
- Kiểm tra IP address có đúng không
- Kiểm tra firewall có chặn port 5173 không
- Đảm bảo cùng mạng WiFi
- Thử tắt VPN nếu có

### Lỗi CORS hoặc network
- Đảm bảo server đang chạy
- Kiểm tra console trong Safari (Settings > Safari > Advanced > Web Inspector)
