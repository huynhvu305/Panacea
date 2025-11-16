# Hướng Dẫn Deploy Website Panacea lên Vercel

## 🚀 Deploy qua GitHub (Khuyến nghị)

1. Push code lên GitHub
2. Vào https://vercel.com
3. Import project từ GitHub
4. Vercel sẽ tự động detect Angular và sử dụng file `vercel.json`
5. Click Deploy

**Lưu ý:** File `vercel.json` đã được cấu hình sẵn để redirect routes về `index.html`

---

## 🛠️ Deploy qua CLI

```bash
# Cài đặt Vercel CLI (nếu chưa có)
npm install -g vercel

# Deploy
vercel

# Hoặc deploy production
vercel --prod
```

---

## ⚙️ Cấu hình Quan Trọng

### Angular SPA Routing

Angular là Single Page Application (SPA), cần redirect tất cả routes về `index.html`. Đã được cấu hình trong `vercel.json`:

- ✅ Rewrites: Tất cả routes → `/index.html`
- ✅ Cache headers cho assets và static files
- ✅ Build command: `npm run build`
- ✅ Output directory: `dist/panacea/browser`

### Environment Variables

Nếu có API URL hoặc config khác, cần cấu hình trong Vercel:

- **Vercel:** Project Settings → Environment Variables

---

## 📊 Build Output

File build đã được tối ưu:

- **CSS:** Đã minify
- **JavaScript:** Đã minify và gzip
- **Critical CSS:** Đã inline vào HTML

---

## ✅ Checklist Trước Khi Deploy

- [x] Build production thành công
- [x] Test local với production build
- [x] Kiểm tra tất cả routes hoạt động
- [x] Kiểm tra API endpoints (nếu có)
- [x] Kiểm tra images và assets
- [x] Test responsive trên mobile
- [x] Kiểm tra SEO meta tags
- [x] Test PWA (nếu có)

---

## 🐛 Troubleshooting

### Routes không hoạt động (404)

- Đảm bảo file `vercel.json` đã được cấu hình đúng
- Kiểm tra output directory trong `vercel.json` phải là `dist/panacea/browser`

### Assets không load

- Kiểm tra path trong `angular.json` → `assets`
- Đảm bảo `assets` folder được copy vào `dist`

### Build fails

- Xóa cache: `ng cache clean`
- Xóa `node_modules` và reinstall: `rm -rf node_modules && npm install`
- Kiểm tra version Angular: `ng version`

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề khi deploy, vui lòng kiểm tra:

1. Console errors trong browser
2. Build logs trên Vercel dashboard
3. Network tab để xem requests failed
