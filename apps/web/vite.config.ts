import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const LOOPBACK_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "[::1]",
  "::1",
]);

function validateProductionApiBaseUrl(
  mode: string,
  env: Record<string, string>,
): void {
  if (mode !== "production") {
    return;
  }

  const configuredUrl = env.VITE_API_BASE_URL?.trim();
  const isVercelBuild =
    env.VERCEL === "1" ||
    env.VERCEL === "true" ||
    Boolean(process.env.VERCEL);

  if (!configuredUrl) {
    if (isVercelBuild) {
      throw new Error(
        "VITE_API_BASE_URL phải được cấu hình trên Vercel production; không dùng fallback same-origin cho Socket.IO.",
      );
    }

    return;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(configuredUrl);
  } catch {
    throw new Error(
      "VITE_API_BASE_URL phải là absolute URL của API origin.",
    );
  }

  if (
    !["http:", "https:"].includes(parsedUrl.protocol) ||
    parsedUrl.pathname !== "/" ||
    parsedUrl.search.length > 0 ||
    parsedUrl.hash.length > 0
  ) {
    throw new Error(
      "VITE_API_BASE_URL chỉ được chứa origin, ví dụ https://zenith-api.example.com.",
    );
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (LOOPBACK_HOSTS.has(hostname)) {
    throw new Error(
      "Production web build không được chứa VITE_API_BASE_URL trỏ tới localhost hoặc loopback.",
    );
  }

  if (isVercelBuild && parsedUrl.protocol !== "https:") {
    throw new Error(
      "VITE_API_BASE_URL trên Vercel production phải dùng HTTPS.",
    );
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  validateProductionApiBaseUrl(mode, env);

  return {
    plugins: [react()],

    server: {
      port: 5173,

      proxy: {
        "/api": {
          target: "http://localhost:4000",
          changeOrigin: true,
        },
        "/socket.io": {
          target: "http://localhost:4000",
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
