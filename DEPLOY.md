# Hướng Dẫn Deploy Website Panacea

File production build đã được tạo trong thư mục `dist/panacea/`. Bạn có thể deploy lên các platform sau:

## 🚀 Option 1: Vercel (Khuyến nghị - Miễn phí & Nhanh)

### Cách 1: Deploy qua CLI

```bash
# Cài đặt Vercel CLI (nếu chưa có)
npm install -g vercel

# Deploy
vercel

# Hoặc deploy production
vercel --prod
```

### Cách 2: Deploy qua GitHub

1. Push code lên GitHub
2. Vào https://vercel.com
3. Import project từ GitHub
4. Vercel sẽ tự động detect Angular và sử dụng file `vercel.json`
5. Click Deploy

**Lưu ý:** Đảm bảo file `vercel.json` đã có trong repo để redirect routes về `index.html`

---

## 🌐 Option 2: Netlify (Miễn phí)

### Cách 1: Deploy qua CLI

```bash
# Cài đặt Netlify CLI (nếu chưa có)
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist/panacea
```

### Cách 2: Deploy qua GitHub

1. Push code lên GitHub
2. Vào https://app.netlify.com
3. Click "Add new site" → "Import an existing project"
4. Chọn GitHub repo
5. Cấu hình build:
   - **Build command:** `ng build --configuration production`
   - **Publish directory:** `dist/panacea`
6. Click "Deploy site"

**Lưu ý:** File `netlify.toml` đã được cấu hình sẵn, Netlify sẽ tự động sử dụng.

---

## 🔥 Option 3: Firebase Hosting (Miễn phí)

### Bước 1: Cài đặt Firebase CLI

```bash
npm install -g firebase-tools
```

### Bước 2: Login và khởi tạo

```bash
firebase login
firebase init hosting
```

Chọn các tùy chọn:

- **What do you want to use as your public directory?** → `dist/panacea`
- **Configure as a single-page app?** → `Yes`
- **Set up automatic builds?** → `No` (hoặc `Yes` nếu muốn)

### Bước 3: Deploy

```bash
ng build --configuration production
firebase deploy --only hosting
```

---

## 📦 Option 4: GitHub Pages

### Bước 1: Cài đặt angular-cli-ghpages

```bash
npm install -g angular-cli-ghpages
```

### Bước 2: Build và deploy

```bash
ng build --configuration production --base-href=/repository-name/
npx angular-cli-ghpages --dir=dist/panacea
```

**Lưu ý:** Thay `repository-name` bằng tên GitHub repo của bạn.

---

## ☁️ Option 5: Cloudflare Pages (Miễn phí)

1. Push code lên GitHub
2. Vào https://pages.cloudflare.com
3. Import project từ GitHub
4. Cấu hình build:
   - **Framework preset:** Angular
   - **Build command:** `ng build --configuration production`
   - **Build output directory:** `dist/panacea`
5. Click "Save and Deploy"

---

## ⚙️ Cấu hình Quan Trọng

### Angular SPA Routing

Angular là Single Page Application (SPA), cần redirect tất cả routes về `index.html`. Đã được cấu hình trong:

- ✅ `vercel.json` (cho Vercel)
- ✅ `netlify.toml` (cho Netlify)
- ✅ `public/_redirects` (cho static hosting)

### Base Href

Nếu deploy vào subdirectory (như `/panacea/`), cần thêm `--base-href`:

```bash
ng build --configuration production --base-href=/panacea/
```

### Environment Variables

Nếu có API URL hoặc config khác, cần cấu hình trong platform:

- **Vercel:** Project Settings → Environment Variables
- **Netlify:** Site Settings → Environment Variables
- **Firebase:** Functions config hoặc `.env` file

---

## 📊 Build Output

File build đã được tối ưu:

- **CSS:** Đã minify (33.33 kB)
- **JavaScript:** Đã minify và gzip
- **Critical CSS:** Đã inline vào HTML
- **Total initial bundle:** ~514 kB (sau gzip)

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

- Đảm bảo file redirect đã được cấu hình (`vercel.json`, `netlify.toml`, hoặc `_redirects`)
- Kiểm tra base href trong `angular.json`

### Assets không load

- Kiểm tra path trong `angular.json` → `baseHref`
- Đảm bảo `assets` folder được copy vào `dist`

### Build fails

- Xóa cache: `ng cache clean`
- Xóa `node_modules` và reinstall: `rm -rf node_modules && npm install`
- Kiểm tra version Angular: `ng version`

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề khi deploy, vui lòng kiểm tra:

1. Console errors trong browser
2. Build logs trên platform
3. Network tab để xem requests failed
