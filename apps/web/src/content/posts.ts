export type BlogPost = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  readingTime: string;
  tags: string[];
  content: {
    heading?: string;
    paragraphs: string[];
    code?: string;
    language?: string;
  }[];
};

export const posts: BlogPost[] = [
  {
    slug: "quickserve-pos-sales-workflow",
    category: "FULL-STACK DEVELOPMENT",
    title: "Thiết kế luồng bán hàng cho QuickServe POS",
    excerpt:
      "Cách tôi tổ chức quy trình mở ca, chọn sản phẩm, thanh toán và cập nhật tồn kho trong một hệ thống POS.",
    publishedAt: "31.07.2026",
    readingTime: "8 phút đọc",
    tags: ["React", "TypeScript", "Express", "PostgreSQL"],
    content: [
      {
        paragraphs: [
          "QuickServe POS là nền tảng quản lý bán hàng được xây dựng để xử lý sản phẩm, đơn hàng, hóa đơn, tồn kho, ca làm việc và báo cáo doanh thu.",
          "Một trong những vấn đề quan trọng nhất của hệ thống là bảo đảm dữ liệu bán hàng được cập nhật thống nhất giữa giao diện, API và cơ sở dữ liệu.",
        ],
      },
      {
        heading: "Luồng bán hàng cơ bản",
        paragraphs: [
          "Nhân viên phải đăng nhập và tham gia một ca làm việc đang hoạt động trước khi tạo đơn hàng.",
          "Sau khi chọn sản phẩm, hệ thống tính tổng tiền, khuyến mãi và phương thức thanh toán trước khi gửi yêu cầu đến API.",
        ],
      },
      {
        heading: "Kiểm tra dữ liệu tại Backend",
        paragraphs: [
          "Backend không tin tưởng trực tiếp dữ liệu tổng tiền do frontend gửi lên. Giá sản phẩm và khuyến mãi được truy vấn lại từ cơ sở dữ liệu.",
        ],
        language: "TypeScript",
        code: `const orderTotal = orderItems.reduce(
  (total, item) => {
    return total + item.price * item.quantity;
  },
  0,
);`,
      },
    ],
  },
  {
    slug: "express-api-response-structure",
    category: "BACKEND DEVELOPMENT",
    title: "Chuẩn hóa API Response với Express",
    excerpt:
      "Xây dựng một cấu trúc response thống nhất để frontend xử lý dữ liệu và lỗi dễ dàng hơn.",
    publishedAt: "29.07.2026",
    readingTime: "5 phút đọc",
    tags: ["Node.js", "Express", "Zod", "API"],
    content: [
      {
        paragraphs: [
          "Khi mỗi API trả về một cấu trúc khác nhau, frontend phải viết nhiều điều kiện xử lý không cần thiết.",
          "Một response tiêu chuẩn giúp cả frontend và backend sử dụng chung một quy ước.",
        ],
      },
      {
        heading: "Cấu trúc response thành công",
        paragraphs: [
          "Mọi response thành công đều chứa success, message và data.",
        ],
        language: "TypeScript",
        code: `export type ApiResponse<T> = {
  success: true;
  message: string;
  data: T;
};`,
      },
      {
        heading: "Cấu trúc response lỗi",
        paragraphs: [
          "Response lỗi cần có mã lỗi ổn định để frontend không phụ thuộc hoàn toàn vào nội dung message.",
        ],
        language: "TypeScript",
        code: `export type ApiErrorResponse = {
  success: false;
  message: string;
  errorCode: string;
  details?: unknown;
};`,
      },
    ],
  },
  {
    slug: "react-use-debounce-search",
    category: "REACT DEVELOPMENT",
    title: "Tối ưu tìm kiếm React bằng useDebounce",
    excerpt:
      "Hạn chế gọi API liên tục khi người dùng nhập từ khóa bằng một custom React hook có thể tái sử dụng.",
    publishedAt: "27.07.2026",
    readingTime: "4 phút đọc",
    tags: ["React", "TypeScript", "Custom Hook"],
    content: [
      {
        paragraphs: [
          "Nếu gọi API sau mỗi lần người dùng nhập một ký tự, ứng dụng có thể tạo ra quá nhiều request không cần thiết.",
          "Debounce trì hoãn việc cập nhật từ khóa cho đến khi người dùng tạm dừng nhập.",
        ],
      },
      {
        heading: "Custom hook useDebounce",
        paragraphs: [
          "Hook nhận vào một giá trị và thời gian trì hoãn, sau đó chỉ cập nhật giá trị kết quả khi timeout hoàn thành.",
        ],
        language: "TypeScript",
        code: `export function useDebounce<T>(
  value: T,
  delay = 300,
) {
  const [debouncedValue, setDebouncedValue] =
    useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}`,
      },
    ],
  },
];

export function getPostBySlug(slug: string) {
  return posts.find((post) => post.slug === slug);
}