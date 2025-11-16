# PWA Icons

Thư mục này chứa các icon cho Progressive Web App (PWA).

## Kích thước icon cần thiết:

- `icon-72x72.png` - 72x72 pixels
- `icon-96x96.png` - 96x96 pixels  
- `icon-128x128.png` - 128x128 pixels
- `icon-144x144.png` - 144x144 pixels
- `icon-152x152.png` - 152x152 pixels
- `icon-192x192.png` - 192x192 pixels (quan trọng nhất)
- `icon-384x384.png` - 384x384 pixels
- `icon-512x512.png` - 512x512 pixels (quan trọng nhất)

## Cách tạo icons:

1. **Từ logo hiện có:**
   - Sử dụng logo Panacea (SUBLOGO.webp hoặc logo chính)
   - Resize thành các kích thước trên
   - Đảm bảo icon có nền trong suốt hoặc nền màu #132FBA

2. **Công cụ online:**
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
   - https://maskable.app/

3. **Từ command line (nếu có ImageMagick):**
   ```bash
   # Tạo icon từ logo gốc
   convert logo.png -resize 512x512 icons/icon-512x512.png
   convert logo.png -resize 192x192 icons/icon-192x192.png
   # ... tương tự cho các kích thước khác
   ```

4. **Từ Photoshop/Illustrator:**
   - Mở logo gốc
   - Export thành PNG với từng kích thước
   - Đảm bảo chất lượng cao

## Lưu ý:

- Icon nên có nền trong suốt hoặc nền màu brand (#132FBA)
- Icon 192x192 và 512x512 là bắt buộc
- Icon nên có padding để tránh bị cắt khi hiển thị
- Format: PNG với transparency
- Tất cả icons nên có cùng design và màu sắc

## Tạm thời (Development):

Nếu chưa có icons, bạn có thể:
1. Tạo placeholder icons đơn giản
2. Hoặc sử dụng favicon.ico hiện có và resize
3. PWA vẫn hoạt động nhưng sẽ không có icon đẹp khi cài đặt

