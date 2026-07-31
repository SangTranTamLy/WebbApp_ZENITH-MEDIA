export type ArticleSummary = {
  slug: string;
  index: string;
  category: string;
  title: string;
  description: string;
  tags: string[];
  readingTime: string;
  publishedAt: string;
  featured: boolean;
};

export type CodeSnippet = {
  slug: string;
  title: string;
  language: string;
  description: string;
  code: string;
};

export const articles: ArticleSummary[] = [
  {
    slug: "express-api-typescript",
    index: "01",
    category: "BACKEND ARCHITECTURE",
    title: "Xây dựng Express API với TypeScript",
    description:
      "Cách tổ chức router, controller, service, validation và error handling cho một Express API dễ bảo trì.",
    tags: ["Express", "TypeScript", "Zod"],
    readingTime: "8 phút đọc",
    publishedAt: "2026-08-01",
    featured: true,
  },
  {
    slug: "react-query-server-state",
    index: "02",
    category: "REACT FRONTEND",
    title: "Quản lý Server State bằng React Query",
    description:
      "Phân biệt server state và client state trong một ứng dụng React thực tế.",
    tags: ["React", "React Query"],
    readingTime: "6 phút đọc",
    publishedAt: "2026-08-03",
    featured: false,
  },
  {
    slug: "postgresql-transaction-pos",
    index: "03",
    category: "DATABASE",
    title: "Transaction trong hệ thống POS",
    description:
      "Đảm bảo đơn hàng, tồn kho và thanh toán được cập nhật an toàn.",
    tags: ["PostgreSQL", "Prisma"],
    readingTime: "7 phút đọc",
    publishedAt: "2026-08-05",
    featured: false,
  },
];

export const snippets: CodeSnippet[] = [
  {
    slug: "use-debounce",
    title: "useDebounce",
    language: "TypeScript",
    description: "Custom hook trì hoãn giá trị tìm kiếm.",
    code: `export function useDebounce<T>(
  value: T,
  delay = 300,
) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}`,
  },
  {
    slug: "api-response",
    title: "API Response Helper",
    language: "Express",
    description: "Chuẩn hóa cấu trúc response của API.",
    code: `export function successResponse<T>(
  data: T,
  message = "Success",
) {
  return {
    success: true,
    message,
    data,
  };
}`,
  },
  {
    slug: "animated-button",
    title: "Animated Button",
    language: "CSS",
    description: "Nút có hiệu ứng chuyển động khi hover.",
    code: `.animated-button {
  position: relative;
  overflow: hidden;
  transition: transform 250ms ease;
}

.animated-button:hover {
  transform: translateY(-2px);
}`,
  },
];