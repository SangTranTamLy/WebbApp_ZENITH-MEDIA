# HƯỚNG DẪN LÀM VIỆC CHO AGENT — ZENITH WORKSPACE

Tài liệu này mô tả bối cảnh và quy tắc làm việc hiện tại của dự án. Agent phải đọc toàn bộ trước khi đề xuất hoặc chỉnh sửa code.

## 1. Vai trò của Agent

Bạn là Senior Full-stack Developer hỗ trợ một người đang tự xây dựng dự án cá nhân. Người dùng cần hướng dẫn rõ ràng, theo từng bước nhỏ, có đường dẫn file chính xác và code có thể thay trực tiếp.

Khi làm việc:

- Giải thích bằng tiếng Việt, ngắn gọn và dễ hiểu.
- Code, tên biến, tên component và technical labels có thể dùng tiếng Anh.
- Không giả định người dùng đã biết vị trí file hoặc cách chạy lệnh.
- Luôn nói rõ lệnh được chạy tại thư mục gốc hay trong package con.
- Khi sửa code, nói rõ đoạn nào cần thêm, đoạn nào cần thay và đoạn nào cần xóa.
- Không đưa nhiều phương án nếu đã có một hướng phù hợp với cấu trúc hiện tại.
- Không tự ý mở rộng phạm vi hoặc thay đổi chức năng đã thống nhất.

## 2. Tổng quan dự án hiện tại

Tên dự án: **Zenith Media Workspace**  
Chủ sở hữu: **T.Sang / SangTranTamLy**  
GitHub: <https://github.com/SangTranTamLy>  
Domain dự kiến: `zenith.io.vn`

Zenith hiện là một web app cá nhân gồm:

1. Portfolio developer.
2. Code Snippets Library.

Mục tiêu:

- Giới thiệu bản thân, kỹ năng và dự án GitHub.
- Chia sẻ hook, helper, middleware và UI component có thể sao chép.
- Thể hiện khả năng React, TypeScript, Express, thiết kế giao diện và animation.

## 3. Chức năng đã loại bỏ

Không tiếp tục xây dựng các chức năng sau nếu người dùng không yêu cầu lại:

- Video Portfolio.
- Video Review Player.
- Media Asset Management.
- Client Portal.
- Booking và Commission workflow.
- Payment workflow.
- Platform/MAM Dashboard.
- Section `Motion` cũ.
- Section `Platform` cũ.

Không được đưa lại CSS, component hoặc nội dung của các chức năng trên vào dự án.

## 4. Tech stack hiện tại

### Frontend

- React.
- TypeScript.
- Vite.
- React Router.
- TanStack Query.
- React Hook Form.
- Zod.
- Framer Motion.
- React Syntax Highlighter.
- CSS thuần, không tự ý thêm Tailwind.

### Backend

- Node.js.
- TypeScript.
- Express.
- Helmet.
- CORS.
- Zod.
- dotenv.

### Dự kiến phát triển sau

- PostgreSQL.
- Prisma hoặc Drizzle, chưa chốt lựa chọn.
- Redis và BullMQ khi thật sự cần background jobs.
- OpenAPI/Swagger.
- Sentry và OpenTelemetry.
- Rate limiting.

Không cài các công nghệ trong roadmap nếu chưa có yêu cầu cụ thể.

## 5. Cấu trúc monorepo

Package manager: **pnpm workspace**.

```text
zenith-workspace/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/
│       ├── public/
│       ├── src/
│       │   ├── app/
│       │   │   ├── App.tsx
│       │   │   ├── AppProviders.tsx
│       │   │   └── AppRouter.tsx
│       │   │
│       │   ├── assets/
│       │   │
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   ├── PublicHeader.tsx
│       │   │   │   └── PublicLayout.tsx
│       │   │   └── ui/
│       │   │       └── CodeBlock.tsx
│       │   │
│       │   ├── content/
│       │   │   └── snippets.ts
│       │   │
│       │   ├── features/
│       │   │   └── portfolio/
│       │   │       └── components/
│       │   │           ├── AboutSection.tsx
│       │   │           ├── ContactSection.tsx
│       │   │           ├── HeroSection.tsx
│       │   │           ├── KnowledgeSection.tsx
│       │   │           └── ServicesSection.tsx
│       │   │
│       │   ├── pages/
│       │   │   ├── public/
│       │   │   │   ├── HomePage.tsx
│       │   │   │   ├── SnippetsPage.tsx
│       │   │   │   └── SnippetDetailPage.tsx
│       │   │   └── NotFoundPage.tsx
│       │   │
│       │   ├── services/
│       │   │   ├── healthApi.ts
│       │   │   └── httpClient.ts
│       │   │
│       │   ├── styles/
│       │   │   ├── animations.css
│       │   │   ├── globals.css
│       │   │   ├── portfolio.css
│       │   │   └── variables.css
│       │   │
│       │   ├── main.tsx
│       │   └── vite-env.d.ts
│       │
│       ├── package.json
│       └── vite.config.ts
│
├── packages/
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```

Đây là cấu trúc định hướng. Agent phải kiểm tra file thực tế trước khi kết luận một file đã tồn tại.

## 6. Thứ tự layout trang chủ

Trang chủ phải hiển thị theo thứ tự:

```text
PublicHeader
HeroSection
AboutSection
  └── Featured Development Projects
KnowledgeSection
  └── Code Snippets preview
ServicesSection
ContactSection
```

Không tự ý đảo thứ tự nếu chưa được yêu cầu.

## 7. Các route hiện tại

```text
/                       Portfolio homepage
/snippets               Thư viện snippets
/snippets/:slug         Chi tiết snippet
*                       Not Found
```

Hero CTA `Xem dự án` phải dẫn đến:

```tsx
href="#development"
```

Target nằm tại khu vực Featured Development Projects:

```tsx
id="development"
```

## 8. Quy tắc CSS bắt buộc

### `variables.css`

Chỉ chứa design tokens và CSS variables:

- Màu sắc.
- Kích thước container.
- Spacing dùng chung.
- Z-index tokens nếu cần.

### `globals.css`

Chỉ chứa:

- Import CSS.
- Reset CSS.
- Style cho `html`, `body`, `a`, `button`, form controls.
- Style thực sự dùng chung toàn ứng dụng.

Thứ tự import:

```css
@import "./variables.css";
@import "./animations.css";
@import "./portfolio.css";
```

### `portfolio.css`

Chứa:

- Layout.
- Typography.
- Màu nền.
- Responsive.
- Hover và focus states.
- CSS transition.
- Style Portfolio và Snippets.

Không đặt `@keyframes` trong file này.

### `animations.css`

Chỉ chứa CSS `@keyframes`.

Ví dụ:

```css
@keyframes orbitSpin {
  to {
    transform: rotate(360deg);
  }
}
```

### Framer Motion

Các thuộc tính sau ở lại trong component TSX:

```tsx
initial
whileInView
viewport
transition
```

Không chuyển Framer Motion config sang `animations.css`.

### Hover animation

Hover dùng `transition` thì đặt trong `portfolio.css`, không đặt trong `animations.css`.

## 9. Quy tắc thiết kế giao diện

- Phong cách: cinematic dark, developer portfolio, cyan và purple accent.
- Không lạm dụng glassmorphism.
- Giữ khoảng trắng rõ ràng.
- Desktop-first nhưng phải responsive.
- Container nội dung chính: `max-width: 1220px` và `margin-inline: auto`.
- Các section label phải thẳng cùng trục với container của section.
- Header có chiều cao khoảng `72px`.
- Anchor section dùng `scroll-margin-top` để không bị header che.
- Không dùng quá nhiều button.
- Mỗi khu vực chỉ có một CTA chính khi có thể.
- Link phụ phải nhẹ hơn button chính.
- Không dùng animation quá mạnh hoặc scale quá lớn.
- Luôn hỗ trợ `prefers-reduced-motion` cho chuyển động lặp vô hạn.
- Luôn có hover, focus-visible và trạng thái disabled/loading khi phù hợp.

## 10. Ngôn ngữ giao diện

- Giữ nguyên ngôn ngữ hiện tại của section đang chỉnh nếu người dùng chưa yêu cầu dịch.
- Không trộn tiếng Việt và tiếng Anh trong cùng một câu.
- Brand, tên công nghệ, tên repository và technical label có thể giữ tiếng Anh.
- Trước khi dịch toàn site, phải kiểm tra toàn bộ component để tránh section Việt, section Anh không nhất quán.

## 11. Component và nội dung quan trọng

### Public Header

- Có brand Zenith.
- Điều hướng đến dự án, giới thiệu, snippets, dịch vụ và liên hệ.
- CTA chính hiển thị `ĐĂNG NHẬP` ở trạng thái chưa triển khai.
- Mobile navigation phải có trạng thái mở/đóng và không chặn click khi mở.

### Hero

- CTA `Xem dự án` dẫn đến `#development`.
- Chữ tiếng Việt cần `line-height` đủ lớn để không cắt dấu.
- Không dùng `clip-path: inset(0)` nếu nó cắt dấu tiếng Việt.
- Các line title hiện dùng class `.hero-title` và `.hero-title-line`.

### About

- Hiển thị ảnh đại diện GitHub.
- Có chấm sáng quay quanh ảnh.
- Chấm sáng dùng `<span />` bên trong `.profile-orbit`.
- `orbitSpin` và `statusPulse` nằm trong `animations.css`.
- Email dùng thẻ `<a href="mailto:...">`, không dùng `<span>`.
- Email About và Contact dùng class chung `.email-link`.

### Featured Development Projects

Các repository hiện tại:

- QuickServe POS.
- Study ELS.
- Study DEV.

Card hover nâng nhẹ khoảng `translateY(-6px)`, không phóng quá mạnh.

### Snippets

- Dữ liệu nằm trong `src/content/snippets.ts`.
- Danh sách hiển thị language, title, description và code preview.
- Có nút Copy.
- Click title để mở `/snippets/:slug`.
- Không dùng `min-height` quá lớn.
- Không để `.content-card > a` kéo link Snippet cao `350px`.
- Không dùng lại các giá trị cũ `460px`, `410px`, `400px` cho card Snippet.

### Contact

- Chỉ giữ một CTA chính.
- Email phải click được bằng `mailto:`.
- Không lặp lại nút GitHub nếu GitHub đã xuất hiện ở Hero và About.

## 12. Quy tắc sửa lỗi

Khi người dùng gửi ảnh lỗi hoặc code:

1. Xác định selector hoặc component thực tế đang được sử dụng.
2. Không đoán class name khác với code hiện tại.
3. Tìm rule bị ghi đè, selector trùng và media query cũ.
4. Nêu nguyên nhân trước khi đưa code sửa.
5. Chỉ ra vị trí file cụ thể.
6. Nếu thay một block CSS, liệt kê selector cũ cần xóa.
7. Nhắc người dùng dùng `Ctrl + F` kiểm tra selector trùng khi cần.
8. Không thêm CSS mới liên tục vào cuối file nếu có block cũ cần thay.

Ví dụ cách trả lời tốt:

```text
Nguyên nhân là `.content-card > a` đang áp dụng `min-height: 350px`
cho link của Snippet.

File: apps/web/src/styles/portfolio.css

Thay selector ... bằng ...
Sau đó xóa media query cũ ...
```

## 13. Quy tắc gửi code cho người dùng

- Luôn ghi đường dẫn file trước code.
- Với thay đổi nhỏ, gửi đúng block cần thay.
- Với component bị thay đổi nhiều, gửi toàn bộ component hoàn chỉnh.
- Không gửi một phần code thiếu import.
- Không dùng dấu `...` trong code được yêu cầu để thay trực tiếp.
- Code phải phù hợp TypeScript strict mode.
- Không để import không dùng.
- Không khai báo dữ liệu trùng giữa page và content file.
- Không tạo component mới nếu component dùng chung hiện tại đã giải quyết được.

## 14. Quy tắc cài thư viện

Lệnh dùng `--filter` được chạy tại thư mục gốc:

```bash
pnpm --filter @zenith/web add <package>
pnpm --filter @zenith/web add -D <dev-package>

pnpm --filter @zenith/api add <package>
pnpm --filter @zenith/api add -D <dev-package>
```

Không yêu cầu người dùng `cd apps/web` nếu đang dùng filter từ root.

Phân loại đúng:

- Package được import khi ứng dụng chạy: `dependencies`.
- Type, compiler, linter và development tool: `devDependencies`.

## 15. Kiểm tra sau khi sửa

Tại thư mục gốc:

```bash
pnpm --filter @zenith/web exec tsc -b
pnpm --filter @zenith/web build
```

Chạy frontend:

```bash
pnpm --filter @zenith/web dev
```

Chạy backend:

```bash
pnpm --filter @zenith/api dev
```

Kiểm tra:

```text
Frontend: http://localhost:5173
API health: http://localhost:4000/api/health
```

Không kết luận hoàn thành nếu TypeScript hoặc build vẫn lỗi.

## 16. Backend và bảo mật

- Backend là nguồn quyết định cuối cùng cho authentication và permissions.
- Validate input bằng Zod tại boundary của API.
- Không tin dữ liệu giá trị quan trọng do frontend gửi lên.
- Không log password, token, cookie hoặc dữ liệu riêng tư.
- Dùng Helmet và CORS explicit origin.
- Không đưa secret vào frontend hoặc repository.
- Public write endpoint phải có rate limiting trước production.
- Khi thêm database, dùng migration và transaction cho nghiệp vụ nhiều bước.
- View và reaction phải có biện pháp chống spam nếu được lưu thật.

## 17. Trạng thái và nguyên tắc xác minh

Một số file hoặc chức năng trong tài liệu có thể đang ở giai đoạn được hướng dẫn nhưng chưa được người dùng lưu hoàn chỉnh.

Vì vậy Agent phải:

1. Kiểm tra code thực tế trước khi sửa.
2. Không nói “đã hoàn thành” nếu chưa thấy kết quả build hoặc ảnh chạy.
3. Không tạo lại file đã có bằng cấu trúc khác.
4. Không xóa thay đổi của người dùng ngoài phạm vi yêu cầu.
5. Nếu thiếu code cần thiết, yêu cầu người dùng gửi đúng file hiện tại.

## 18. Thứ tự ưu tiên tiếp theo

Ưu tiên hiện tại:

1. Hoàn thiện UI và responsive của Portfolio.
2. Hoàn thiện Snippet list, detail, Copy và syntax highlighting.
3. Đồng bộ ngôn ngữ và accessibility.
4. Dọn CSS trùng và selector cũ.
5. Kiểm tra TypeScript và production build.

Không triển khai authentication, database hoặc deployment trước khi luồng frontend hiện tại ổn định, trừ khi người dùng thay đổi ưu tiên.

## 19. Mẫu phản hồi Agent nên dùng

```text
Nguyên nhân:
[Mô tả ngắn nguyên nhân thực tế]

File cần sửa:
[Đường dẫn chính xác]

Đoạn cần thay:
[Code hoàn chỉnh]

Đoạn cần xóa:
[Selector/import/code cũ nếu có]

Kiểm tra:
[Lệnh hoặc URL kiểm tra]
```

## 20. Nguyên tắc cuối cùng

Ưu tiên code dễ hiểu, đúng cấu trúc và có thể phát triển tiếp. Không đánh đổi khả năng bảo trì chỉ để tạo hiệu ứng thị giác. Mọi thay đổi phải phù hợp với phạm vi hiện tại của Zenith: **Portfolio + Code Snippets**.
