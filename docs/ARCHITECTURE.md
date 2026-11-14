# Kiến trúc cửa hàng

## Trust boundaries

Browser giữ Supabase session, lựa chọn giỏ hàng và tùy chọn hiển thị. Express xác minh lại giá, Coupon, điều khoản, trạng thái bán và quyền tải. Không nhận role/email client làm căn cứ Admin.

Supabase Auth `getUser(accessToken)` xác thực token ở server. `SHOP_ADMIN_USER_ID` là UUID Admin duy nhất. Hồ sơ bị khóa bị chặn mỗi request. Không có JWT tự ký của ứng dụng, không lưu mật khẩu.

Schema `shop` bật RLS và không cấp quyền trực tiếp cho `anon`/`authenticated`. API dùng database role riêng/owner được cấu hình an toàn. Không thêm `shop` vào exposed schemas của Supabase Data API. RLS không thay thế kiểm tra quyền đối tượng ở API.

## Mô hình dữ liệu

20 bảng Drizzle: accounts, categories, products, offers, files, carts, wishlists, coupons, orders, payments, entitlements, downloads, notifications, tickets, ticketMessages, jobs, outbox, audit, settings, guard.

- `products` tách published/draft, revision chống ghi đè bản nháp cũ.
- `offers` gói quality/release, giá, file, README, Bundle items và policy. Offer bất biến; thay đổi cần offer mới rồi công bố draft.
- Quyền sở hữu dùng `productId + normalized release + normalized quality`, độc lập offer ID. Đổi giá không tạo quyền mua lại. Video thường để release trống.
- Bundle giữ một entitlement gốc trong Library, kèm rights/file snapshot thành phần. Nội dung độc quyền không tạo mục mua lẻ giả.
- `orders` chứa snapshot dòng hàng, các khoản giảm, quyền, file, điều khoản, tài khoản ngân hàng. Trigger cấm sửa snapshot/đảo paid.
- `payments` unique order/reference ngân hàng. Entitlements unique user/offer và user/ownership identity. Offer/payment/entitlement/audit có trigger chống update/delete.
- Catalog sử dụng JSONB với Zod/TypeScript; các khóa giao dịch dùng generated columns, FK và unique index. Thiết kế phục vụ một Admin, không giả lập nhiều seller.

## Giao dịch

Mọi mutation chạy trong PostgreSQL transaction, khóa hàng `shop.guard('commerce')` để tuần tự hóa giá/Coupon/order/payment/grant trên nhiều API instance. Không gọi dịch vụ ngoài trong khóa. Cần đo lock wait trước khi tăng quy mô.

Checkout dùng idempotency key + hash nội dung. Chặn đơn đang chờ có nội dung chồng nhau. Coupon tính cả lượt dùng/đặt chỗ trong cùng transaction. `reported` không hết hiệu lực chờ Admin vì QR quá 15 phút. Thanh toán trễ/thiếu/thừa cần xác nhận ngoại lệ và ghi chú.

Đơn 0 VND được server hoàn tất sau kiểm tra quyền, giá, điều khoản và email; không yêu cầu chuyển khoản 0 VND. Đây là chi tiết triển khai để xử lý Coupon/credits giảm về 0.

## File và worker

R2 Products luôn riêng tư. PUT tạm chỉ ghi vào staging. Khi hoàn tất: HEAD → copy sang object key mới không có PUT URL browser → job kiểm tra. PUT URL cũ không ghi đè file cuối. Không tự xóa staging.

Worker nhận secret riêng, dùng thư mục tạm riêng, checksum/ZIP, FFmpeg bằng argument array không qua shell. Preview giữ FPS bằng passthrough, đúng tỷ lệ, tối đa 1280×720, không upscale, có watermark. Lease 120 giây, heartbeat 30 giây, reclaim sau timeout; worker cũ không được hoàn tất job mất lease. Main preview done mới publish.

ZIP được đọc từng entry, kiểm tra CRC, traversal, symlink, encryption, duplicate path, số entry và expansion ratio. Lỗi nghiêm trọng chặn; metadata `__MACOSX` là cảnh báo có xác nhận/audit. Bundle phải có ZIP và đủ tên file thành phần.

Download: auth → entitlement → HEAD → GET URL 5 phút → log yêu cầu. Không báo đã lưu file trên máy. Range/resume dùng được khi trình duyệt/R2 hỗ trợ và URL còn hạn; hết hạn cần cấp URL mới. Không đặt trần tổng số lượt tải, chỉ chống spam theo cửa sổ một phút.

File mất được báo Admin. Phục hồi chỉ dùng bản đã kiểm tra có checksum/dung lượng trùng. Khách liên quan nhận notification, không email hàng loạt.

## Outbox và tài khoản

Outbox ghi cùng transaction. Resend gửi email thanh toán; Auth/security email do SMTP Supabase. Ticket/update/restore dùng notification tài khoản. Discord Admin chỉ nhận thông tin vận hành cần thiết; Community chỉ có sự kiện sản phẩm công khai; tắt allowed mentions.

Outbox có lease, backoff, tối đa 8 lần tự thử và retry thủ công. Resend có Idempotency-Key. Discord có thể lặp thông báo nếu provider nhận thành công nhưng ACK mất; điều này không lặp giao dịch/quyền.

Xóa tài khoản cần xác nhận mật khẩu + email OTP. Admin ghi căn cứ/thời hạn lưu chứng từ rồi xử lý yêu cầu; Auth được xóa bằng service role ở server, hồ sơ được ẩn danh, quyền truy cập bị khóa. Hồ sơ giao dịch và hỗ trợ được giữ theo căn cứ được ghi; không tự quyết định thời hạn pháp lý. Nếu thao tác Auth lỗi, tài khoản vẫn khóa và Admin có thể xử lý lại.

## Giới hạn cần đo trước production

Một số truy vấn hiện đọc danh sách rồi lọc trong application. Không cam kết scaling/10 ms CPU của Workers Free trước khi benchmark với dữ liệu và provider thật. Nếu lưu lượng tăng, chuyển sang truy vấn phân trang/index theo nghiệp vụ và khóa nhỏ hơn, giữ nguyên invariants.

Demo dùng PGlite (PostgreSQL WASM), HTTP API và kho cục bộ có chữ ký. Không giả lập entitlement bằng localStorage. Demo bị cấm khi NODE_ENV=production; production browser không có chọn role demo.
