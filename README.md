# Zenith Media Workspace

![Zenith Media](https://img.shields.io/badge/Status-In%20Development-cyan?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20TypeScript-8b5cf6?style=for-the-badge)

Zenith Media Workspace là một dự án Full-stack Monorepo được xây dựng tập trung vào hiệu năng, trải nghiệm người dùng (UX) và hiệu ứng hình ảnh (Motion Design). Dự án bao gồm một nền tảng portfolio cá nhân kết hợp hệ thống quản lý tài sản truyền thông (Media Asset Management) dành cho công việc sáng tạo.

## 🏗 Kiến trúc dự án (Monorepo)

Dự án sử dụng **pnpm workspaces** để quản lý nhiều ứng dụng trong cùng một repository:

- `apps/web`: Ứng dụng Frontend (React + Vite)
- `apps/api`: Máy chủ Backend (Node.js + Express)

## 🚀 Công nghệ sử dụng

### Frontend (`@zenith/web`)
- **Core**: React 19, TypeScript, Vite
- **Routing & State**: React Router v7, TanStack Query (React Query), Zustand
- **Form & Validation**: React Hook Form, Zod
- **Animation & Styling**: Framer Motion, Vanilla CSS (Custom Properties, Glassmorphism, CSS Animations)

### Backend (`@zenith/api`)
- **Core**: Node.js, Express, TypeScript
- **Security & Utilities**: Helmet, CORS, Dotenv, Zod

## 🛠 Hướng dẫn cài đặt và chạy thử

### 1. Yêu cầu hệ thống
- **Node.js**: v18.x hoặc mới hơn
- **pnpm**: v9.x hoặc mới hơn (Cài đặt qua `npm install -g pnpm`)

### 2. Cài đặt thư viện
Tại thư mục gốc của dự án, chạy lệnh:
```bash
pnpm install
```

### 3. Thiết lập biến môi trường (Environment Variables)
Tạo file `.env` trong thư mục `apps/api` dựa trên file `.env.example` (nếu có), hoặc thiết lập các giá trị cơ bản:
```env
PORT=4000
WEB_URL=http://localhost:5173
NODE_ENV=development
```

### 4. Khởi chạy dự án (Môi trường Development)
Để khởi chạy đồng thời cả Frontend và Backend, bạn có thể chạy lệnh sau tại thư mục gốc (nếu đã cấu hình script), hoặc chạy riêng biệt:

**Chạy Frontend:**
```bash
pnpm --filter @zenith/web dev
```
*(Truy cập tại: http://localhost:5173)*

**Chạy Backend:**
```bash
pnpm --filter @zenith/api dev
```
*(Kiểm tra sức khỏe API tại: http://localhost:4000/api/health)*

## 💡 Cấu trúc thư mục Frontend
```text
apps/web/
├── public/             # Tài nguyên tĩnh
├── src/                
│   ├── app/            # Cấu hình app, router, providers
│   ├── components/     # Các UI component dùng chung (layout, buttons...)
│   ├── features/       # Các module tính năng (portfolio, auth...)
│   ├── pages/          # Các trang chính tương ứng với Router
│   ├── services/       # Xử lý gọi API (fetch, axios...)
│   └── styles/         # CSS toàn cục, CSS variables, animations
```

## 🎨 Thiết kế giao diện (UI/UX)
- Giao diện được thiết kế theo phong cách tối giản, hiện đại (Dark Mode mặc định).
- Sử dụng hiệu ứng **Glassmorphism** (kính mờ), **Gradients** chuyển động và các viền phát sáng (Glow effects).
- **Micro-animations**: Được xây dựng kết hợp giữa CSS `@keyframes` thuần và `framer-motion` để đảm bảo hiệu năng 60fps.

## 📜 Giấy phép
Dự án được phát triển dưới dạng mã nguồn mở cá nhân.
