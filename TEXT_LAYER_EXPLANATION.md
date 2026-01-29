# Text Layer - Giải thích về bố cục PDF

## ✅ Trả lời: Bố cục PDF KHÔNG BỊ MẤT

Text layer là một **overlay layer trong suốt** được đặt trên canvas, không thay thế canvas.

---

## 🏗️ Cấu trúc Layers

```
┌─────────────────────────────────┐
│   Text Layer (transparent)      │  ← Text selectable (invisible)
│   - Có thể select text          │
│   - opacity: 0 hoặc rất thấp     │
│   - user-select: text            │
├─────────────────────────────────┤
│   Annotation Overlay            │  ← Highlights đã lưu
│   - Highlights                   │
│   - Annotation markers           │
├─────────────────────────────────┤
│   Canvas (PDF Image)             │  ← PDF được render (visible)
│   - Giữ nguyên bố cục            │
│   - Không thay đổi               │
└─────────────────────────────────┘
```

---

## 📐 Cách hoạt động

### 1. **Canvas Layer** (Không thay đổi)
```javascript
// Canvas vẫn được render như cũ
const canvas = await renderPage(pageNum);
pdfContent.appendChild(canvas);
// ✅ Canvas giữ nguyên, hiển thị PDF như bình thường
```

### 2. **Text Layer** (Thêm vào, không thay thế)
```javascript
// Tạo text layer container
const textLayerDiv = document.createElement('div');
textLayerDiv.className = 'textLayer';
textLayerDiv.style.cssText = `
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  opacity: 0;  // ← Trong suốt, không nhìn thấy
  user-select: text;  // ← Cho phép select text
  pointer-events: auto;
`;

// Render text với đúng vị trí như canvas
const textContent = await page.getTextContent();
const viewport = page.getViewport({ scale });

textContent.items.forEach((item) => {
  const span = document.createElement('span');
  span.textContent = item.str;
  
  // Tính toán vị trí chính xác như canvas
  const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
  span.style.cssText = `
    position: absolute;
    left: ${tx[4]}px;
    top: ${tx[5]}px;
    font-size: ${tx[0]}px;
    font-family: ${item.fontName};
    color: transparent;  // ← Text trong suốt
  `;
  
  textLayerDiv.appendChild(span);
});

// Append text layer vào cùng container với canvas
pdfContent.appendChild(textLayerDiv);
```

---

## 🎯 Điểm quan trọng

### ✅ **Canvas không thay đổi**
- Canvas vẫn render PDF như cũ
- Bố cục PDF giữ nguyên 100%
- Chỉ thêm text layer trên đó

### ✅ **Text Layer trong suốt**
- `opacity: 0` hoặc `color: transparent`
- Không nhìn thấy text layer
- Chỉ dùng để select text

### ✅ **Alignment chính xác**
- Text layer phải dùng cùng viewport với canvas
- Cùng scale, cùng transform
- Text sẽ khớp chính xác với canvas

---

## ⚠️ Lưu ý

### **Alignment Issues** (Nếu không căn chỉnh đúng)
- Text layer có thể lệch so với canvas
- Selection sẽ không khớp với text trên canvas
- Cần đảm bảo viewport và transform giống nhau

### **Performance**
- Text layer thêm một chút overhead
- Nhưng không ảnh hưởng đến render canvas
- Canvas vẫn cache và render nhanh như cũ

---

## 💡 Kết luận

**Bố cục PDF KHÔNG BỊ MẤT** vì:
1. ✅ Canvas giữ nguyên, không thay đổi
2. ✅ Text layer chỉ là overlay trong suốt
3. ✅ Text layer không hiển thị, chỉ để select
4. ✅ Bố cục PDF vẫn như cũ, chỉ thêm khả năng select text

**Giống như đặt một lớp kính trong suốt lên trên bức tranh - bức tranh không thay đổi, chỉ thêm khả năng tương tác.**
