export type Snippet = {
  slug: string;
  language: string;
  title: string;
  description: string;
  code: string;
};

export const snippets: Snippet[] = [
  {
    slug: "use-debounce",
    language: "TypeScript",
    title: "useDebounce",
    description:
      "Custom React hook trì hoãn giá trị, hữu ích cho tìm kiếm và hạn chế gọi API liên tục.",
    code: `import { useEffect, useState } from "react";

export function useDebounce<T>(
  value: T,
  delay = 300,
) {
  const [debouncedValue, setDebouncedValue] =
    useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [value, delay]);

  return debouncedValue;
}`,
  },
  {
    slug: "api-response-helper",
    language: "Express",
    title: "API Response Helper",
    description:
      "Helper chuẩn hóa cấu trúc response thành công của Express API.",
    code: `export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export function successResponse<T>(
  data: T,
  message = "Success",
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}`,
  },
  {
    slug: "animated-button",
    language: "CSS",
    title: "Animated Button",
    description:
      "Nút có hiệu ứng ánh sáng và chuyển động nhẹ khi người dùng hover.",
    code: `.animated-button {
  position: relative;
  overflow: hidden;

  transition:
    background 250ms ease,
    box-shadow 250ms ease,
    transform 250ms ease;
}

.animated-button:hover {
  box-shadow: 0 12px 30px
    rgba(72, 215, 255, 0.16);

  transform: translateY(-3px);
}`,
  },
];

export function getSnippetBySlug(slug: string) {
  return snippets.find((snippet) => snippet.slug === slug);
}