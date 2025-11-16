### Bước 1: Thêm Script Tag vào index.html

Mở file `src/index.html` và thêm script tag vào thẻ `<body>`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Panacea</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/x-icon" href="favicon.ico" />
  </head>
  <body>
    <app-root></app-root>

    <!-- Chatbot Widget Script -->
    <script
      src="https://cdn.jsdelivr.net/npm/@kieng/just-chat/dist/just-chat.umd.js"
      data-webhook-url="https://52836.vpsvinahost.vn/webhook/172f45a8-a690-460b-bbdc-b59ec818af6f"
      data-theme-color="#1E40AF"
      data-position="bottom-right"
      data-title="Chat with us"
      data-welcome-message="How can we help you today?"
      data-history-enabled="true"
      data-history-clear-button="true"
      defer
    ></script>
  </body>
</html>
```

### Bước 2: Cấu hình N8N Webhook URL

Các thuộc tính có thể tùy chỉnh:

- `data-webhook-url`: URL N8N webhook (bắt buộc)
- `data-theme-color`: Màu sắc theme (hex color, ví dụ: #1E40AF)
- `data-position`: Vị trí widget (bottom-right, bottom-left, top-right, top-left)
- `data-title`: Tiêu đề chatbot
- `data-welcome-message`: Tin nhắn chào mừng
- `data-history-enabled`: Bật/tắt lưu lịch sử (true/false)
- `data-history-clear-button`: Hiển thị nút xóa lịch sử (true/false)

## **Lưu ý**: Widget sẽ tự động khởi tạo khi trang load, không cần thêm code Angular.

## Troubleshooting

### Chatbot không hiển thị

- Kiểm tra console browser có lỗi không
- Đảm bảo script tag được load trong `index.html`
- Kiểm tra network tab xem script có được tải từ CDN không
- Kiểm tra N8N workflow đã được activate chưa

### Không nhận được response từ N8N (Workflow chạy OK nhưng không hiển thị trên website)

**Nguyên nhân thường gặp:**

3. **Kiểm tra Network Tab (F12)**

   - Mở Network tab trong browser DevTools
   - Gửi tin nhắn trong chatbot
   - Tìm request đến N8N webhook
   - Kiểm tra:
     - Status code phải là 200
     - Response body phải có format `{ "message": "..." }`
     - Response headers phải có CORS headers

4. **Kiểm tra N8N Execution Log**

   - Vào N8N → Executions
   - Xem execution mới nhất
   - Kiểm tra từng node có chạy đúng không
   - Xem output của node "Process Message" và "Respond to Webhook"

5. **Kiểm tra Webhook URL**

   - Đảm bảo URL trong `index.html` đúng với Production URL từ N8N
   - URL phải kết thúc bằng `/chatbot` (hoặc path bạn đã cấu hình)
   - Đảm bảo workflow đã được **Activate**

6. **Test trực tiếp Webhook**
   - Dùng Postman hoặc curl để test webhook:
   ```bash
   curl -X POST https://your-n8n-url/webhook/chatbot \
     -H "Content-Type: application/json" \
     -d '{"message": "xin chào"}'
   ```
   - Kiểm tra response có đúng format không

## Tùy chỉnh Giao diện

Bạn có thể tùy chỉnh widget thông qua các data attributes:

- `data-theme-color`: Màu sắc theme (hex color, ví dụ: #1E40AF)
- `data-title`: Tiêu đề chatbot
- `data-position`: Vị trí (bottom-right, bottom-left, top-right, top-left)
- `data-welcome-message`: Tin nhắn chào mừng
- `data-history-enabled`: Bật/tắt lưu lịch sử (true/false)
- `data-history-clear-button`: Hiển thị nút xóa lịch sử (true/false)

---

## Lưu ý Bảo mật

1. **Production**: Nên sử dụng authentication cho N8N webhook
2. **API Keys**: Không commit API keys vào git
3. **CORS**: Chỉ cho phép domain của bạn (không dùng `*` trong production)
4. **Rate Limiting**: Cân nhắc thêm rate limiting để tránh spam
