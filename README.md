# Zenith Media Workspace

![Zenith Status](https://img.shields.io/badge/Status-MVP%20Development-cyan?style=for-the-badge)
![Monorepo](https://img.shields.io/badge/Architecture-Monorepo%20(pnpm)-8b5cf6?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20PostgreSQL-48d7ff?style=for-the-badge)

**Zenith Media Workspace** không chỉ là một Portfolio cá nhân giới thiệu dịch vụ, mà là một **Hệ thống quản lý vòng đời dự án Media (Media Project Lifecycle Management) toàn diện**. Hệ thống bao gồm quy trình từ lúc khách hàng gửi yêu cầu (Commission), báo giá, duyệt video với bình luận theo thời gian (Timestamped Review), đến thanh toán tự động và bàn giao file gốc an toàn.

---

## ✨ Tính năng cốt lõi (MVP Features)

### 1. Portfolio & Commission Form
- Trưng bày các dự án nổi bật, tương tác mượt mà nhờ Framer Motion và kiến trúc CSS hiện đại.
- Form yêu cầu (Commission) thu thập thông tin khách hàng, budget, deadline với validation chặt chẽ qua Zod.

### 2. Client Workspace & Quản lý Media
- Không gian làm việc bảo mật: Khách hàng chỉ truy cập được các dự án mà họ là thành viên (Row-Level Security).
- Hỗ trợ tải lên file dung lượng lớn trực tiếp từ Client lên S3 (Multipart/Resumable Upload) mà không làm quá tải API backend.
- Luồng duyệt file an toàn: Quarantine (Cách ly file) -> Scanning -> Processing -> Ready.

### 3. Hệ thống Video Review
- Trình phát video nội bộ cho phép khách hàng để lại bình luận (Review Comment) gắn trực tiếp vào từng mốc thời gian (Timestamp) hoặc frame.
- Quản lý các phiên bản nháp (Version Control), giữ lại lịch sử phản hồi và hỗ trợ phê duyệt (Approve/Reject).

### 4. Thanh toán & Bàn giao File (Payment & Delivery)
- Tích hợp cổng thanh toán với luồng Webhook bảo mật (xử lý Idempotency và Replay Attack).
- Kích hoạt phân quyền tải File gốc (Final Master) chỉ khi khách hàng thanh toán thành công thông qua Signed URL có thời hạn.

### 5. Automation & Background Jobs
- Sử dụng BullMQ + Redis để xử lý các tác vụ nền: Transcode video bằng FFmpeg, tạo Thumbnail, Waveform, và đóng dấu Watermark động.
- Thông báo theo thời gian thực tới Discord và Email cho các sự kiện như có comment mới, thay đổi trạng thái dự án, hoặc thanh toán thành công.

---

## 🏗 Kiến trúc hệ thống (Architecture)

Dự án được xây dựng theo kiến trúc **Modular Monolith** kết hợp **Background Workers**, lưu trữ chung trong một pnpm workspace:

- **Frontend (`apps/web`)**: Xây dựng với React 19, TypeScript, Vite. Quản lý state bằng Zustand và TanStack Query. Thiết kế UI/UX theo xu hướng Glassmorphism, Micro-animations (60fps).
- **Backend API (`apps/api`)**: Node.js, Express (hoặc NestJS), TypeScript. Xử lý nghiệp vụ, API, Authentication, và kết nối Database.
- **Worker (`apps/worker`)**: Process độc lập làm nhiệm vụ nặng như FFmpeg transcoding, gửi email để không block luồng API chính.
- **Database & Cache**: PostgreSQL (quản lý trạng thái, quyền) và Redis (quản lý Job Queue, Rate Limiting).
- **Storage & CDN**: AWS S3 + CloudFront cho lưu trữ và phân phối video tốc độ cao.

---

## 🛠 Hướng dẫn Cài đặt (Development Setup)

### 1. Yêu cầu hệ thống
- **Node.js**: `v18.x` trở lên
- **pnpm**: `v9.x` trở lên
- **PostgreSQL** & **Redis** đang chạy nội bộ hoặc qua Docker.
- **Tài khoản AWS** (S3/CloudFront) hoặc MinIO để test Storage nội bộ.

### 2. Cài đặt thư viện
```bash
git clone https://github.com/SangTranTamLy/zenith-workspace.git
cd zenith-workspace

# Cài đặt tất cả dependencies
pnpm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env` trong thư mục `apps/api` (hoặc root) với các biến quan trọng:
```env
# Database & Redis
DATABASE_URL=postgresql://user:password@localhost:5432/zenith
REDIS_URL=redis://localhost:6379

# Storage Setup
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_BUCKET_NAME=zenith-media-assets

# Authentication & Webhooks
JWT_SECRET=super_secret_key
PAYMENT_WEBHOOK_SECRET=whsec_xxx
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx
```

### 4. Khởi chạy dự án
```bash
# Áp dụng Database Migrations (Prisma/TypeORM)
pnpm --filter @zenith/api run db:migrate

# Chạy song song toàn bộ các dịch vụ (Web, API, Worker)
pnpm dev
# Hoặc chạy riêng biệt:
# pnpm --filter @zenith/web dev (http://localhost:5173)
# pnpm --filter @zenith/api dev (http://localhost:4000)
```

---

## 🔐 Bảo mật & Hiệu năng
- **Bảo mật**: 
  - 100% Signed URLs (không public file trực tiếp).
  - Validation dữ liệu toàn diện (Zod), RLS (Row-Level Security) cho Database.
  - Phân tách môi trường rõ ràng, không lưu API keys hay Secret trên Client.
- **Hiệu năng**: 
  - Mục tiêu API Metadata P95 dưới `300ms`.
  - Frontend áp dụng CDN caching, Lazy-loading, và Virtualization cho danh sách media lớn.

## 🚀 Triển khai (CI/CD Deployment)
Hệ thống có thể được chia tách khi triển khai:
- **Frontend Portfolio/Workspace**: Vercel hoặc Cloudflare Pages.
- **API Server & Background Worker**: Nền tảng Container-based như Render, AWS ECS, hoặc Railway.
- **Data**: Managed PostgreSQL & Managed Redis.
- **Pipeline**: Tích hợp GitHub Actions (Lint, Typecheck, Unit Test, Smoke Test) chạy bắt buộc trước mọi bản cập nhật Production.
