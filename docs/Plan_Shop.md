# ZENITH MEDIA — KẾ HOẠCH WEBSITE BÁN SẢN PHẨM SỐ

> **Bản tổng hợp quyết định đã chốt với Sang — 10/11/2026**
>
> **Trạng thái:** Kế hoạch / đặc tả yêu cầu. Chưa phải báo cáo các chức năng đã lập trình xong.
>
> **Repository được tái sử dụng:** https://github.com/SangTranTamLy/WebbApp_ZENITH-MEDIA
>
> **Tên miền đã chọn:** https://zenith.io.vn

---

## 0. Cách đọc tài liệu và nguyên tắc áp dụng

Tài liệu này tổng hợp **những quyết định cuối cùng Sang đã xác nhận** trong toàn bộ quá trình thảo luận về website bán Video, Overlay, After Effects Assets và Bundle. Khi có nhiều lựa chọn mâu thuẫn trong lịch sử trao đổi, **lựa chọn mới nhất của Sang có hiệu lực**.

- **ĐÃ CHỐT:** Là yêu cầu triển khai, trừ khi Sang thay đổi bằng quyết định mới.
- **QUY TẮC TRIỂN KHAI:** Chi tiết kỹ thuật để hiện thực hóa yêu cầu đã chốt; có thể điều chỉnh khi kiểm thử, nhưng không được tự ý thay đổi hành vi kinh doanh.
- **CẦN KIỂM TRA KHI TRIỂN KHAI:** Ràng buộc dịch vụ, môi trường, bảo mật, thanh toán hoặc pháp lý; không được báo cáo là đã hoàn thành.
- **KHÔNG TRIỂN KHAI:** Đã bị Sang loại khỏi phạm vi, không tự ý thêm lại.

Tài liệu **không chứa** tài khoản, mật khẩu, API key, thông tin ngân hàng thực tế, private webhook hoặc secret. Các mục này phải được cấu hình trong môi trường bảo mật khi triển khai.

### 0.1. Mục tiêu chính

Xây dựng lại hoàn toàn ZENITH MEDIA thành **website thương mại điện tử chuyên bán sản phẩm số do chính Sang sở hữu/phát hành**:

1. Video Flowframes, Twixtor Slow và các loại Video/Overlay thuộc danh mục được Admin quản lý.
2. After Effects Assets: preset, template, project và các tài nguyên liên quan.
3. Bundle gồm nhiều video/tài nguyên, có thể chứa sản phẩm bán riêng lẫn nội dung độc quyền.
4. Hệ thống mua hàng, thanh toán, cấp quyền tải xuống và hỗ trợ sau mua.
5. Quản trị bởi **một Admin chính**, không xây dựng nền tảng mở cho nhiều người bán.

### 0.2. Đối tượng khách hàng và ngôn ngữ

- Bán cho khách hàng ở **Việt Nam và quốc tế**.
- Hỗ trợ nội dung website bằng **tiếng Việt và tiếng Anh**.
- Giá gốc được Admin nhập bằng **VND**; website hỗ trợ quy đổi và hiển thị **USD**.
- Khách phải có tài khoản đã xác minh email trước khi thực hiện thanh toán.

---

## 1. Những quyết định nền tảng về dự án cũ và dự án mới

### 1.1. Full Rewrite — thay thế hoàn toàn

**ĐÃ CHỐT:** Sử dụng repository cũ làm chỗ phát triển, nhưng **đập đi xây lại toàn bộ website**.

| Thành phần | Quyết định |
| --- | --- |
| GitHub repository | Giữ repository WebbApp_ZENITH-MEDIA |
| Thương hiệu | Tiếp tục dùng ZENITH MEDIA |
| Tên miền | Tiếp tục dùng zenith.io.vn |
| Frontend cũ | Viết lại hoàn toàn |
| Backend cũ | Viết lại hoàn toàn |
| Code Portfolio / Editor Portfolio | Loại bỏ khỏi website bán hàng mới |
| MDA AI Chatbot / RAG cũ | Loại bỏ khỏi website mới |
| Chức năng nhắn tin/chat cũ | Không đưa sang website mới |
| Dữ liệu ứng dụng và tài khoản cũ | Xóa sau bước kiểm kê/xác minh mục tiêu |
| Supabase Project hiện có | Giữ lại **project**, dùng làm nơi thiết kế database mới |
| Website mới | Chỉ tập trung bán sản phẩm số |

**Không giữ những thành phần cũ chỉ vì chúng đã tồn tại.** Chỉ có thể tái sử dụng tài nguyên chung như logo, tên thương hiệu, cấu hình có giá trị và cách tổ chức monorepo khi phù hợp.

### 1.2. Giữ ngôn ngữ và bộ công nghệ hiện tại

**ĐÃ CHỐT theo trả lời cuối cùng của Sang:** Website đang sử dụng ngôn ngữ/công nghệ nào thì tiếp tục sử dụng đúng công nghệ của project đó khi viết lại.

Repository đã được kiểm tra trên nhánh main, commit quan sát: 08d434c (12/10/2026):

- Frontend: **React + TypeScript + Vite**, React Router.
- Backend: **Node.js + Express + TypeScript**.
- Database: **PostgreSQL/Supabase + Drizzle ORM**.
- Quản lý workspace: **pnpm workspaces**.

**Không mặc định chuyển sang Next.js.** Đề xuất Next.js trong giai đoạn thảo luận trước đó đã được thay thế bằng quyết định giữ stack hiện tại.

### 1.3. Nguyên tắc làm lại an toàn

1. Không xóa code trực tiếp trên main khi chưa có bản phiên làm việc tách biệt.
2. Tạo nhánh triển khai mới, ví dụ rewrite/storefront; giữ lịch sử Git để tra cứu và khôi phục.
3. Kiểm kê đúng Supabase Project, bảng dữ liệu, người dùng Auth, buckets, policies, functions, triggers và ứng dụng phụ thuộc trước khi xóa.
4. Sao lưu dữ liệu cần thiết **trước thao tác xóa**. Git không phải bản sao lưu của database.
5. Sang đã quyết định **không giữ dữ liệu/tài khoản cũ**; chỉ giữ Supabase Project, không xóa hoặc làm hỏng các schema hệ thống do Supabase quản lý.
6. Không thực hiện thao tác xóa dựa trên tên dự án suy đoán. Phải kiểm chứng chính xác project và danh sách đối tượng bị ảnh hưởng trong môi trường thực tế.
7. Không push, deploy, thay đổi website đang hoạt động hoặc xóa dữ liệu production khi chưa đến bước triển khai tương ứng và chưa xác nhận đúng mục tiêu.

**Trạng thái tại thời điểm viết README:** Mới kiểm tra mã nguồn repository để lập kế hoạch; chưa xóa Supabase, chưa sửa source code production, chưa triển khai website mới.

---

## 2. Danh mục sản phẩm và mô hình sản phẩm

### 2.1. Cấu trúc danh mục

- **Video & Overlay** là nhóm sản phẩm chính.
  - **Flowframes** là danh mục con.
  - **Twixtor Slow** là danh mục con.
  - Có thể quản lý thêm những nhóm Video/Overlay khác nếu sau này Sang thực sự bán.
- **After Effects Assets** là nhóm sản phẩm chính.
  - Có thể chứa preset, project, template và những loại asset phù hợp.
- **Bundle** có thể được bán như sản phẩm đóng gói nhiều nội dung.
- Chưa đưa **Premiere Pro Assets** thành nhóm bán hàng bắt buộc trong phiên bản đầu.

### 2.2. Video và chất lượng

- Video Flowframes/Twixtor Slow thông thường **không chia theo phiên bản phát hành v1/v2/v3**.
- Nếu Sang cung cấp nhiều chất lượng có giá khác nhau, website cho phép chọn **chất lượng/biến thể được bán** (ví dụ 1080p, 2K, 4K).
- Không ép mọi sản phẩm video phải có nhiều lựa chọn.
- Người mua không được mua lại **đúng chất lượng/biến thể đã sở hữu**.
- Khi mua chất lượng khác, Admin **tự cấu hình chính sách giá nâng cấp theo từng sản phẩm** (quyết định bổ sung sau cùng).

### 2.3. After Effects Assets và thông tin tương thích

**ĐÃ CHỐT:**

- Cho phép sản phẩm After Effects Assets có các phiên bản phát hành khác nhau.
- Thông tin tương thích phải đầy đủ, không chỉ ghi tên phần mềm.
- Hiển thị phiên bản After Effects hỗ trợ, cấu hình/đặc điểm liên quan nếu cần, yêu cầu plugin/font và tài nguyên phụ thuộc.
- Plugin, Font và dependency được quản lý bằng **bảng thông tin riêng** cho từng asset.
- Có **hướng dẫn sử dụng trên website** và **file README** kèm sản phẩm/tệp tải.
- Chính sách bản phát hành mới (miễn phí hay trả phí) do **Admin cấu hình theo từng phiên bản**.
- Quyền sử dụng các phiên bản cũ khách đã mua không bị mất khi có phiên bản mới.

### 2.4. Trạng thái sản phẩm

Mô hình đã thảo luận gồm:

1. **Bản nháp (Draft)** — chưa bán công khai.
2. **Đang bán** — hiển thị, có thể mua nếu đủ điều kiện.
3. **Tạm ẩn** — không hiển thị bán công khai; quyền tải của khách cũ vẫn giữ.
4. **Ngừng bán** — không nhận đơn mua mới; có thể giữ trang thông tin và vẫn phục vụ khách đã mua.

### 2.5. Chỉnh sửa sản phẩm đang bán

**ĐÃ CHỐT — B. Tạo bản chỉnh sửa nháp rồi xác nhận cập nhật.**

- Không ghi đè trực tiếp thông tin đang hiển thị của sản phẩm đã phát hành.
- Admin chỉnh sửa trên bản nháp riêng.
- Sau khi kiểm tra, Admin xác nhận để áp dụng thay đổi.
- Nội dung/file đã bán phải được lưu và liên kết với quyền của khách cũ; không tùy tiện thay thế hoặc xóa phiên bản họ đã mua.

---

## 3. Bundle — cấu trúc, quyền sở hữu, giá và cập nhật

### 3.1. Cấu trúc Bundle

**ĐÃ CHỐT — B:** Bundle hỗ trợ đồng thời:

- Video đã tồn tại dưới dạng **sản phẩm bán riêng**.
- Video **độc quyền trong Bundle**, không bán lẻ.
- Bundle có file ZIP tải trọn bộ, đồng thời hỗ trợ tải file thành phần khi đã có quyền.
- Trang Bundle hiển thị **đầy đủ danh sách video**.
- Trong My Library, Bundle được hiển thị **như một mục riêng**, có thể mở danh sách file bên trong.

### 3.2. Giảm giá khi khách đã sở hữu video thuộc Bundle

**ĐÃ CHỐT — C (chính sách), B (công thức):**

- Khách được giảm giá Bundle dựa trên những video thành phần mà họ **đã sở hữu trước đó**.
- Mức giảm **do Admin tự cấu hình cho từng video** trong Bundle.
- Chỉ áp dụng nếu video đã sở hữu **thực sự trùng với nội dung/quyền tương ứng trong Bundle**.
- Video mua riêng **không nằm trong Bundle** không làm phát sinh giảm giá cho Bundle đó.
- Tính giá ở phía máy chủ, có kiểm tra quyền sở hữu; không tin các số tiền từ trình duyệt.
- Không để giá cuối cùng âm; các khoản giảm phải hiển thị rõ trong Checkout.

**Ví dụ minh họa, không phải bảng giá thật:**

- Bundle giá 500.000 VND.
- Khách đã sở hữu video A nằm trong Bundle.
- Admin cấu hình mức giảm tương ứng video A là 80.000 VND.
- Giá Bundle trước Coupon còn 420.000 VND.

### 3.3. Coupon kết hợp ưu đãi Bundle

**ĐÃ CHỐT — C:** Admin tự cấu hình **Coupon có được kết hợp** với giảm giá từ video đã sở hữu hay không. Không áp một quy tắc cố định cho tất cả sản phẩm.

### 3.4. Bundle có nhiều phiên bản

- **ĐÃ CHỐT — C:** Admin cấu hình chính sách cập nhật **riêng cho từng Bundle**.
- **ĐÃ CHỐT — C:** Giá mua phiên bản Bundle mới đối với khách sở hữu phiên bản cũ do **Admin cấu hình cho từng phiên bản Bundle**.
- Có thể có bản cập nhật miễn phí hoặc cần thanh toán tùy chính sách Admin đặt.
- Khách vẫn được truy cập những phiên bản/file cũ mà họ có quyền.

### 3.5. Trùng video riêng và Bundle trong cùng giỏ hàng

**ĐÃ CHỐT — A: Cảnh báo và yêu cầu khách lựa chọn.**

- Nếu video riêng và Bundle chứa video đó cùng nằm trong Cart, hiển thị cảnh báo rõ.
- Khách phải quyết định giữ/bỏ sản phẩm phù hợp trước khi thanh toán.
- Hệ thống không âm thầm tính tiền hai lần cho cùng nội dung.

### 3.6. Kiểm tra file ZIP Bundle

**ĐÃ CHỐT — C:**

- **Lỗi nghiêm trọng:** Chặn đăng bán/tải ZIP lỗi; Admin phải sửa.
- **Cảnh báo nhẹ:** Hiển thị lý do, Admin có thể chủ động xác nhận tiếp tục.
- Nên kiểm tra cấu trúc ZIP, khả năng đọc, file thiếu, tên file không hợp lệ và các trường hợp đường dẫn nguy hiểm.
- Hành động bỏ qua cảnh báo nhẹ phải được ghi lại để truy vết.

---

## 4. Preview, Watermark và hiển thị media

### 4.1. Các loại Preview

- Hỗ trợ **Preview tổng hợp của Bundle** và **Preview từng video thành phần**.
- Admin được chọn nội dung/đoạn cần xem thử, không cố định chỉ lấy vài giây đầu.
- Đối với Bundle có trailer/montage riêng, Admin có thể chuẩn bị đoạn tổng hợp phù hợp.

### 4.2. Watermark

**ĐÃ CHỐT:**

- **A. Website tự động thêm Watermark** lên Preview.
- **B. Cấu hình Watermark chung cho toàn website**, không cần thiết lập riêng từng sản phẩm.
- File gốc bán cho khách không bị thay thế bởi file Preview có Watermark.

### 4.3. Thời lượng, chất lượng, FPS

- **B. Admin chọn thời lượng và đoạn xem thử.**
- Preview tối ưu để xem nhanh trên web; hướng chất lượng đã thảo luận: tối đa khoảng 720p, không phải file gốc đầy đủ.
- **A. Giữ FPS gốc khi tạo Preview.**
- Giữ đúng **tỷ lệ khung hình**, không kéo méo hoặc crop sai.
- Bảo đảm Preview có chất lượng đủ để đánh giá sản phẩm nhưng không thay thế file bán.

### 4.4. Xử lý tự động trong nền

- **B. Xử lý tự động trong nền** sau upload.
- **B. Preview chính bắt buộc hoàn thành mới được đăng bán**; Preview phụ có thể tiếp tục xử lý sau.
- Trạng thái đề xuất để hiển thị công việc: chờ, đang xử lý, hoàn tất, lỗi.
- Cho phép xử lý lại tác vụ lỗi mà không cần upload lại khi file gốc vẫn hợp lệ.

### 4.5. Chạy FFmpeg ở đâu?

**ĐÃ CHỐT — A. Chạy FFmpeg trên máy tính cá nhân của Sang** để ưu tiên chi phí miễn phí:

1. Admin upload file gốc lên Cloudflare R2.
2. Website lưu công việc tạo Preview vào hàng đợi/bảng tác vụ.
3. Chương trình worker trên máy Sang lấy công việc khi đang chạy.
4. FFmpeg cắt đoạn, xử lý Preview, thêm Watermark.
5. Worker upload file Preview và cập nhật trạng thái.
6. Admin xác nhận đăng bán khi Preview chính sẵn sàng.

**Ràng buộc quan trọng:** Website vẫn hoạt động khi máy Sang tắt, nhưng công việc Preview mới sẽ chờ cho đến khi worker trên máy Sang chạy trở lại. Sau này có thể chuyển sang worker trên máy chủ mà không thay đổi nguyên tắc nghiệp vụ.

---

## 5. Cloudflare R2, Upload và quản lý file

### 5.1. Phân loại lưu trữ

- Cloudflare R2 là dịch vụ lưu trữ file sản phẩm chính.
- Dự kiến tách tối thiểu **bucket/tài nguyên Preview** và **bucket/tài nguyên Products**:
  - Preview được phân phối công khai hoặc qua CDN theo đúng nội dung đã Watermark.
  - Products chứa file gốc **riêng tư**, không công khai trực tiếp.
- Database lưu thông tin file, phiên bản, kích thước, quyền truy cập, object key; không coi URL công khai là quyền sở hữu.
- Admin giữ bản gốc trên máy tính làm phương án dự phòng phục hồi file.

### 5.2. Cơ chế Upload

**ĐÃ CHỐT:**

- **A. Upload thông thường**, không yêu cầu multipart/chia phần cho phiên bản đầu.
- File mục tiêu thuộc nhóm dưới 5 GB/file theo trao đổi.
- Với nhiều file/thư mục: **A. Upload lần lượt từng file**.
- Nếu một file lỗi: **B. Bỏ qua file lỗi và tiếp tục các file còn lại**.
- Sau lượt upload cần hiển thị rõ file thành công, lỗi và có thể thử lại file lỗi.
- Admin Dashboard có **C. Hỗ trợ cả upload ngay trong màn hình liên quan và giao diện quản lý Upload riêng/tập trung**.

**Lưu ý kỹ thuật:** Upload trực tiếp từ trình duyệt lên R2 bằng URL tạm có chữ ký là hướng triển khai phù hợp để không bắt server web nhận nguyên file lớn. Single-part PUT của R2 có giới hạn; khi file vượt ngưỡng/dễ lỗi đường truyền phải đánh giá lại multipart ở giai đoạn sau. Không thay đổi lựa chọn Upload thông thường khi chưa được Sang đồng ý.

### 5.3. File tạm và file lỗi

- **A. Admin tự xóa file tạm trên Cloudflare R2 bằng thao tác thủ công**.
- Không bật dọn dẹp tự động làm mất file liên quan đơn hàng.
- Trước khi xóa cần xác minh file không thuộc phiên bản đã bán, đơn hàng, quyền tải hoặc công việc đang xử lý.
- **B. Website tự phát hiện file sản phẩm bị lỗi/không thể tải và thông báo Admin**.
- Cảnh báo lỗi đến Admin Dashboard và kênh Discord Admin riêng.
- Admin tự khôi phục đúng file gốc từ bản sao trên máy tính.
- **B. Khi file được khôi phục, thông báo cho khách bị ảnh hưởng trong tài khoản**; không bắt buộc gửi email.

### 5.4. Bảo toàn file đã bán

- Không tùy tiện ghi đè file của phiên bản đã được khách mua.
- Có thể bổ sung bản phát hành mới, nhưng phải giữ đúng quyền truy cập tới bản cũ.
- Không xóa ZIP, file thành phần hoặc bản gốc còn quyền tải hợp lệ.

---

## 6. Giao diện tổng thể và nhận diện thiết kế

### 6.1. Phong cách

**Quyết định mới nhất thay thế phương án Dark Mode mặc định ban đầu:**

- **B. Creative Studio Light** là phong cách giao diện chính.
- **B. Light Mode mặc định**.
- Vẫn **hỗ trợ cả Light Mode và Dark Mode**; người dùng chuyển đổi được.
- Ưu tiên cảm giác sáng, tinh gọn, sáng tạo, chuyên nghiệp; phù hợp website bán media assets.
- Phong cách màu tham khảo: nền sáng, trắng, tím/indigo/lavender; bảng màu chi tiết là phần thiết kế, không phải mã màu cố định đã chốt.

### 6.2. Điều hướng

- **B. Menu ngang, danh mục có xổ xuống**.
- Trên điện thoại chuyển sang cấu trúc điều hướng phù hợp màn hình nhỏ.
- Cấu trúc menu phải hỗ trợ các danh mục con như Flowframes và Twixtor Slow.
- Các khu vực cơ bản: Trang chủ, danh mục sản phẩm, tìm kiếm, Wishlist, tài khoản, My Library và giỏ hàng dạng drawer.

---

## 7. Trang chủ — Creative Marketplace

### 7.1. Bố cục

- **B. Creative Marketplace** là bố cục Trang chủ.
- Trọng tâm giới thiệu và bán sản phẩm số, không còn homepage lựa chọn Code/Editor Portfolio.
- Có khu vực sản phẩm nổi bật, sản phẩm mới và nhóm danh mục phù hợp; nội dung từng section có thể điều chỉnh trong giai đoạn UI.

### 7.2. Hero Banner

- **B. Banner kết hợp Video Preview**.
- **A. Admin tự chọn Video Preview** cho Hero, không bắt buộc thuật toán tự chọn.
- Hero dùng nội dung video/tác phẩm phù hợp để tăng hiệu quả giới thiệu sản phẩm.
- Hướng tương tác đã thảo luận: Hero video phát khi người dùng chủ động bấm xem; tránh làm trang đầu quá nặng.

### 7.3. Product Card

- **C. Video Preview tự động phát khi Product Card xuất hiện trên màn hình**.
- Quy tắc triển khai để bảo đảm trải nghiệm: mặc định tắt tiếng, chỉ tải khi cần, dừng khi ra khỏi vùng nhìn và tôn trọng chế độ giảm chuyển động.
- Product Card thể hiện những thông tin mua hàng quan trọng: hình/preview, tên, danh mục, giá, trạng thái sở hữu nếu khách đã đăng nhập.

### 7.4. Danh sách và sắp xếp sản phẩm

- **C. Lưới Responsive linh hoạt** theo kích thước màn hình.
- **B. Nút “Xem thêm sản phẩm”** để tải thêm, không dùng infinite scroll bắt buộc.
- **C. Sắp xếp nâng cao + Admin ưu tiên**:
  - Khách có thể chọn cách sắp xếp phù hợp như mới nhất, giá tăng/giảm và các tiêu chí có dữ liệu thực.
  - Admin có quyền sắp xếp ưu tiên sản phẩm nổi bật ở chế độ hiển thị mặc định.
- Không hiển thị số lượt bán/lượt đánh giá không có dữ liệu thực.

---

## 8. Trang chi tiết sản phẩm

### 8.1. Bố cục Desktop và Mobile

- **B. Preview lớn + bảng mua hàng bên cạnh** trên máy tính.
- Trên điện thoại chuyển sang bố cục xếp dọc.
- **C. Thanh mua hàng thông minh** trên mobile: hỗ trợ truy cập nút mua/giá khi người dùng cuộn trang; tránh che nội dung quan trọng.

### 8.2. Gallery nhiều Preview

- **C. Thumbnail + Carousel**.
- Preview chính lớn; thumbnails hỗ trợ chọn nhanh hình ảnh/video khác.
- Dùng carousel để chuyển qua lại media theo thứ tự.

### 8.3. Chọn chất lượng và phiên bản

- **C. Linh hoạt theo loại sản phẩm**.
- Sản phẩm video thông thường không ép chọn phiên bản phát hành.
- Sản phẩm có ít lựa chọn có thể hiển thị nút/thẻ lựa chọn; nhiều lựa chọn có thể dùng dropdown.
- Khi đổi lựa chọn phải cập nhật đúng giá, thông số, tình trạng sở hữu và quyền mua.

### 8.4. Thông số, mô tả, hướng dẫn

- **C. Thông số nổi bật + Chi tiết mở rộng**.
- Với video: kích thước/độ phân giải, FPS, thời lượng, định dạng, dung lượng khi có.
- Với After Effects: bản AE hỗ trợ, yêu cầu plugin/font/dependency, định dạng file, nội dung kèm.
- **C. Tab trên máy tính + Accordion trên điện thoại** cho mô tả, hướng dẫn, thông tin kỹ thuật, giấy phép và mục liên quan.
- **C. Hiển thị danh sách file trước khi mua linh hoạt theo loại sản phẩm**:
  - Video đơn: danh sách ngắn, thông số phù hợp.
  - AE Asset/Bundle: cấu trúc file hoặc nội dung theo nhóm, danh sách đầy đủ nếu cần.
  - Không tiết lộ URL truy cập file gốc riêng tư.

### 8.5. Sản phẩm liên quan

- **C. Admin lựa chọn sản phẩm liên quan, có tự động dự phòng** khi chưa được cấu hình hoặc số lượng không đủ.
- **C. Grid trên máy tính + Carousel trên điện thoại**.
- Fallback nên dựa trên danh mục, tag và điều kiện bán hợp lệ; tránh sản phẩm ngừng bán.

---

## 9. Wishlist và đánh giá

### 9.1. Wishlist

- **B. Wishlist cơ bản**.
- Khách đã đăng nhập có thể thêm/xóa sản phẩm khỏi danh sách yêu thích và truy cập lại khi cần.
- Không tự động thêm hệ thống theo dõi giá, thông báo giảm giá hoặc chia sẻ Wishlist nâng cao nếu chưa có quyết định mới.

### 9.2. Không có đánh giá sản phẩm

**QUYẾT ĐỊNH MỚI NHẤT: Không có chức năng đánh giá.**

- Không triển khai đánh giá sao.
- Không triển khai bình luận review sản phẩm.
- Không hiển thị rating giả hoặc số lượng review giả.

Lựa chọn này **ghi đè** lựa chọn “đánh giá sao và bình luận” đã xuất hiện ở giai đoạn đầu.

---

## 10. Giỏ hàng, Coupon, tổng tiền và Checkout

### 10.1. Giỏ hàng

- Có chức năng **Add to Cart** và **Buy Now**.
- **B. Chỉ sử dụng Cart Drawer**: giỏ hàng trượt ra, không cần trang Cart độc lập.
- Buy Now có thể đưa trực tiếp đến Checkout với lựa chọn phù hợp.
- Phải kiểm tra sản phẩm/phiên bản đã sở hữu và xung đột video riêng với Bundle.
- **A. Không cho mua lại đúng phiên bản/chất lượng đã sở hữu**.
- Khi sản phẩm đã sở hữu, thể hiện “Đã sở hữu” và đường dẫn đến My Library.

### 10.2. Checkout

- **A. Checkout một trang**.
- Là sản phẩm số, không cần biểu mẫu giao hàng vật lý bắt buộc.
- Khách phải đăng nhập và xác minh email trước khi thanh toán.
- Khách cần chấp nhận chính sách giấy phép/điều khoản áp dụng trước khi hoàn tất.
- **B. Bảng tổng tiền chi tiết**:
  - Tạm tính theo sản phẩm/biến thể.
  - Giảm giá Bundle dựa trên video đã sở hữu.
  - Coupon nếu được áp dụng/kết hợp.
  - Tổng tiền cuối cùng bằng đúng số tiền khách cần thanh toán.
- Không bắt buộc popup giải thích khuyến mãi riêng; bảng chi tiết phải đủ rõ.
- Tất cả phép tính giá/giảm giá phải được xác thực lại ở backend khi tạo đơn.

### 10.3. Coupon

- Hỗ trợ mã Coupon cơ bản và cấu hình điều kiện áp dụng trong Admin.
- Quy tắc kết hợp giảm giá Bundle và Coupon do Admin quyết định.
- Hạn chế Coupon sai/đã hết hạn hoặc không đủ điều kiện phải được kiểm tra ở backend.

---

## 11. Thanh toán MB Bank, PayPal và đơn hàng

### 11.1. MB Bank

- **MB Bank** là phương thức chuyển khoản ngân hàng được chọn, thay cho MoMo trong kế hoạch đầu.
- Tạo **VietQR** với số tiền và nội dung chuyển khoản/mã đơn phù hợp.
- Khách chuyển khoản qua ứng dụng ngân hàng.
- Khách có nút **“Tôi đã chuyển khoản MB Bank”**.
- **Admin xác nhận thủ công** trên cơ sở giao dịch thực tế; không cấp file chỉ vì khách nhấn nút.
- Thời gian hiệu lực màn hình/QR thanh toán ban đầu đã chốt: **15 phút**.
- Các tình huống trả chậm, thiếu/thừa số tiền, nội dung chuyển khoản sai do Admin xử lý linh hoạt với trạng thái và ghi chú phù hợp.

### 11.2. Sau khi khách bấm “Tôi đã chuyển khoản”

**ĐÃ CHỐT — C. Màn hình chờ xác nhận + Lịch sử đơn hàng.**

- Hiện màn hình **Đang chờ Admin xác nhận**.
- Đơn hàng được lưu trong tài khoản để khách rời trang và kiểm tra lại sau.
- Nếu khách đã báo chuyển khoản trong thời gian hợp lệ, không tự kết luận thất bại chỉ vì Admin chưa kịp kiểm tra.
- Sau khi Admin xác minh giao dịch và xác nhận, hệ thống mới cấp quyền tải.

### 11.3. PayPal cho khách quốc tế

- PayPal đã được xác định là hướng hỗ trợ khách quốc tế; hiện Sang có tài khoản **PayPal Personal**.
- **QUYẾT ĐỊNH SAU CÙNG — 6A:** Ưu tiên triển khai **MB Bank trước**; bổ sung PayPal sau khi xác minh điều kiện tài khoản và cách tích hợp hợp lệ.
- Không tự tuyên bố PayPal Checkout/API đã hoạt động hoặc tài khoản Personal chắc chắn đủ điều kiện merchant.
- Khi tích hợp, xác nhận thanh toán phải dựa trên trạng thái/callback đáng tin cậy từ nhà cung cấp, không dựa vào trình duyệt.

### 11.4. Trạng thái đơn hàng

**ĐÃ CHỐT — A. Trạng thái đơn giản trong tài khoản khách.**

Các trạng thái hiển thị gợi ý gắn với hành vi đã thống nhất:

- Chờ thanh toán.
- Chờ Admin xác nhận.
- Thanh toán thành công / hoàn tất.
- Hết thời hạn/chưa hoàn tất.
- Cần hỗ trợ hoặc xử lý ngoại lệ.

Đây là nhãn UI dự kiến; backend có thể có trạng thái nội bộ chi tiết hơn để kiểm soát chuyển trạng thái và tránh xác nhận trùng.

### 11.5. Lịch sử và chi tiết đơn hàng

- **C. Lịch sử đơn hàng dạng bảng trên máy tính + dạng thẻ trên điện thoại**.
- **C. Trang Chi tiết đơn hàng đầy đủ + hỗ trợ đơn hàng**.
- Trang chi tiết gồm mã đơn, thời gian, danh sách sản phẩm, biến thể, giá, từng khoản giảm, tổng tiền, phương thức và trạng thái thanh toán.
- Có nút tạo **Support Ticket liên kết đến đơn hàng**.
- Khi thanh toán hoàn tất, khách được dẫn đến My Library để tải.

---

## 12. My Library — thư viện sản phẩm đã sở hữu

### 12.1. Bố cục và danh sách

- **C. Grid + List**: khách có thể chuyển đổi kiểu hiển thị.
- **B. Tìm kiếm + bộ lọc thiết yếu**, không triển khai bộ lọc kỹ thuật quá phức tạp.
- Chỉ hiển thị nội dung mà tài khoản **có quyền truy cập/tải**.
- **A. Không hiển thị phiên bản chưa sở hữu** trong danh sách lựa chọn tải.
- Bundle được hiển thị như **một mục riêng**, mở ra danh sách file.
- Tránh hiển thị các file của Bundle thành nhiều mục mua riêng giả trong Library.

### 12.2. Phiên bản và lịch sử

- **B. Một sản phẩm, có danh sách chọn phiên bản** nếu loại sản phẩm thực sự có nhiều bản phát hành.
- **C. Ghi nhớ phiên bản khách chọn gần nhất** để chọn mặc định lần sau.
- **B. Hiển thị lịch sử đầy đủ các phiên bản mà khách sở hữu**.
- **B. Có nhãn cập nhật + thông tin thay đổi (changelog)** trong My Library.
- Phiên bản cũ đã mua không bị mất khi ra bản mới.
- Không đưa video Flowframes/Twixtor Slow đơn thông thường vào mô hình nhiều bản phát hành một cách bắt buộc.

### 12.3. Download

- **B. Website thông báo khởi tạo tải + trình duyệt tự quản lý tiến trình tải**.
- Không cần xây dựng trình tải riêng trong website.
- **B. Có thể tiếp tục tải khi trình duyệt và máy chủ hỗ trợ (HTTP Range/resume)**; nếu không, khách tải lại.
- Không hạn chế số lần tải theo một con số cứng, nhưng phải có xác thực đăng nhập, kiểm tra quyền sở hữu và giới hạn chống lạm dụng hợp lý.
- Tất cả yêu cầu tải phải đi qua kiểm tra quyền của backend. Không cung cấp URL R2 gốc công khai vĩnh viễn.
- Có thể cấp URL tạm để tải sau khi xác thực.

### 12.4. Lịch sử tải xuống

- **C. Hiển thị trong từng sản phẩm + một trang Lịch sử tải riêng**.
- Giữ mức thông tin cơ bản phục vụ hỗ trợ và tra cứu.
- **KHÔNG TRIỂN KHAI** các chức năng xóa/ẩn Lịch sử tải xuống nâng cao hoặc quản lý log phức tạp mà Sang đã đánh giá là không cần thiết.
- Hệ thống không được khẳng định file đã lưu thành công vào máy chỉ vì backend đã bắt đầu trả dữ liệu.

### 12.5. Thông báo phục hồi file và phiên bản mới

- File bị lỗi được phục hồi: thông báo **trong tài khoản khách** có liên quan.
- Sản phẩm có bản cập nhật: hiển thị nhãn và changelog trong Library.
- Công bố phát hành mới đồng thời qua các kênh Discord đã chọn.

---

## 13. Tài khoản khách hàng và bảo mật

### 13.1. Đăng ký và đăng nhập

- **B. Email + mật khẩu + xác minh Email**.
- **A. Không sử dụng 2FA cho khách hàng trong phạm vi đã chốt**.
- **A. Cho phép đăng nhập nhiều thiết bị, quản lý phiên đơn giản**.
- Email xác minh hợp lệ là điều kiện trước khi Checkout.
- Mật khẩu phải được lưu qua hệ thống xác thực phù hợp, không tự lưu plaintext.
- Có chức năng quên/đặt lại mật khẩu.

### 13.2. Thông báo bảo mật

- **B. Gửi email khi có thay đổi bảo mật quan trọng** như đổi mật khẩu/email hoặc các sự kiện cần thông báo.
- Không bắt buộc gửi email khi đăng nhập mỗi lần.

### 13.3. Hồ sơ cá nhân

- **A. Hồ sơ cơ bản cho sản phẩm số**.
- Bao gồm thông tin cá nhân cần thiết như tên hiển thị, email, mật khẩu; không yêu cầu địa chỉ giao hàng vật lý như sàn hàng hóa.

### 13.4. Xóa tài khoản

- **B. Có nút yêu cầu xóa tài khoản trong Hồ sơ cá nhân**.
- **B. Xác nhận bằng mật khẩu + email**.
- Quy trình có bước xử lý/quản trị phù hợp; khách cần được thông báo về tác động đối với quyền truy cập.
- Việc xóa dữ liệu phải tuân thủ nghĩa vụ giữ chứng từ/giao dịch theo quy định áp dụng; không tự xóa dữ liệu pháp lý bắt buộc.

### 13.5. Admin

- Chỉ có **một Admin chính** trong phạm vi hiện tại.
- Quản lý khách hàng ở mức **A. Cơ bản**.
- Admin có quyền quản lý bán hàng, file, đơn hàng, Support Ticket và cấu hình vận hành.
- Không sử dụng logic xác định quyền Admin chỉ bằng email từ client; quyền phải được xác thực/ủy quyền ở backend.
- Quyết định “không có 2FA” dành cho tài khoản **khách hàng**; việc bảo vệ tài khoản quản trị dịch vụ bên ngoài vẫn phải tuân thủ yêu cầu an toàn của từng nhà cung cấp.

---

## 14. Thông báo trong website, Discord và Email

### 14.1. Thông báo trong tài khoản

- **C. Chuông thông báo + Trang Thông báo riêng**.
- **B. Quản lý đầy đủ chức năng thiết yếu**: phân biệt đọc/chưa đọc, đánh dấu đã đọc, đánh dấu tất cả đã đọc, lọc thông báo chưa đọc, xóa thông báo cá nhân khi cần.
- Xóa một thông báo không làm mất đơn hàng, quyền sở hữu sản phẩm hoặc Support Ticket.

### 14.2. Thông báo cập nhật sản phẩm

**ĐÃ CHỐT:**

- Thông báo tới khách đã mua **trong My Library/tài khoản**, không gửi email cập nhật hàng loạt bắt buộc.
- **C. Discord Admin + Discord cộng đồng** nhận thông báo phù hợp khi phát hành sản phẩm/bản mới.
- Discord Admin dành cho thông tin vận hành; Discord cộng đồng chỉ đăng nội dung công khai, không tiết lộ dữ liệu khách/đơn hàng.
- **Chưa triển khai DM Discord riêng cho từng khách**: liên kết tài khoản Discord website và Bot cá nhân hóa được để dành cho tương lai.

### 14.3. Support Ticket

- **A. Thông báo trong tài khoản khách + Discord Admin**.
- Không gửi nội dung hỗ trợ riêng tư vào Discord cộng đồng.

### 14.4. Email

- **A. Resend Free** là dịch vụ gửi email đã chọn.
- **A. Email đơn hàng cơ bản:** gửi khi **thanh toán thành công**, dẫn khách đến My Library sau đăng nhập.
- Email phục vụ xác minh tài khoản, quên mật khẩu và thay đổi bảo mật quan trọng được gửi khi phát sinh tình huống tương ứng.
- Không mặc định gửi email ở mọi lần đổi trạng thái đơn, cập nhật sản phẩm, khôi phục file hoặc phản hồi Ticket.
- Cần cấu hình domain gửi email, xác thực SPF/DKIM/DMARC, hạn mức và chính sách retry khi triển khai thực tế.

---

## 15. Support Ticket, FAQ và hướng dẫn

### 15.1. Support Ticket

- **B. Sử dụng hệ thống Support Ticket sau mua**.
- **C. Hỗ trợ văn bản, hình ảnh và file đính kèm hỗ trợ**.
- **B. Khách và Admin đều có quyền đóng/mở lại Ticket** theo quy tắc quyền sở hữu/kiểm soát phù hợp.
- **A. Xử lý theo thứ tự gửi đến (FIFO)**; không xây dựng hệ thống phân loại ưu tiên phức tạp trong giai đoạn đầu.
- Có thể tạo Ticket từ Chi tiết đơn hàng để gắn mã đơn.
- File đính kèm phải được kiểm tra loại file/kích thước/quyền truy cập; không cho tải tùy ý dữ liệu của Ticket người khác.
- Thông báo Ticket mới hoặc cập nhật: tài khoản khách và Discord Admin.

### 15.2. FAQ

- **A. Chỉ có FAQ chung cho website**.
- Không bắt buộc FAQ riêng theo từng sản phẩm.

### 15.3. Hướng dẫn sản phẩm After Effects

- Hướng dẫn hiển thị trên website và được đóng gói qua README phù hợp.
- Bảng riêng về plugin, font, tài nguyên phụ thuộc và tương thích.
- Không tự phân phối plugin/font thương mại nếu không có quyền cấp phép.

---

## 16. Admin Dashboard — phạm vi chức năng

Admin Dashboard phục vụ **quản lý kinh doanh thực tế**, không thêm các phần quản trị phụ không cần thiết.

### 16.1. Nhóm màn hình chính

1. Quản lý sản phẩm và danh mục.
2. Quản lý Preview, Watermark và file.
3. Quản lý Bundle và cấu hình giảm giá video đã sở hữu.
4. Quản lý phiên bản và chính sách cập nhật.
5. Quản lý Coupon/khuyến mãi.
6. Quản lý đơn hàng và xác nhận chuyển khoản MB Bank.
7. Quản lý tài khoản khách cơ bản.
8. Quản lý Support Ticket.
9. Quản lý thông báo.
10. Thiết lập nội dung Hero Banner, sản phẩm ưu tiên và sản phẩm liên quan.

### 16.2. Quy tắc vận hành

- Công bố sản phẩm từ bản nháp sau khi Admin xác nhận.
- Không đăng bán nếu Preview chính chưa xử lý xong.
- Kiểm tra ZIP và file bắt buộc trước khi bán Bundle.
- Không cấp quyền tải trước khi thanh toán được xác minh.
- Không xóa nội dung đã bán còn quyền truy cập hợp lệ.
- Các thao tác quan trọng như xác nhận thanh toán, thay đổi quyền sở hữu, ghi đè thông tin sản phẩm và bỏ qua cảnh báo file phải có khả năng truy vết.
- Có thể xử lý thủ công những tình huống chuyển khoản ngoại lệ.

---

## 17. Giấy phép sử dụng, hoàn tiền và quyền khách hàng

### 17.1. License

- Một giấy phép cho phép khách sử dụng sản phẩm trong **dự án cá nhân** và **sản phẩm đầu ra thương mại** theo điều khoản do Sang công bố.
- **Không được bán lại, chia sẻ hoặc phân phối lại file gốc/raw source**.
- Điều khoản cần được hiển thị và khách xác nhận trước Checkout.
- File thành phần phụ thuộc của bên thứ ba chỉ được phân phối nếu Sang có quyền hợp pháp.

### 17.2. Hoàn tiền

- Chủ trương đã thảo luận: sản phẩm số **không hoàn tiền chỉ vì khách đổi ý** sau khi đã nhận quyền truy cập, nếu được phép theo quy định áp dụng.
- Không loại trừ quyền khiếu nại/biện pháp khắc phục hợp pháp khi sản phẩm lỗi, giao dịch sai hoặc nhà bán phải chịu trách nhiệm theo pháp luật.
- Nội dung điều khoản hoàn tiền cần được rà soát trước khi mở bán thực tế.

### 17.3. Hóa đơn và chứng từ

**ĐÃ CHỐT — 10A:**

- Website cung cấp **biên nhận/thông tin đơn hàng cơ bản**.
- Không tích hợp hệ thống hóa đơn điện tử riêng ngay từ đầu.
- Nghĩa vụ hóa đơn, kê khai thuế và giao dịch xuyên biên giới phải được xác định đúng theo quy định áp dụng **trước khi mở bán**. Chọn 10A không có nghĩa được miễn nghĩa vụ pháp lý.

---

## 18. Kiến trúc kỹ thuật đã chốt và cách triển khai dự kiến

### 18.1. Stack chính

| Thành phần | Quyết định / định hướng |
| --- | --- |
| Frontend | React + TypeScript + Vite, viết lại toàn bộ |
| Router | React Router hoặc cơ chế phù hợp với ứng dụng React hiện tại |
| Backend | Node.js + Express + TypeScript, viết lại toàn bộ |
| Database | PostgreSQL trên **Supabase Project hiện tại** |
| ORM/Migrations | Drizzle ORM, tái sử dụng công nghệ nhưng tạo schema mới |
| Monorepo | pnpm workspaces |
| Asset Storage | Cloudflare R2 |
| Authentication | Supabase Auth |
| Email | Resend Free |
| Discord | Webhook cho thông báo kênh, Bot DM cá nhân hóa chưa triển khai |
| Preview Processor | FFmpeg worker trên máy Sang |
| Hosting ưu tiên | Cloudflare Workers Free, **chờ kiểm tra tương thích** |
| Tên miền | zenith.io.vn |

**CẦN KIỂM TRA KHI TRIỂN KHAI:** Cloudflare Workers không phải máy chủ Node.js thông thường. Việc triển khai **Express hiện tại trên Workers Free** có thể yêu cầu adapter, refactor thành API tương thích hoặc thay đổi phương án triển khai. **Không tự ý đổi Express hoặc chuyển sang hosting khác mà không thông báo Sang.** Cần dựng thử và đo giới hạn trước khi chốt deployment production.

### 18.2. Mô hình giao tiếp tổng quát

1. Browser hiển thị React Storefront và gửi yêu cầu đến backend đã xác thực.
2. Backend kiểm tra Supabase Auth, quyền tài khoản, giỏ hàng, giá, đơn hàng.
3. PostgreSQL lưu catalog, giao dịch, quyền sở hữu, lịch sử và tác vụ.
4. R2 lưu file gốc riêng tư và Preview được phát cho khách.
5. Worker FFmpeg trên máy Sang nhận tác vụ tạo Preview từ hàng đợi, không cần website ngừng hoạt động khi worker tắt.
6. Resend gửi email theo chính sách đã chọn.
7. Discord Webhook gửi thông báo Admin và công cộng theo từng sự kiện.

### 18.3. Những nhóm bảng dữ liệu cần thiết

Đây là **danh sách thực thể ở mức thiết kế**, không phải tên bảng SQL cuối cùng:

| Nhóm | Dữ liệu cần quản lý |
| --- | --- |
| Accounts | hồ sơ khách, quyền Admin, xác minh và trạng thái tài khoản |
| Categories | danh mục cha/con, thứ tự, trạng thái |
| Products | sản phẩm, nội dung, mô tả, thông số, trạng thái, ưu tiên |
| Product Variants | chất lượng video hoặc lựa chọn mua thực sự |
| Product Releases | các phiên bản phát hành dành cho loại sản phẩm áp dụng |
| Assets / Files | object key R2, checksum, dung lượng, định dạng, phiên bản |
| Bundle Items | video thành phần, nội dung độc quyền, bản ZIP, quan hệ Bundle |
| Bundle Upgrade Rules | chính sách cập nhật/nâng cấp theo Bundle và release |
| Ownership Credits | mức giảm Admin cấu hình khi đã sở hữu video thành phần |
| Carts | giỏ hàng đang sử dụng và lựa chọn mua |
| Orders / Order Items | snapshot giá, biến thể, coupon, sản phẩm của mỗi đơn |
| Payments | giao dịch MB Bank, trạng thái xác minh, tham chiếu và người duyệt |
| Coupons | mã, thời hạn, điều kiện áp dụng, quy tắc kết hợp |
| Entitlements | quyền tải theo tài khoản, sản phẩm, chất lượng, release và file |
| Download History | các lượt yêu cầu tải đã được cho phép và thông tin cơ bản |
| Preview Jobs | hàng đợi, trạng thái, lỗi, retry của tác vụ FFmpeg |
| Notifications | thông báo trong tài khoản và trạng thái đọc |
| Tickets / Ticket Messages | hỗ trợ và đính kèm |
| Wishlist | sản phẩm khách yêu thích |
| Audit Logs | ghi nhận các thao tác nhạy cảm của Admin |

### 18.4. Ràng buộc dữ liệu và bảo mật

- Mỗi quyền sở hữu được cấp từ đơn hàng/giao dịch đã xác minh, không từ lời khai của frontend.
- Không mua lại cùng một quyền đã sở hữu.
- Tính toán giảm giá Bundle và Coupon ở backend, lưu snapshot giá trong đơn.
- Xác nhận thanh toán **idempotent**: bấm/nhận sự kiện lại không cấp quyền hai lần.
- Dùng cơ chế kiểm tra **quyền sở hữu cấp đối tượng** đối với Orders, Tickets, Files và Library.
- Không dùng user ID hoặc object key do trình duyệt gửi làm bằng chứng quyền tải.
- Secrets chỉ ở server/worker và biến môi trường, không commit vào Git.
- Supabase Auth và các bảng phải có chính sách phân quyền phù hợp; không bỏ qua kiểm tra quyền chỉ vì ID khó đoán.
- Admin nhận quyền từ nguồn đáng tin cậy, không tự gán role qua giá trị email client.
- Hạn chế lạm dụng upload/download và các endpoint nhạy cảm.
- Lưu dấu vết những thay đổi ảnh hưởng giao dịch và dữ liệu khách hàng.

---

## 19. Ngân sách và vận hành

### 19.1. Nguyên tắc chi phí

**ĐÃ CHỐT — A. Ưu tiên miễn phí** khi phát triển và ở giai đoạn đầu.

- Ưu tiên gói miễn phí khi **phù hợp với giới hạn thực tế**.
- Không cam kết toàn hệ thống sẽ vận hành thương mại 24/7 miễn phí mãi.
- FFmpeg xử lý trên máy Sang để tránh thuê worker riêng khi lưu lượng còn thấp.
- Supabase Free/Resend Free/Cloudflare Workers Free và hạn mức miễn phí R2 phải được kiểm tra định kỳ.
- Không áp dụng Vercel Hobby như phương án mặc định cho website thương mại nếu điều kiện gói không cho phép.

### 19.2. Nếu R2 vượt hạn mức miễn phí

**ĐÃ CHỐT — 9B:**

- Ưu tiên miễn phí nhưng **cho phép phát sinh phí lưu trữ khi cần**.
- Sang sẽ đặt mức ngân sách/giới hạn phù hợp lúc cấu hình billing.
- Không tự bật các dịch vụ vượt chi phí mà không kiểm soát.

### 19.3. Backup

- Giữ bản gốc các sản phẩm trên máy tính của Sang.
- Không xem R2 là bản sao dự phòng duy nhất của dữ liệu sản phẩm.
- Database giao dịch cần có phương án sao lưu/khôi phục phù hợp trước khi vận hành thật.

---

## 20. Những chức năng KHÔNG TRIỂN KHAI trong phạm vi hiện tại

Danh sách này giúp AI coding agent không tự thêm lại những phần Sang đã loại bỏ hoặc hoãn:

1. Code Portfolio, Editor Portfolio và Landing Page portfolio cũ.
2. MDA AI Chatbot/RAG từ repository cũ.
3. Hệ thống nhắn tin/chat cũ.
4. Nền tảng nhiều seller/người bán bên ngoài.
5. Đánh giá sao, bình luận review sản phẩm.
6. Premiere Pro Assets như một danh mục thương mại bắt buộc khi ra mắt.
7. 2FA cho tài khoản khách hàng.
8. Discord Bot gửi tin nhắn riêng đến từng khách và liên kết Discord OAuth với website.
9. Email tự động cho mọi sự kiện cập nhật, Ticket và phục hồi file.
10. Cart page độc lập; chỉ dùng Cart Drawer.
11. Infinite scroll bắt buộc thay cho nút Xem thêm.
12. Bộ lọc My Library kỹ thuật phức tạp không cần thiết.
13. Trình quản lý download/progress riêng thay thế chức năng của trình duyệt.
14. Xóa/ẩn lịch sử tải xuống nâng cao dành cho khách.
15. Quản trị nhiều cấp nhân viên hoặc phân quyền doanh nghiệp phức tạp.
16. Phân loại ưu tiên Ticket nhiều mức; xử lý FIFO.
17. FAQ riêng cho từng sản phẩm; chỉ FAQ toàn website.
18. Upload multipart/resumable bắt buộc trong bản đầu; đã chọn upload thông thường.
19. Tự động dọn toàn bộ file tạm R2; Admin xóa thủ công.
20. Bắt buộc tự động xác minh giao dịch MB Bank ngay trong phiên bản đầu.
21. Hệ thống xuất hóa đơn điện tử tích hợp ngay giai đoạn đầu (nhưng không bỏ nghĩa vụ pháp lý).
22. Tự ý đổi toàn bộ stack sang Next.js khi Sang đã chọn giữ công nghệ project hiện tại.

---

## 21. Kế hoạch triển khai theo giai đoạn

### Giai đoạn 0 — Kiểm kê và bảo vệ dữ liệu cũ

- [ ] Khóa yêu cầu theo README này.
- [ ] Kiểm tra lại nhánh main, cấu trúc, các dịch vụ đang dùng và file bí mật bị theo dõi nhầm.
- [ ] Lập danh sách object database/buckets/auth users của **đúng** Supabase Project cũ.
- [ ] Xác nhận trạng thái đang dùng bởi những ứng dụng khác hay không.
- [ ] Sao lưu dữ liệu và cấu hình cần khôi phục.
- [ ] Tạo nhánh rewrite riêng; không phá nhánh main.
- [ ] Chỉ thực hiện xóa sau khi xác minh đúng mục tiêu và thống nhất thao tác thực tế.

### Giai đoạn 1 — Kiến trúc, Database và Authentication

- [ ] Thiết kế monorepo mới bằng TypeScript, Vite React và Express.
- [ ] Thiết kế schema PostgreSQL/Drizzle mới, quan hệ và migration.
- [ ] Xây dựng Supabase Auth: email, mật khẩu, xác minh email, quên mật khẩu.
- [ ] Cấu hình quyền Admin và bảo mật truy cập dữ liệu.
- [ ] Cấu hình Resend phục vụ email Auth.

### Giai đoạn 2 — Catalog, Storefront và giao diện

- [ ] UI Creative Studio Light + Dark Mode có công tắc.
- [ ] Home Creative Marketplace, Hero video Admin chọn.
- [ ] Danh mục cha/con; Flowframes và Twixtor Slow.
- [ ] Product Card Preview tự phát khi hiển thị.
- [ ] Trang chi tiết Product / Bundle, gallery thumbnail/carousel.
- [ ] Giao diện responsive, Load More, sorting Admin ưu tiên.
- [ ] Wishlist cơ bản, FAQ chung.
- [ ] After Effects compatibility, plugin/font dependencies và hướng dẫn.

### Giai đoạn 3 — Quản trị sản phẩm, R2, Upload và Preview

- [ ] Admin tạo nháp/chỉnh sửa/đăng bán.
- [ ] Quản lý release, quality, entitlement, policy Bundle.
- [ ] R2 Preview và Products; upload thông thường tuần tự.
- [ ] Lỗi một file không chặn cả danh sách.
- [ ] Validate ZIP Bundle và kiểm tra file.
- [ ] Worker FFmpeg chạy trên máy Sang, hàng đợi bền vững.
- [ ] Watermark chung, đoạn Preview Admin chọn, FPS/tỷ lệ đúng.
- [ ] Không đăng bán trước khi Preview chính xong.

### Giai đoạn 4 — Cart, Coupon, Checkout và MB Bank

- [ ] Cart Drawer, Buy Now, Checkout một trang.
- [ ] Chặn mua lại quyền đã sở hữu.
- [ ] Cảnh báo video riêng trùng Bundle trong giỏ.
- [ ] Tính giảm giá video đã sở hữu và Coupon theo cấu hình Admin.
- [ ] Bảng tổng tiền chi tiết.
- [ ] VietQR MB Bank có mã đơn, giới hạn 15 phút.
- [ ] Khách báo chuyển khoản → màn hình chờ xác nhận.
- [ ] Admin đối chiếu giao dịch thật, xác nhận idempotent.
- [ ] Cấp quyền sở hữu sau khi xác nhận.

### Giai đoạn 5 — My Library, hậu mãi và thông báo

- [ ] Grid/List My Library; tìm kiếm/lọc thiết yếu.
- [ ] Chỉ hiện phiên bản/chất lượng đã sở hữu.
- [ ] Bundle là mục riêng có danh sách file.
- [ ] Lịch sử phiên bản/changelog và ghi nhớ lựa chọn gần nhất.
- [ ] Download bảo mật qua quyền sở hữu và R2.
- [ ] Browser-native download/resume khi hỗ trợ.
- [ ] Lịch sử tải trong từng sản phẩm và trang riêng.
- [ ] Support Ticket với file đính kèm, đóng/mở lại, FIFO.
- [ ] Notifications: chuông + trang, đọc/chưa đọc.
- [ ] Discord Admin + Community, Resend email thanh toán thành công.
- [ ] Khôi phục file lỗi và thông báo khách.

### Giai đoạn 6 — Kiểm thử, vận hành và phát hành

- [ ] Unit/integration test về pricing, Coupon, ownership, checkout và payment confirmation.
- [ ] Kiểm thử quyền truy cập đối tượng (IDOR), file riêng tư, RLS và secret.
- [ ] Kiểm thử double-submit, refresh Checkout, mạng chập chờn, upload thất bại, worker tắt giữa chừng.
- [ ] Kiểm thử màn hình desktop/mobile, tiếng Việt/tiếng Anh, Light/Dark.
- [ ] Kiểm thử tài khoản và email xác minh/khôi phục mật khẩu.
- [ ] Kiểm thử việc bán/khôi phục file lớn trên R2.
- [ ] Thử khả năng chạy React/Vite + Express với Cloudflare Workers Free trong giới hạn thật.
- [ ] Nếu không tương thích, trình phương án hosting thay thế để Sang quyết định.
- [ ] Xác minh yêu cầu PayPal trước khi kích hoạt phương thức này.
- [ ] Hoàn thiện chính sách, điều khoản, quyền sử dụng, thuế/hóa đơn theo quy định.
- [ ] Chỉ chuyển domain và triển khai chính thức khi đã kiểm thử và được Sang xác nhận.

---

## 22. Tiêu chí nghiệm thu cốt lõi

Website chỉ nên được coi là sẵn sàng mở bán khi:

1. Khách có thể đăng ký bằng email, xác minh email và đăng nhập an toàn.
2. Admin tạo/chỉnh sửa nháp, upload file/Preview và công bố đúng điều kiện.
3. Sản phẩm được phân loại và khách chọn đúng chất lượng/release phù hợp.
4. Bundle tính đúng khoản giảm theo **video thuộc Bundle đã sở hữu**.
5. Coupon tuân thủ chính sách cộng dồn mà Admin cấu hình.
6. Cart chặn mua trùng cùng quyền và xử lý xung đột video riêng/Bundle.
7. Checkout có giá chi tiết, thống nhất số tiền phải chuyển khoản.
8. Bấm “Tôi đã chuyển khoản” **không tự động cấp quyền tải**.
9. Admin xác nhận giao dịch thật mới chuyển đơn thành hoàn tất, và chỉ cấp entitlement một lần.
10. Khách chỉ xem/tải file thuộc quyền đã được cấp, không truy cập được file của tài khoản khác.
11. Phiên bản cũ và Bundle đã sở hữu không bị mất sau cập nhật.
12. Worker FFmpeg tắt/mở không làm mất job; Preview chính hoàn thành trước publish.
13. Thông báo đúng kênh: tài khoản, Admin Discord, Community Discord và email theo từng loại sự kiện.
14. Bảo mật R2 Products, quyền Admin, Auth, dữ liệu đơn và Support Ticket được kiểm thử.
15. Các giới hạn và chi phí lưu trữ/hosting/email được quan sát và xử lý trước khi mở bán thật.

---

## 23. Nguồn đối chiếu kỹ thuật khi triển khai

Các liên kết sau là **tài liệu chính thức để kiểm tra kỹ thuật và chính sách hiện hành**, không phải quyết định mới:

- React: https://react.dev/
- Vite: https://vite.dev/
- Express: https://expressjs.com/
- TypeScript: https://www.typescriptlang.org/
- Supabase Auth SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Supabase Auth: https://supabase.com/docs/guides/auth
- Cloudflare R2 upload: https://developers.cloudflare.com/r2/objects/upload-objects/
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare Workers framework guides: https://developers.cloudflare.com/workers/framework-guides/
- Resend pricing: https://resend.com/pricing
- PayPal Checkout developer docs: https://developer.paypal.com/checkout/
- FFmpeg: https://ffmpeg.org/documentation.html

---

## 24. Ghi chú cuối

- README này phản ánh **toàn bộ phạm vi quyết định đã được Sang xác nhận trong cuộc trao đổi**, bao gồm cả những lần thay đổi lựa chọn.
- Các ví dụ số tiền, tên release, cấu trúc thư mục và tên bảng dữ liệu chỉ dùng để diễn giải; **không phải dữ liệu thực tế** hoặc mã nguồn đã triển khai.
- Những chi tiết nhỏ chưa chốt (như kích thước pixel, màu HEX, tên bảng SQL chính thức, tên biến môi trường, lịch chạy queue) thuộc bước thiết kế/kỹ thuật và **không được ghi như quyết định kinh doanh của Sang**.
- Khi triển khai có xung đột giữa tài liệu và quyết định mới bằng lời của Sang, phải cập nhật README và áp dụng **quyết định mới nhất**.
- Không tự ý thêm lại những chức năng thuộc mục **KHÔNG TRIỂN KHAI**.
- Trước mỗi thay đổi có thể xóa dữ liệu thật, phải kiểm kê mục tiêu và lưu khả năng phục hồi phù hợp.

**Đích đến:** ZENITH MEDIA trở thành cửa hàng bán sản phẩm số chuyên nghiệp, giao diện Creative Studio Light, bảo vệ quyền tải, tối ưu chi phí ban đầu và có kiến trúc đủ rõ để tiếp tục phát triển.
