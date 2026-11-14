import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_DEMO": JSON.stringify(
      mode === "demo" ? "true" : "false",
    ),
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: process.env.SHOP_DEV_API_URL || "http://127.0.0.1:4000",
        changeOrigin: true,
      },
      "/demo-media": {
        target: process.env.SHOP_DEV_API_URL || "http://127.0.0.1:4000",
        changeOrigin: true,
      },
    },
  },
  build: { sourcemap: false },
}));
