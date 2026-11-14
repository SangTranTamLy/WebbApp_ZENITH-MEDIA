# Rà soát Shop và bản demo Studio

Ngày 2026-11-10. Đối chiếu toàn bộ mục 0–24 của [Plan_Shop.md](Plan_Shop.md), cùng quyết định mới nhất của chủ dự án: tiếp tục Shop, không làm Portfolio. Plan là đặc tả sản phẩm; không tự cấp quyền xóa dữ liệu, push hoặc deploy.

Cập nhật 2026-11-11: chủ dự án yêu cầu gỡ Supabase cũ và sẽ cung cấp project mới. Đã gỡ kết nối cũ trong web/API và bản lưu cục bộ, để trống cấu hình mới; project cũ trên nhà cung cấp giữ nguyên. Các kết quả kiểm thử giao diện trong báo cáo là của lượt 10/11; hướng setup hiện tại xem [OPERATIONS.md](OPERATIONS.md).

**Kết quả: đã sửa các thiếu sót tìm thấy trong mã nguồn và làm lại giao diện demo. Chưa coi toàn bộ Shop là sẵn sàng mở bán thật.** Những phụ thuộc môi trường ở cuối báo cáo còn phải được nghiệm thu.

## Những phần được hoàn thiện trong lượt rà soát này

| Vấn đề tìm thấy                                                                          | Thay đổi và hành vi sau khi sửa                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trang chủ thiếu khu vực sản phẩm mới; hình ảnh và thứ bậc thị giác chưa tốt              | Home mới gồm Hero, nhóm danh mục, sản phẩm nổi bật có bộ lọc, Bundle, sản phẩm mới và FAQ. Sáu bộ artwork/preview riêng thay cho các hình minh họa lặp lại.                                                       |
| Chọn chất lượng nhưng thông số/file vẫn dùng chung                                       | Mỗi offer có thông số và danh sách file riêng; giá, dung lượng, file và quyền mua đổi theo lựa chọn. Aurora có file demo 540p và 720p thực sự khác nhau.                                                          |
| Bundle chưa cho xem rõ từng thành phần                                                   | Hiển thị thành phần, preview đã xử lý, liên kết đến sản phẩm độc lập và preview riêng cho nội dung độc quyền khi Admin cấu hình. Không lộ bản nháp hoặc đường dẫn file gốc.                                       |
| Video gallery/thành phần có thể được cấu hình bằng URL chưa qua xử lý                    | Admin chọn từ job preview đã hoàn thành; backend chặn video chưa qua watermark khi tạo offer hoặc publish.                                                                                                        |
| Thẻ sản phẩm nhận diện sở hữu theo product ID quá rộng                                   | Đối chiếu đúng quyền chất lượng/release. Khách sở hữu một lựa chọn vẫn thấy và mua được lựa chọn còn lại.                                                                                                         |
| Xung đột video riêng và Bundle chỉ phát hiện muộn                                        | Cart Drawer cảnh báo quyền trùng và yêu cầu bỏ mục xung đột trước khi đến checkout; backend tiếp tục kiểm tra độc lập.                                                                                            |
| Giảm giá nâng cấp/Bundle chưa rõ trước checkout                                          | Trang chi tiết lấy quote từ server; checkout thể hiện giá và giảm trừ từng dòng, cùng tổng tiền. Receipt ghi lựa chọn/release và số tiền từng dòng.                                                               |
| Đơn đã lưu nhưng refresh tài khoản lỗi có thể làm khách mắc lại ở checkout               | Chuyển ngay tới đơn đã tạo; cập nhật hồ sơ chạy riêng. Kiểm thử mô phỏng `/me` trả 503 vẫn mở được đơn và màn hình chuyển khoản.                                                                                  |
| Callback đăng nhập có thể cập nhật trạng thái lệch thứ tự                                | Chờ token/hồ sơ trước khi điều hướng; bỏ kết quả callback cũ khi session đã đổi. Luồng Auth thật vẫn cần kiểm thử trên Supabase.                                                                                  |
| Upload chưa có tiến độ PUT rõ ràng, lỗi từng file cần xử lý tốt hơn                      | Tiến độ theo byte qua XHR; lỗi một file vẫn tiếp tục hàng đợi, thử lại riêng từng file, hủy request khi rời màn hình. Phân biệt tải xong và chờ worker kiểm tra.                                                  |
| Gallery ảnh dùng sai nguồn, tab thiếu điều khiển bàn phím, thanh mua mobile chưa ổn định | Dùng đúng URL ảnh; tab hỗ trợ mũi tên/Home/End; thanh mua chỉ hiện sau khi cuộn qua vùng mua chính.                                                                                                               |
| Sản phẩm liên quan chưa giữ đúng ưu tiên Admin                                           | Giữ thứ tự đã cấu hình, rồi bổ sung theo danh mục/tag/độ ưu tiên từ sản phẩm còn bán hợp lệ.                                                                                                                      |
| Homepage tải catalog lặp và ảnh/video ngoài màn hình quá sớm                             | `/storefront` trả một snapshot không lặp sản phẩm, `/config` chỉ trả cấu hình/danh mục. Ảnh tải gần viewport; video chỉ nhận nguồn và phát khi vào vùng nhìn, dừng khi ẩn tab/ra ngoài, tôn trọng reduced motion. |
| Một số lỗi ở chế độ EN còn trả nguyên tiếng Việt                                         | Bổ sung bản dịch các mã lỗi nghiệp vụ hiện có.                                                                                                                                                                    |

## Đối chiếu toàn bộ plan

“Có trong source/demo” dưới đây không đồng nghĩa đã nghiệm thu nhà cung cấp hoặc dữ liệu production.

| Mục                                      | Kết quả đối chiếu                                                                                                                                                      |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — nguyên tắc, khách hàng, ngôn ngữ     | Shop cho media assets, VI/EN; áp dụng quyết định mới nhất.                                                                                                             |
| 1 — full rewrite và bảo vệ dự án cũ      | Nhánh `codex/zenith-digital-store`; giữ stack và lịch sử Git. Không sửa `.env` cũ, không đụng Supabase thật. Kiểm kê/backup project cũ còn chờ kết nối hợp lệ.         |
| 2 — danh mục, quality, AE, trạng thái    | Danh mục hai cấp, offer chất lượng/release, compatibility/dependencies, draft/publish/hide/retire. Bổ sung thông số và file theo từng offer.                           |
| 3 — Bundle, credits, Coupon, update, ZIP | Quyền chính xác, giảm trừ do Admin cấu hình, stacking, upgrade/free update, chặn quyền trùng; kiểm tra ZIP thật. Bổ sung preview thành phần và cảnh báo sớm trong giỏ. |
| 4 — preview/watermark                    | FFmpeg worker riêng, job bền vững, lease/heartbeat/reclaim; preview chính và video phụ đều phải sẵn sàng. Demo dùng clip minh họa có watermark.                        |
| 5 — R2/upload/bảo toàn file              | Adapter private storage, PUT tuần tự, progress/retry, checksum/restore/reference guard. Đã thử local; file lớn và CORS/R2 thật còn chờ.                                |
| 6 — thiết kế/điều hướng                  | Creative Studio Light mặc định, Dark, menu ngang/dropdown/mobile; search/Wishlist/account/Library/cart được giữ.                                                       |
| 7 — homepage/card/list                   | Hero Admin chọn và bấm để phát; featured/new/category/Bundle; card phát trong viewport; search/sort/Load More. Không thêm số bán/đánh giá giả.                         |
| 8 — trang chi tiết                       | Gallery thumbnail/carousel, mua cạnh preview, lựa chọn đúng giá/quyền/spec/file; desktop tab/mobile accordion; sticky buy và related responsive.                       |
| 9 — Wishlist                             | Lưu theo tài khoản, trạng thái nút và trang riêng; không triển khai reviews.                                                                                           |
| 10 — cart/checkout/Coupon                | Drawer/Buy Now, quote server, dòng tiền chi tiết, terms/email gates, idempotency; thêm xử lý refresh lỗi sau khi tạo đơn.                                              |
| 11 — thanh toán/đơn                      | VietQR, mã đơn, 15 phút, báo chuyển khoản/chờ/Admin xác nhận; không cấp quyền khi chỉ báo chuyển. Chưa giao dịch MB thật; PayPal tiếp tục hoãn.                        |
| 12 — Library                             | Grid/List, tìm/lọc, chỉ bản đã sở hữu, nhớ lựa chọn, file/changelog/lịch sử tải, signed download và thông báo phục hồi.                                                |
| 13 — account/Admin                       | Supabase Auth flows, xác minh email, UUID Admin ở backend, khóa tài khoản, yêu cầu xóa có challenge. Auth/SMTP thật còn chờ nghiệm thu.                                |
| 14 — thông báo/email/Discord             | Notification đọc/chưa đọc, outbox theo kênh, retry/lease/idempotency. Không gửi email/webhook thật trong lượt làm này.                                                 |
| 15 — Support/FAQ/AE                      | Ticket FIFO, đính kèm, trả lời/đóng/mở, FAQ, hướng dẫn song ngữ/README. AE demo là file text được ghi rõ, chưa phải asset AE sử dụng được.                             |
| 16 — Admin                               | Overview, product/offer/policy/category, upload/job, order/customer/Coupon/support/settings/audit; thêm editor specs và chọn preview thành phần.                       |
| 17 — license/refund/chứng từ             | Có trang/chốt terms và dữ liệu đơn; nội dung pháp lý/thuế/hóa đơn cuối cùng chưa chốt.                                                                                 |
| 18 — kiến trúc                           | React/TS/Vite, Express/TS, Drizzle/PostgreSQL; API/web/worker/shared riêng; migrations/RLS/typed contracts, adapter Workers.                                           |
| 19 — ngân sách/backup                    | Có runbook setup, backup/restore và giới hạn cần quan sát. Chưa đo chi phí/tải production hoặc tạo backup production.                                                  |
| 20 — ngoài phạm vi                       | Không thêm Portfolio, chatbot, review, multi-seller, social chat, PayPal, multipart hay tự dọn file.                                                                   |
| 21 — các giai đoạn                       | Mã nguồn và kiểm thử local được bổ sung; không đánh dấu giai đoạn kiểm kê/provider/phát hành là xong.                                                                  |
| 22 — nghiệm thu mở bán                   | Các quy tắc nghiệp vụ có kiểm thử local; chưa đủ điều kiện tuyên bố mở bán do các bước môi trường thật bên dưới.                                                       |
| 23 — tài liệu kỹ thuật                   | Giữ danh sách nguồn chính thức trong plan; các giới hạn/giá nhà cung cấp phải kiểm tra lại khi triển khai thật. Không suy diễn số liệu local thành giới hạn Free.      |
| 24 — ghi chú cuối                        | Giữ nguyên bản plan gốc. Quyết định thiết kế nhỏ được ghi tại báo cáo này; không sửa thành quyết định kinh doanh của chủ dự án.                                        |

## Thiết kế và cách xem demo

Hướng thiết kế: studio media sáng, tinh gọn; nền trắng pha lavender, chữ đậm rõ, artwork là trọng tâm. Manrope, Lucide và native CSS tiếp nối hệ thống hiện có. Điểm nhấn `#6750c1`, nền `#fcfbfe`, chữ `#24212e`; Dark có bộ token riêng. Bo góc phân cấp 8 px cho điều khiển, 14 px cho media và 24 px cho vùng nổi bật. Dials: variance 7 / motion 4 / density 4.

Giữ các route và tên khu vực quan trọng. Chuẩn hóa khoảng cách, form, card, bảng mua, tab, cart và tài khoản; công tắc sáng/tối ở header. Không thêm testimonial, điểm số hoặc thành tích giả.

1. Chạy `pnpm demo`, mở `http://127.0.0.1:5173/`; xem Hero, bộ lọc và sản phẩm mới.
2. Mở `/products/aurora`, đổi 540p/720p để thấy giá, thông số và file thay đổi.
3. Mở `/products/studio-bundle`, xem preview từng thành phần; thêm Bundle và Aurora vào giỏ để thử cảnh báo trùng.
4. Trang `/login` có nút tài khoản khách/Admin chỉ trong demo. Có thể thử luồng đơn → Admin xác nhận → Library tải file.
5. Đổi Light/Dark, VI/EN và thu cửa sổ để xem bản điện thoại.

Dữ liệu demo mới: `.local/demo-studio-v2/`. Dữ liệu cũ được giữ. Giá, QR và hàng hóa chỉ phục vụ kiểm thử; không chuyển tiền thật. Nguồn artwork, file lưu và prompt: [DEMO_ASSETS.md](DEMO_ASSETS.md).

## Bằng chứng kiểm chứng

- `pnpm check`: typecheck toàn workspace, API/worker tests, production build và lint.
- Bộ API có 46 test theo bộ đếm Node, worker có 2 test; dùng PostgreSQL cục bộ PGlite, HTTP và FFmpeg/ZIP thật. Bộ mới kiểm tra snapshot homepage, offer/file/spec, preview Bundle, không lộ draft, related order và chặn video chưa watermark.
- Playwright có 6 kịch bản: checkout/payment/download/credits/support, responsive/VI/EN/theme/reduced motion, draft isolation, bổ sung các tương tác theo plan, mạng lỗi sau checkout và upload lỗi/thử lại.
- Smoke browser 29 route/trạng thái, desktop 1440 và mobile 390; thêm Home tiếng Anh ở 320. Không phát hiện lỗi JavaScript, ảnh lỗi đã tải hoặc tràn ngang trong lượt kiểm tra. Kiểm tra thị giác ảnh chụp Light/Dark desktop/mobile.
- Lighthouse 13.6.0, mobile emulation, bản demo build tại cổng 5190: **Performance 92 / Accessibility 100 / Best Practices 100 / SEO 100**. FCP 0,9 s, LCP 3,3 s, TBT 70 ms, CLS 0,001, Speed Index 1,3 s. LCP còn trên mốc 2,5 s; cần tối ưu tiếp kích thước/CDN media thực tế và đường tải Hero khi triển khai. Đây là một phép đo local, không phải cam kết production.
- Workers typecheck và bundle dry-run; không deploy. Bằng chứng cục bộ: `.local/final-shop-check.log`, `.local/final-shop-e2e.log`, `.local/studio-qa.json`, `.local/lighthouse-studio-final.json`, `.local/screenshots/`.

## Những việc chưa nghiệm thu trên môi trường thật

1. Nhận và xác minh Supabase project mới; không còn yêu cầu sửa kết nối cũ để setup Shop. Nếu cần thao tác dữ liệu cũ sau này, phải kiểm kê và backup riêng.
2. Cấu hình Supabase/Auth/SMTP/Resend, kiểm thử email xác minh, khôi phục, thay đổi bảo mật và xóa tài khoản thật có kiểm soát.
3. R2 private/public buckets, CDN/CORS, upload/download/resume/restore file lớn với dữ liệu thật.
4. Cấu hình MB Bank đúng chủ tài khoản và đối chiếu giao dịch kiểm thử; Resend/Discord gửi đúng người/kênh.
5. Thay media/file demo bằng hàng bán thật, kiểm tra preset/project AE, hoàn thiện license/refund/privacy và thuế/hóa đơn.
6. Benchmark ứng dụng với Supabase/R2 trên Workers Free, quan sát hạn mức/chi phí, kiểm thử backup/restore, rồi mới xem xét phát hành theo yêu cầu riêng.

Xem [OPERATIONS.md](OPERATIONS.md) cho quy trình triển khai. Không commit/push/deploy, chuyển domain hoặc sửa dữ liệu production trong lượt rà soát này.
