# 🔐 Về Client Secret - Quan trọng!

## ❌ KHÔNG CẦN Client Secret cho Client-Side OAuth

App hiện tại đang dùng **OAuth 2.0 Client-Side Flow** (Google Identity Services), chỉ cần:
- ✅ **Client ID** (đã có)
- ❌ **Client Secret** (KHÔNG CẦN và KHÔNG NÊN dùng)

## ⚠️ Tại sao KHÔNG nên thêm Client Secret vào .env?

1. **Bảo mật**: Client Secret sẽ bị expose trong code JavaScript
2. **Không cần thiết**: Client-side flow không sử dụng Client Secret
3. **Rủi ro**: Nếu ai đó lấy được Client Secret, họ có thể giả mạo app của bạn

## ✅ App hiện tại hoạt động tốt với chỉ Client ID

Bạn chỉ cần:
```env
VITE_GOOGLE_CLIENT_ID=507457583271-3ubut9f9nljo5gb1e2frrhqo52ctspp9.apps.googleusercontent.com
```

## 🔄 Khi nào cần Client Secret?

Chỉ cần Client Secret nếu bạn:
- Dùng **Server-Side OAuth Flow** (backend server)
- Tạo API routes để xử lý OAuth trên server
- Cần refresh tokens lâu dài

## 💡 Nếu muốn dùng Server-Side Flow:

1. Tạo API route `/api/google-auth` trên server
2. Dùng Client Secret ở server (KHÔNG expose ra client)
3. Xử lý OAuth flow trên server
4. Trả về access token cho client

**Nhưng điều này phức tạp hơn và không cần thiết cho use case hiện tại!**

## ✅ Kết luận:

**KHÔNG CẦN** thêm Client Secret vào `.env`. App hiện tại hoạt động tốt với chỉ Client ID.

Chỉ cần:
1. Thêm email vào Test Users trong Google Cloud Console
2. Đảm bảo Authorized JavaScript origins có `http://localhost:5173`
3. Thử đăng nhập lại

---

**Giữ Client Secret an toàn - chỉ dùng khi thực sự cần server-side flow!** 🔒
