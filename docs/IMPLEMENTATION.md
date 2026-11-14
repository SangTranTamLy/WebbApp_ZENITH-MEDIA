# Đối chiếu triển khai với Plan_Shop

Ngày: 2026-11-10. Nguồn yêu cầu: [Plan_Shop.md](Plan_Shop.md), đọc toàn bộ trước khi rewrite. Tài liệu plan là đặc tả để đối chiếu, không tự cấp quyền deploy hoặc xóa production.

Đợt rà soát tiếp theo đã hoàn thiện giao diện Studio, thông số/file theo chất lượng, preview thành phần Bundle, cảnh báo giỏ hàng, upload và các lỗi điều hướng. Xem [SHOP_AUDIT.md](SHOP_AUDIT.md) để đối chiếu đủ mục 0–24, thay đổi cụ thể và cách thử demo. Số liệu bên dưới đã cập nhật theo bản này.

## Source và phạm vi

Đã chạy `git pull --ff-only`: nhánh main đã ở bản mới nhất `08d434c`. Làm trên nhánh `codex/zenith-digital-store`, chưa deploy. Source portfolio, AI/RAG và messaging cũ được thay bằng monorepo cửa hàng. Lịch sử cũ còn nguyên trong Git. Ngày 2026-11-11 đã gỡ giá trị kết nối Supabase cũ trong `.env` và bản lưu cục bộ theo yêu cầu; runtime và công cụ database chỉ dùng cấu hình `SHOP_*` / `VITE_SHOP_*` cho project mới.

**Đã làm phần mã nguồn và kiểm chứng cục bộ; chưa nghiệm thu production của toàn bộ plan.** Kết nối Supabase cũ không kiểm kê được (`tenant/user not found`). Không suy đoán project, không xóa users/buckets/bảng và không đổi website hiện hành. Các phụ thuộc môi trường thật được liệt kê riêng dưới đây.

Quyết định mới ngày 2026-11-11: chủ dự án sẽ chuẩn bị Supabase mới. Việc sửa kết nối project cũ không còn là điều kiện setup Shop; cấu hình Supabase mới hiện để trống. Build API/web và kiểm tra inventory dừng trước kết nối khi thiếu cấu hình đã qua sau thay đổi này.

## Ma trận yêu cầu

| Mục plan                            | Kết quả trong source                                                                                                                               | Bằng chứng / giới hạn                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1, 18 — full rewrite, giữ stack     | React/TS/Vite, Express/TS, Drizzle/PostgreSQL, pnpm; shared contracts; API/worker/web riêng                                                        | Typecheck, build; Workers adapter local                                                |
| 2 — catalog, chất lượng, trạng thái | 2 cấp danh mục; Video/AE/Bundle; offer theo quality/release; draft/published/revision; hide/retire                                                 | Test draft isolation, category ancestor, immutable offers                              |
| 3 — Bundle/credits/update           | Thành phần độc lập/độc quyền, credit Admin, chống trùng quyền, Coupon stacking, upgrade/free update                                                | Test sở hữu chính xác, đổi giá, late-paid free update, integer rounding                |
| 3.6 — ZIP                           | CRC/entry traversal/symlink/encryption/duplicate/size; cảnh báo metadata; publish kiểm tra thành phần                                              | ZIP thật hợp lệ và lỗi trong tests; chưa antivirus                                     |
| 4 — preview/watermark               | Worker FFmpeg độc lập, job bền vững, lease/heartbeat/reclaim, watermark/đoạn chọn, tối đa 720p/FPS/tỷ lệ                                           | FFmpeg thật và HTTP worker subprocess; chặn publish sớm                                |
| 5 — upload/file                     | PUT tuần tự, progress/retry/skip lỗi, staging→immutable key, R2 adapter, checksum, restore, reference guard                                        | Local signed storage + worker E2E; R2/file lớn còn cần thử thật                        |
| 6–8 — storefront                    | Creative Studio Light, Dark, VI/EN, VND/USD; Hero Admin chọn; search/sort/Load More; gallery/quality/specs/dependencies/related; mobile sticky buy | Screenshot desktop/mobile, browser interactions; mẫu media có nhãn demo                |
| 9 — Wishlist                        | API theo user, thêm/bỏ, trang riêng                                                                                                                | Không review/rating/testimonial giả                                                    |
| 10 — cart/checkout/Coupon           | Cart Drawer, Buy Now, server quote, itemized totals, terms/email gates, persisted idempotency                                                      | API/Playwright checkout, forged price, overlap, duplicate request                      |
| 11 — MB/payment                     | VietQR/mã đơn/15 phút, reported/wait, manual reconciliation, unique bank reference, exceptions                                                     | Admin UI xác nhận và download thật trong demo; chưa giao dịch MB thật                  |
| 12 — Library                        | Grid/List, grouping, bản đã sở hữu, nhớ lựa chọn, changelog, file list, history, signed download, missing/restore notices                          | IDOR/private download, native browser download, checksum restore                       |
| 13 — account/Admin                  | Supabase Auth flows, verified checkout, backend UUID Admin, block, password+OTP deletion request, Admin xử lý có retention note                    | Demo auth/authorization tests; SMTP/Auth thật chưa được cấu hình/kiểm thử              |
| 14 — notifications/email/Discord    | Read/unread/all/delete, private/public outbox, retry/lease, Resend idempotency                                                                     | Không gửi email/webhook thật trong lượt phát triển                                     |
| 15 — Support/FAQ/AE                 | Ticket FIFO, order scope, verified attachments, reply, close/reopen; FAQ và bilingual README/instructions                                          | Test customer/Admin ticket + notification; attachment sniffing/limits                  |
| 16 — Admin                          | Overview, product/draft/publish, immutable offers/policies, categories/Coupon, uploads/jobs, order/customer, settings/audit/outbox                 | Browser draft isolation + payment; sensitive actions audit                             |
| 17 — legal/billing                  | Nội dung license/refund dự thảo, checkout gates; receipt/order information                                                                         | Chưa chốt điều khoản riêng, privacy, thuế/hóa đơn; không nhận là đã tuân thủ pháp luật |
| 18–19 — runtime/cost/backup         | Express Workers adapter + dry-run, env examples, manual setup/restore procedures                                                                   | Chưa benchmark Free thật, chưa mua gói, chưa backup dữ liệu production                 |
| 20 — out of scope                   | Không PayPal, chatbot, mạng xã hội/chat, review, multi-seller, auto cleanup, multipart                                                             | Giữ đúng phạm vi giai đoạn đầu                                                         |

## Kiểm chứng đã thực hiện

- TypeScript toàn workspace, production build API/web và ESLint.
- `pnpm test`: 46 kiểm thử API/PostgreSQL/worker-flow và 2 kiểm thử worker/FFmpeg/ZIP, tất cả qua theo bộ đếm Node test runner. PostgreSQL trong kiểm thử là PGlite, không thay thế kiểm thử Supabase thật.
- `pnpm test:e2e`: 6 kịch bản Chromium, tất cả qua: checkout→Admin confirm→download→credits→support/notification; responsive/VI/EN/Light/Dark/reduced-motion; draft isolation; gallery/quality/spec/file/Bundle/cart/mobile; mạng lỗi sau checkout; upload lỗi/thử lại. Dữ liệu và cổng test riêng.
- Trường hợp bảo mật: giả Admin, chưa xác minh email, IDOR, RLS client roles, file đã bán, giá giả, reference trùng, xác nhận song song, checksum sai, worker mất lease, account deletion chưa có challenge/OTP.
- Workers typecheck, Wrangler bundle dry-run; `/api/runtime` chạy trong workerd cục bộ. Không dùng mock để tuyên bố đã deploy. `/api/health` ở adapter chưa có provider trả setup-required đúng dự kiến.
- Smoke browser 29 route/trạng thái trên desktop/mobile; không phát hiện lỗi JavaScript, ảnh lỗi đã tải hoặc tràn ngang. Đã kiểm tra screenshot Light/Dark trên desktop/mobile, thêm Home tiếng Anh rộng 320 px.
- Lighthouse 13.6.0 trên demo Studio build, mobile emulation: Performance **92**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 0,9 s, LCP 3,3 s, TBT 70 ms, CLS 0,001. Kết quả cục bộ lưu ở `.local/lighthouse-studio-final.json`, không phải SLA/benchmark production. LCP còn trên 2,5 s; cần tối ưu kích thước/CDN media thật và đường tải Hero khi triển khai.

Test reports/screenshot/trace sinh trong `.local/screenshots`, `.local/lighthouse*.json`, `playwright-report`, `test-results` (đều ignored). CI mới chỉ khai báo checks trên pull request/push, không có job deploy; chưa chạy CI trên GitHub vì chưa push.

## Những bước còn phụ thuộc môi trường thực tế

1. Nhận và xác minh Supabase project mới do chủ dự án cung cấp. Dữ liệu project cũ được để nguyên; mọi việc dọn/di chuyển sau này cần kiểm kê và backup riêng.
2. Điền credentials mới, chạy migration và seed có kiểm soát; kiểm tra Auth/SMTP security emails/OTP thật.
3. Tạo private Products/public Previews buckets, CORS/CDN và thử upload/download/khôi phục file lớn trên R2.
4. Điền MB Bank, kiểm tra QR và đối chiếu giao dịch kiểm soát; cấu hình Resend và hai Discord webhook đúng kênh.
5. Upload hàng thương mại thật và hoàn thiện chính sách/pháp lý/hóa đơn. File demo AE cố ý là `.txt` minh họa quy trình giao hàng, không giả nhận là preset dùng được.
6. Benchmark Express + Supabase + R2 trên Workers Free trước khi chốt hosting; chỉ deploy/chuyển domain sau khi được yêu cầu rõ.

Các bước đó chưa được đánh dấu hoàn tất hoặc thay bằng credentials đoán. Xem [OPERATIONS.md](OPERATIONS.md) để thực hiện tuần tự.

## Quyết định triển khai và giới hạn

- Offer bất biến nhưng đổi giá giữ cùng ownership identity (product/release/quality). Đơn cũ giữ snapshot; không nhận “giá mới” là quyền mua mới.
- 20 bảng nghiệp vụ dùng typed JSONB, có FK/generated columns/unique constraints cho các quan hệ giao dịch. Khóa transaction chung ưu tiên tính nhất quán cho một shop nhỏ; truy vấn/list và lock wait cần tối ưu theo số liệu tải thật.
- Attachment được kiểm tra kích thước/MIME/signature, ZIP có giới hạn giải nén. Không tuyên bố đã có quét malware toàn bộ file hoặc chống mọi định dạng giả mạo.
- Browser download/resume phụ thuộc Range và thời hạn signed URL. Lịch sử lưu yêu cầu tải, không theo dõi xác nhận lưu file ở thiết bị.
- Xóa Auth cần service role tùy chọn ở server. Order/payment/support evidence được giữ theo ghi chú lưu trữ; chưa có cơ chế tự xóa chứng từ sau thời hạn pháp lý.
- Free update cấp thêm quyền khi publish hoặc khi đơn cũ được thanh toán; không thu hồi bản cũ. Discord delivery có thể lặp khi mất ACK, nghiệp vụ thanh toán vẫn idempotent.
- Media minh họa do ImageGen tạo, không phải hàng/thành tích/đánh giá khách hàng thật. Không dùng demo database cho production.
- `pnpm peers check` còn hai cảnh báo ở nhánh WASM tùy chọn của công cụ build: `@napi-rs/wasm-runtime@1.2.0` yêu cầu `@emnapi/core/runtime` 2 alpha trong khi dependency tree có 1.11.1. Native build Windows đã qua; không ép override sang bản alpha. CI Linux và fallback WASM chưa được chạy trong phiên này.
