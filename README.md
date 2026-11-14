# ZENITH MEDIA Digital Store

Viết lại theo [Plan_Shop.md](docs/Plan_Shop.md), giữ **React + TypeScript + Vite, Express + TypeScript, PostgreSQL/Supabase, Drizzle và pnpm**. Portfolio, chatbot/RAG và messaging cũ đã được loại khỏi ứng dụng. Lịch sử cũ vẫn ở commit `08d434c`.

**Bản triển khai cục bộ, chưa mở bán production.** Mã nguồn được quản lý trên nhánh `codex/zenith-digital-store`; chưa deploy, không thay đổi website đang chạy, không xóa Supabase. Đọc [tình trạng nghiệm thu](docs/IMPLEMENTATION.md) và [hướng dẫn vận hành](docs/OPERATIONS.md) trước khi kết nối dịch vụ thật.

**Cập nhật 2026-11-11:** theo yêu cầu chủ dự án, đã gỡ cấu hình kết nối Supabase cũ khỏi web/API và bản lưu cục bộ. Các biến Supabase mới để trống, chờ project mới. Demo tiếp tục dùng database cục bộ; SDK và migrations của Shop được giữ để kết nối project mới.

## Chạy demo

Yêu cầu Node.js **22.20+**, pnpm **11.18+**. Python 3 cần cho test ZIP / tái tạo media demo.

```sh
pnpm install --frozen-lockfile
pnpm demo
```

Mở **http://127.0.0.1:5173**. Trang đăng nhập có lựa chọn khách hàng và Admin dành riêng cho demo. Không chuyển tiền thật. Bản demo Studio mới lưu database và file tại `.local/demo-studio-v2/`; dữ liệu demo cũ tại `.local/database` và `.local/storage` vẫn được giữ nguyên. Có thể chọn thư mục riêng bằng `SHOP_DEMO_DATA_DIR`.

Đợt rà soát giao diện và chức năng theo plan: [SHOP_AUDIT.md](docs/SHOP_AUDIT.md). Demo có sáu bộ artwork/preview riêng, lựa chọn 540p/720p để thử thay đổi giá, thông số, file và chính sách nâng cấp.

Chạy worker demo trong terminal PowerShell khác:

```powershell
$env:SHOP_API_URL = 'http://127.0.0.1:4000'
$env:SHOP_WORKER_SECRET = 'local-demo-worker-secret-at-least-32-characters'
pnpm worker
```

Đây là khóa chỉ dành cho demo. Production phải dùng secret ngẫu nhiên riêng. FFmpeg/FFprobe được cài qua workspace; có thể đặt binary/font riêng bằng `apps/worker/.env.example`. Tắt worker không mất job; job tiếp tục khi worker chạy lại.

## Chức năng

- Creative Studio Light + Dark Mode, VI/EN, VND/USD, danh mục cha/con, search/sort/Load More, Hero do Admin chọn, preview trong viewport và reduced motion.
- Product/Bundle, gallery, quality/release, compatibility/dependency table, hướng dẫn, README, Wishlist; không có review.
- Cart Drawer, Buy Now, checkout một trang; giá server, ownership credits, Coupon và chính sách cộng dồn.
- VietQR MB Bank, QR 15 phút. Báo chuyển khoản không cấp quyền; Admin đối chiếu, xử lý ngoại lệ và xác nhận idempotent.
- Library Grid/List, chỉ chọn bản đã sở hữu, changelog, ghi nhớ lựa chọn, download URL ngắn hạn, lịch sử yêu cầu tải, bảo toàn file cũ.
- Ticket FIFO, đính kèm, đóng/mở lại; notification trong tài khoản; outbox Resend/Discord có retry và phân biệt kênh riêng tư/công cộng.
- Admin: draft/publish, danh mục, offer bất biến, Bundle, upgrade/free update, Coupon, file/preview, đơn/khách, yêu cầu xóa tài khoản, cấu hình và audit.
- R2 PUT tuần tự, staging tách object cuối, checksum, ZIP/CRC/path validation, FFmpeg worker có lease/heartbeat/reclaim, phục hồi đúng checksum.
- Supabase Auth, xác minh email, quên mật khẩu, cập nhật email/mật khẩu, đăng xuất một/tất cả thiết bị. API xác thực user và UUID Admin ở server.

## Cấu trúc

```text
apps/web/               Storefront, account, admin UI
apps/api/               Express, domain services, external adapters
apps/api/migrations/    Schema shop, RLS, immutable records, uniqueness
apps/worker/            Local FFmpeg, ZIP and checksum worker
packages/shared/       TypeScript models, Zod contracts, ownership identity
tests/e2e/             Playwright browser workflows
demo-assets/           Labeled sample media, not production merchandise
docs/                  Original plan, evidence, setup and release gates
```

Catalog/release configuration dùng typed JSONB; các thực thể giao dịch có bảng riêng, generated relational keys, foreign keys, indexes, immutable triggers và unique payment/ownership constraints. Xem [ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Kiểm tra

```sh
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
pnpm --filter @zenith/api workers:typecheck
pnpm --filter @zenith/api workers:check
```

`pnpm test` dùng PostgreSQL cục bộ (PGlite), HTTP API thật và worker/FFmpeg thật. Playwright tạo database riêng cho mỗi lượt. `workers:check` chỉ dry-run, không deploy.

## Môi trường thật

1. Xác minh Supabase project mới do chủ cửa hàng cung cấp. Không cần kết nối project cũ để setup Shop mới.
2. Điền cấu hình mới theo `.env.example` của API/web/worker, dùng `SHOP_*` / `VITE_SHOP_*`. Các giá trị kết nối Supabase cũ đã bị gỡ; giữ nguyên cấu hình không liên quan.
3. Chạy migration/seed riêng sau khi xác minh target. Migration chỉ tạo schema `shop`, không đụng `auth`, `storage` hoặc bảng cũ ở `public`.
4. Cấu hình R2, SMTP Resend cho Auth, email thanh toán, Discord, UUID Admin và MB Bank.
5. Upload hàng thật; kiểm tra email, giao dịch, file lớn, khôi phục, backup và hosting. Rà soát điều khoản/thuế/hóa đơn trước khi bật checkout.

PayPal được hoãn đúng plan. Không có PayPal giả, tự deploy hay tự chuyển domain.
