# Vận hành ZENITH MEDIA

Trạng thái ngày 2026-11-11: mã nguồn và demo cục bộ đã được xây dựng; chưa triển khai, chưa mở bán. Theo yêu cầu chủ dự án, đã gỡ kết nối Supabase cũ và chờ cấu hình project mới. Không có lệnh tự xóa dữ liệu cũ hoặc tự chuyển domain trong repository.

## 1. Chuẩn bị Supabase mới

Đã xóa `DATABASE_URL` cũ khỏi `apps/api/.env` và bản lưu `.local/abandoned-portfolio-20261110/apps/portfolio-api/.env`; đã gỡ các biến Supabase/Realtime cũ khỏi `apps/web/.env`. Các biến `SHOP_*` / `VITE_SHOP_*` cho Supabase mới để trống. Không sửa cấu hình dịch vụ khác, không thu hồi key trên nhà cung cấp và không xóa database/Auth/buckets của project cũ. Lịch sử Git không bị viết lại.

1. Nhận thông tin project mới từ chủ sở hữu: Project URL, public client key, database connection và tài khoản Admin. Điền bí mật trực tiếp vào cấu hình cục bộ hoặc secrets của hosting.
2. Xác minh project reference, URL API, database host và username pooler thuộc đúng project mới. Không sao chép cấu hình cũ sang project mới.
3. Điền `SHOP_DATABASE_URL` và `SHOP_DATABASE_HOST_CONFIRM`. `pnpm db:inventory` chỉ đọc project đã xác minh và không còn đọc biến `DATABASE_URL` cũ; thiếu cấu hình hoặc host không khớp sẽ dừng trước khi kết nối.
4. Kiểm tra dữ liệu hiện có của project mới trước khi migration/seed; sao lưu nếu project đã có dữ liệu cần giữ. Chưa chạy migration hay seed lên Supabase trong lượt ngắt kết nối.
5. Project cũ được để nguyên trên nhà cung cấp. Nếu sau này cần dọn hoặc di chuyển dữ liệu cũ, phải kiểm kê/backup đúng mục tiêu ở một đợt riêng; bước đó không chặn việc thiết lập project mới.

## 2. Cấu hình môi trường mới

Điền các ô Supabase trống trong `.env` hiện tại theo `.env.example` của từng workspace; giữ các thiết lập dịch vụ khác. Chỉ đưa publishable/anon key vào `apps/web/.env`; không đưa database password, R2 key, worker secret, Resend key, Discord webhook hoặc service role vào biến `VITE_*`.

| Nơi                 | Cấu hình cần điền                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| API                 | `SHOP_DATABASE_URL`, `SHOP_SUPABASE_URL`, `SHOP_SUPABASE_KEY`, `SHOP_ADMIN_USER_ID`, `SHOP_WEB_ORIGIN`, worker secret và các provider |
| Web                 | `VITE_SHOP_SUPABASE_URL`, `VITE_SHOP_SUPABASE_KEY`; API origin bỏ trống khi cùng domain                                               |
| Worker máy cá nhân  | `SHOP_API_URL`, `SHOP_WORKER_SECRET`; binary/font override nếu cần                                                                    |
| Migration/seed      | `SHOP_DATABASE_HOST_CONFIRM` phải khớp host đã kiểm chứng                                                                             |
| Xử lý xóa tài khoản | `SHOP_SUPABASE_SERVICE_ROLE_KEY` chỉ ở API server/Workers secret; không cần cho đăng nhập thông thường                                |

`SHOP_ADMIN_USER_ID` là UUID Auth của chủ cửa hàng đã xác minh, không phải email nhập từ client. Sử dụng TLS cho kết nối database ngoài máy. Giới hạn database role vào schema cần thiết; runtime không dùng role `anon`/`authenticated` để truy vấn `shop`.

Sau khi xác minh host và khả năng khôi phục:

```sh
pnpm db:migrate
pnpm --filter @zenith/api db:seed
```

Migration tạo schema `shop`, constraints, RLS và immutable triggers. Seed thật chỉ tạo danh mục/cấu hình; không thêm hàng demo. Checkout mặc định tắt. Không thêm `shop` vào exposed schemas của Supabase Data API. Kiểm tra client anon/authenticated không đọc được order/file/account trực tiếp.

## 3. Supabase Auth và Resend

Bật email/password, xác minh email và secure email change. Cho phép redirect chính xác tới `/auth/callback` và `/auth/callback?recovery=true` của origin thật. Đặt Site URL đúng domain; chỉ thêm localhost khi cần thử nghiệm.

SMTP mặc định của Supabase không dành cho production. Cấu hình custom SMTP để gửi xác minh, khôi phục và OTP. [Hướng dẫn Supabase](https://supabase.com/docs/guides/auth/auth-smtp).

Resend yêu cầu domain gửi đã xác minh. Trong Supabase SMTP: host `smtp.resend.com`, port `465`, username `resend`, password là API key riêng; điền sender thuộc domain đã xác minh. [Hướng dẫn Resend](https://resend.com/docs/send-with-supabase-smtp).

Template email OTP/Magic Link cần hiển thị `{{ .Token }}` để khách nhập mã khi yêu cầu xóa tài khoản. Bật các email bảo mật đổi mật khẩu/email trong Supabase. Giữ email xác minh/khôi phục riêng với email xác nhận thanh toán của API (`SHOP_RESEND_KEY`, `SHOP_EMAIL_FROM`).

Thử với hộp thư thật do chủ cửa hàng kiểm soát: đăng ký chưa xác minh bị chặn checkout; xác minh; quên mật khẩu; đổi email cần xác nhận; đổi mật khẩu; đăng xuất tất cả thiết bị; yêu cầu xóa bằng mật khẩu và OTP. Chưa nghiệm thu các bước này bằng email thật trong lượt xây dựng source.

## 4. R2 và file

Tạo hai bucket riêng. **Products luôn private**: không bật public URL/r2.dev hoặc custom public domain cho bucket này. Previews chỉ chứa media được phép công khai; gắn HTTPS CDN vào `SHOP_PREVIEW_ORIGIN`. Key API R2 chỉ ở server, giới hạn đúng hai bucket.

Browser upload qua presigned PUT vẫn cần CORS của R2. Ví dụ policy cho Dashboard; thay origin bằng domain thực tế và không dùng `*` cho production. [R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/).

```json
[
  {
    "AllowedOrigins": ["https://YOUR_STORE_DOMAIN"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Range"],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Range",
      "Accept-Ranges"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

Ứng dụng giới hạn single PUT sản phẩm dưới 5.000.000.000 byte; attachment dưới 10 MiB, chỉ JPG/PNG/WebP/PDF/TXT. Không có multipart/resumable uploader. Upload tuần tự, có tiến độ và retry; một file lỗi không bỏ các file sau. Kích thước lớn và mạng chập chờn cần thử trên R2 thật trước khi bán.

Quy trình Admin: upload → finalize → worker checksum/ZIP → tạo preview với đoạn bắt đầu/thời lượng → đợi `done` → chọn main preview và file đã kiểm tra → publish. AE cần compatibility, hướng dẫn song ngữ và README. Bundle cần ZIP hợp lệ, đủ thành phần; cảnh báo nhẹ cần xác nhận có audit.

Không overwrite file đã bán. Staging, bản preview thất bại và object orphan có thể còn lại; chưa tự dọn. Trước khi xóa thủ công trên R2, đối chiếu file key với offers, order snapshots, entitlements, tickets và jobs. Không xóa chỉ vì thấy tên `staging` hoặc vì file không hiện ngoài catalog. API từ chối xóa file đang có liên kết.

Phục hồi: upload bản backup như file mới → đợi checksum ready → chọn file mất và ID bản thay thế trong Admin. Backend chỉ chấp nhận cùng SHA-256 và dung lượng, chép vào key cũ và gửi notification cho khách bị ảnh hưởng. Không dùng file có nội dung khác để thay thế một quyền đã bán.

## 5. Worker, payment và outbox

Chạy `pnpm worker` trên máy chủ cửa hàng khi có job. Máy cần đủ dung lượng tạm cho source/ZIP/preview và không ngủ giữa tác vụ dài. FFmpeg/FFprobe packaged; font riêng có thể đặt bằng `WATERMARK_FONT_PATH`. Tắt tiến trình dừng nhận job mới; lease hết hạn sẽ được nhận lại. Xem lỗi/retry ở Admin Uploads.

MB Bank cần số tài khoản, tên chủ tài khoản và một lần kiểm tra QR bằng app ngân hàng thật. Không dùng thông tin demo. Khách báo đã chuyển chỉ chuyển trạng thái chờ Admin. Đối chiếu mã đơn, số tiền, tài khoản và reference giao dịch thật trước khi xác nhận; reference không được dùng cho hai đơn. Đơn quá hạn hoặc số tiền khác yêu cầu ghi chú ngoại lệ. Không suy luận tiền đã vào từ ảnh khách gửi.

Outbox gửi email payment thành công và webhook Discord. Webhook Admin là kênh riêng; Community chỉ nhận nội dung sản phẩm công khai. Không đổi chéo hai URL. Node API có vòng dispatch, Workers có cron, worker có thể dispatch; lease tránh xử lý đồng thời. Khi hết lần thử tự động, kiểm tra cấu hình rồi retry từ Admin. Discord có thể có thông báo lặp nếu mất ACK, nhưng payment/entitlement không lặp.

## 6. Hosting Cloudflare

Giữ Express theo plan. Adapter sử dụng `node:http` và `cloudflare:node`, với repository/connection theo request. Đã typecheck, bundle dry-run và gọi `/api/runtime` trên workerd cục bộ. Đây chưa phải kết quả đo Workers Free với Supabase/R2 thật. [Node HTTP trong Workers](https://developers.cloudflare.com/workers/runtime-apis/nodejs/http/).

```sh
pnpm build
pnpm --filter @zenith/api workers:typecheck
pnpm --filter @zenith/api workers:check
```

`workers:check` chỉ dry-run. Không chạy `wrangler deploy`, chuyển DNS/domain hoặc bật cron production trước khi được yêu cầu triển khai. Khi triển khai được duyệt, đưa secrets vào Workers bằng cơ chế secrets của provider; không commit `.dev.vars`. Build web phải dùng mode production, không `--mode demo`.

Đo CPU/request, bộ nhớ, startup, subrequests, socket connections và lock wait với catalog/đơn thật. Những truy vấn hiện đọc nhiều dòng rồi lọc phải được benchmark. Nếu không đáp ứng Workers Free, trình kết quả và phương án cho chủ cửa hàng quyết định; không âm thầm đổi stack/hosting. [Giới hạn Workers](https://developers.cloudflare.com/workers/platform/limits/).

## 7. Mở bán và vận hành định kỳ

- Upload sản phẩm thật; thay mọi media/demo merchandise, kiểm tra license nguồn và file tải.
- Hoàn thiện điều khoản, privacy, hoàn tiền, căn cứ lưu chứng từ, thuế/hóa đơn và giao dịch quốc tế với người có chuyên môn phù hợp. Nội dung seed là bản nháp, không phải tư vấn pháp lý hay xác nhận tuân thủ.
- Xác minh tài khoản ngân hàng, email Auth/payment, kênh Discord và quyền Admin. Thử một đơn kiểm soát, refresh/double-submit, số tiền sai, hết hạn, Library và download nhiều người dùng.
- Thử backup/restore database và file, Range download và cấp lại URL khi hết hạn. Mã ký GET có hạn 5 phút; log ghi nhận yêu cầu cấp link, không chứng minh trình duyệt đã lưu đủ bytes.
- Chỉ bật `legalReviewed` và `checkoutEnabled` sau khi hoàn tất các bước trên. Không có PayPal trong bản này.
- Theo dõi dung lượng R2, request classes, email quota, Supabase và Workers; đối chiếu biểu phí hiện hành trước khi tăng dung lượng/lưu lượng. Không tự nâng gói hoặc phát sinh đăng ký trả phí.
- Định kỳ sao lưu database, file gốc đã bán, README/ZIP và cấu hình. Giữ checksum manifest và thử phục hồi; lưu ngoài máy chạy worker.

Với yêu cầu xóa tài khoản, khách phải hoàn tất password + OTP trước. Admin ghi rõ căn cứ/thời hạn lưu hồ sơ, rồi xử lý. API khóa tài khoản trước, xóa Supabase Auth và ẩn danh profile; giữ order/payment/support evidence theo căn cứ đã ghi. Nếu Auth lỗi, tài khoản vẫn khóa và có thể retry. Chưa có lịch tự động xóa chứng từ sau thời hạn.
