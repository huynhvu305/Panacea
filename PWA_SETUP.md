## 🔧 Tính năng PWA

### 1. Offline Support:

- Cache các assets quan trọng
- Hoạt động offline sau lần truy cập đầu tiên
- Tự động cache các resources khi online

### 2. Install Prompt:

- Tự động hiển thị prompt cài đặt (trên một số trình duyệt)
- Có thể trigger thủ công qua `PwaService.promptInstall()`

### 3. Update Management:

- Tự động kiểm tra update mỗi 6 giờ
- Thông báo khi có phiên bản mới
- Cho phép user cập nhật ngay

### 4. Performance:

- Cache static assets
- Giảm thời gian load
- Tải nhanh hơn ở các lần truy cập sau

## 📝 Sử dụng PwaService trong code

```typescript
import { PwaService } from './services/pwa';

constructor(private pwaService: PwaService) {}

// Kiểm tra xem app có đang chạy ở chế độ standalone không
isStandalone = this.pwaService.isStandalone();

// Kiểm tra online/offline
isOnline = this.pwaService.isOnline();

// Lắng nghe thay đổi trạng thái online/offline
this.pwaService.onOnlineStatusChange((isOnline) => {
  console.log('Online status:', isOnline);
});

// Hiển thị install prompt (nếu có)
await this.pwaService.promptInstall();

// Kiểm tra update thủ công
this.pwaService.checkForUpdates();
```

## 🐛 Troubleshooting

### Service Worker không đăng ký:

1. Kiểm tra console để xem lỗi
2. Đảm bảo đang chạy trên HTTPS hoặc localhost
3. Kiểm tra file `public/sw.js` có tồn tại không

### Manifest không load:

1. Kiểm tra file `public/manifest.json` có tồn tại không
2. Kiểm tra link trong `index.html`: `<link rel="manifest" href="/manifest.json">`
3. DevTools > Application > Manifest để xem lỗi

### Icons không hiển thị:

1. Đảm bảo các file icon tồn tại trong `public/icons/`
2. Kiểm tra đường dẫn trong `manifest.json`
3. Icon phải là PNG format

### Update không hoạt động:

1. Service worker cần được update version trong `sw.js`:

   ```javascript
   const CACHE_NAME = 'panacea-v1.0.1'; // Tăng version
   ```

2. Reload trang để service worker mới được cài đặt

## 📚 Tài liệu tham khảo

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

## ✅ Checklist trước khi deploy:

- [ ] Đã tạo đầy đủ icons (ít nhất 192x192 và 512x512)
- [ ] Đã test offline mode
- [ ] Đã test install prompt
- [ ] Đã test update mechanism
- [ ] Đã test trên mobile devices
- [ ] Đã test trên HTTPS (production)

---

**Lưu ý:** PWA chỉ hoạt động trên HTTPS hoặc localhost. Khi deploy production, đảm bảo website chạy trên HTTPS.
