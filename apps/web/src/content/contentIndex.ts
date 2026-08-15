export type CodeSnippet = {
  slug: string;
  title: string;
  language: string;
  description: string;
  code: string;
};

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
