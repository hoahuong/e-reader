# Phân tích chức năng Text Selection và Highlight trong PDF Viewer

## 📋 Tổng quan

Chức năng text selection và highlight hiện tại **KHÔNG HOẠT ĐỘNG ĐÚNG** vì PDF được render bằng **Canvas** (image) thay vì **Text Layer** (selectable text).

---

## 🔍 Phân tích Code hiện tại

### 1. **Text Selection Handler** (Dòng 767-811)

```javascript
useEffect(() => {
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0 || selection.toString().trim() === '') {
      setSelectedText(null);
      setTextSelectionMenu(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const canvasContainer = canvasContainerRef.current;
    if (!canvasContainer) return;

    const containerRect = canvasContainer.getBoundingClientRect();
    const x = ((rect.left + rect.width / 2 - containerRect.left) / containerRect.width) * 100;
    const y = ((rect.top - containerRect.top) / containerRect.height) * 100;

    setSelectedText({
      text: selection.toString(),
      x, y,
      page: pageNumber,
      rect: { left, top, width, height },
      pageRect: { width, height }
    });

    setTextSelectionMenu({ x: rect.left + rect.width / 2, y: rect.top - 10 });
  };

  document.addEventListener('selectionchange', handleTextSelection);
  return () => document.removeEventListener('selectionchange', handleTextSelection);
}, [pageNumber]);
```

**✅ Logic đúng**: 
- Lắng nghe `selectionchange` event
- Tính toán vị trí relative
- Lưu thông tin selection

**❌ Vấn đề**: 
- Chỉ hoạt động khi có text selectable
- Canvas không có text selectable → Selection sẽ luôn empty

---

### 2. **Highlight Function** (Dòng 655-678)

```javascript
const handleHighlight = useCallback(() => {
  if (!selectedText) return;

  const newAnnotation = {
    id: Date.now(),
    type: 'highlight',
    page: selectedText.page,
    x: selectedText.x,
    y: selectedText.y,
    text: selectedText.text,
    color: highlightColor,
    rect: selectedText.rect,
    pageRect: selectedText.pageRect,
    createdAt: new Date().toISOString(),
  };

  onAnnotationAdd(newAnnotation);
  setSelectedText(null);
  setTextSelectionMenu(null);
  window.getSelection().removeAllRanges();
}, [selectedText, highlightColor, onAnnotationAdd]);
```

**✅ Logic đúng**: 
- Tạo annotation object đầy đủ
- Lưu vào parent component qua `onAnnotationAdd`

**❌ Vấn đề**: 
- Không bao giờ được gọi vì `selectedText` luôn null (không có text layer)

---

### 3. **Comment Function** (Dòng 680-696)

```javascript
const handleComment = useCallback(() => {
  if (!selectedText) return;

  setAnnotationPosition({
    x: selectedText.x,
    y: selectedText.y,
    page: selectedText.page,
  });
  setAnnotationText(`"${selectedText.text}"\n\n`);
  setSelectedText(null);
  setTextSelectionMenu(null);
  setIsAnnotationMode(true);
  window.getSelection().removeAllRanges();
}, [selectedText]);
```

**✅ Logic đúng**: 
- Mở annotation form với text đã chọn

**❌ Vấn đề**: 
- Không bao giờ được gọi vì `selectedText` luôn null

---

### 4. **Render Highlights** (Dòng 1950-1987)

```javascript
{currentPageAnnotations
  .filter((ann) => ann.type === 'highlight')
  .map((annotation) => {
    if (!annotation.rect || !annotation.pageRect) return null;
    
    const left = (annotation.rect.left / annotation.pageRect.width) * 100;
    const top = (annotation.rect.top / annotation.pageRect.height) * 100;
    const width = (annotation.rect.width / annotation.pageRect.width) * 100;
    const height = (annotation.rect.height / annotation.pageRect.height) * 100;

    return (
      <div
        className="text-highlight"
        style={{
          position: 'absolute',
          left: `${left}%`,
          top: `${top}%`,
          width: `${width}%`,
          height: `${height}%`,
          backgroundColor: annotation.color || highlightColor,
          opacity: 0.4,
        }}
      />
    );
  })}
```

**✅ Logic đúng**: 
- Render highlights dựa trên annotations đã lưu
- Sử dụng percentage để responsive với zoom

**✅ Hoạt động**: 
- Highlights đã lưu sẽ hiển thị đúng
- Nhưng không thể tạo highlight mới vì không select được text

---

### 5. **Render PDF** (Dòng 359-431, 434-589)

```javascript
const renderPage = useCallback(async (pageNum, preload = false) => {
  // ... render canvas
  await page.render(renderContext).promise;
  // ❌ KHÔNG CÓ renderTextLayer()
});

const displayPage = useCallback(async (pageNum) => {
  // ... clone canvas và append vào DOM
  pdfContent.innerHTML = '';
  pdfContent.appendChild(displayCanvas);
  // ❌ KHÔNG CÓ text layer được render
});
```

**❌ Vấn đề chính**: 
- PDF chỉ được render thành **Canvas** (image)
- **KHÔNG CÓ Text Layer** được render
- Canvas không có text selectable → Không thể select text

---

## 🚨 Thực trạng chức năng

### ✅ **Đã hoạt động**:
1. ✅ Hiển thị highlights đã lưu trước đó
2. ✅ Click vào highlight để edit/delete
3. ✅ Logic xử lý selection và highlight đúng
4. ✅ UI menu selection đầy đủ

### ❌ **KHÔNG hoạt động**:
1. ❌ **Không thể select text** từ PDF canvas
2. ❌ **Không thể tạo highlight mới** bằng cách select text
3. ❌ **Không thể comment** trên text đã chọn
4. ❌ Text selection menu không bao giờ hiển thị

---

## 🔧 Nguyên nhân

### **Vấn đề cốt lõi**:
PDF được render bằng **Canvas** (raster image) thay vì **Text Layer** (selectable HTML text).

**Canvas**:
- ✅ Render nhanh, mượt mà
- ✅ Giữ nguyên format PDF
- ❌ Text không selectable
- ❌ Không thể copy text

**Text Layer** (PDF.js):
- ✅ Text selectable và copy được
- ✅ Có thể highlight chính xác
- ❌ Cần render thêm layer
- ❌ Có thể chậm hơn một chút

---

## 💡 Giải pháp đề xuất

### **Option 1: Render Text Layer** (Khuyến nghị)

Thêm text layer vào quá trình render:

```javascript
// Trong displayPage hoặc renderPage
const textContent = await page.getTextContent();
const textLayerDiv = document.createElement('div');
textLayerDiv.className = 'textLayer';
textLayerDiv.style.cssText = `
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 0.2;
  line-height: 1.0;
  user-select: text;
`;

// Render text items với đúng vị trí
const viewport = page.getViewport({ scale });
textContent.items.forEach((item) => {
  const tx = pdfjsLib.Util.transform(
    viewport.transform,
    item.transform
  );
  const span = document.createElement('span');
  span.textContent = item.str;
  span.style.cssText = `
    position: absolute;
    left: ${tx[4]}px;
    top: ${tx[5]}px;
    font-size: ${tx[0]}px;
    font-family: ${item.fontName};
  `;
  textLayerDiv.appendChild(span);
});

// Append text layer vào container
pdfContent.appendChild(textLayerDiv);
```

### **Option 2: Sử dụng PDF.js Text Layer API**

PDF.js có sẵn API để render text layer:

```javascript
import * as pdfjsLib from 'pdfjs-dist';

const textLayerDiv = document.createElement('div');
textLayerDiv.className = 'textLayer';

const textContent = await page.getTextContent();
const textLayer = new pdfjsLib.renderTextLayer({
  textContentSource: textContent,
  container: textLayerDiv,
  viewport: viewport,
  textDivs: []
});

await textLayer.promise;
```

---

## 📊 Tóm tắt

| Tính năng | Trạng thái | Ghi chú |
|-----------|------------|---------|
| Text Selection | ❌ **KHÔNG HOẠT ĐỘNG** | Không có text layer |
| Highlight mới | ❌ **KHÔNG HOẠT ĐỘNG** | Phụ thuộc vào text selection |
| Hiển thị highlights cũ | ✅ **HOẠT ĐỘNG** | Render từ annotations đã lưu |
| Comment trên text | ❌ **KHÔNG HOẠT ĐỘNG** | Phụ thuộc vào text selection |
| Click highlight để edit | ✅ **HOẠT ĐỘNG** | Có thể edit/delete highlights đã có |
| UI Menu Selection | ✅ **SẴN SÀNG** | Code đầy đủ nhưng không được trigger |

---

## 🎯 Kết luận

**Chức năng text selection và highlight hiện tại KHÔNG HOẠT ĐỘNG** vì:
1. PDF chỉ được render thành Canvas (image)
2. Không có Text Layer để select text
3. `window.getSelection()` luôn trả về empty selection

**Để sửa**: Cần thêm Text Layer vào quá trình render PDF để text có thể select được.
