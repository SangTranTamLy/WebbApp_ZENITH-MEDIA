import { defineConfig } from "@playwright/test";
import path from "node:path";
const run = Date.now().toString();
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:5180",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "pnpm --filter @zenith/api demo",
      url: "http://127.0.0.1:4100/api/health",
      timeout: 90000,
      reuseExistingServer: false,
      env: {
        PORT: "4100",
        SHOP_DEMO_DATA_DIR: path.resolve(`.local/e2e-${run}`),
        SHOP_WEB_ORIGIN: "http://127.0.0.1:5180",
      },
    },
    {
      command: "pnpm --filter @zenith/web demo --port 5180",
      url: "http://127.0.0.1:5180",
      timeout: 90000,
      reuseExistingServer: false,
      env: { SHOP_DEV_API_URL: "http://127.0.0.1:4100" },
    },
  ],
});
