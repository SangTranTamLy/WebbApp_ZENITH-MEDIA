import express from "express";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import { loadConfig } from "./config.js";
import { connectLocal } from "./db/local.js";
import { DemoStorage } from "./demo/storage.js";
import { seedDemo } from "./demo/seed.js";
import { createApp } from "./app.js";

const config = loadConfig({
  ...process.env,
  SHOP_DEMO: "true",
  SHOP_MB_ACCOUNT: "DEMO-NO-TRANSFER",
  SHOP_MB_NAME: "LOCAL TEST ONLY",
  SHOP_WORKER_SECRET: "local-demo-worker-secret-at-least-32-characters",
});
const root =
  process.env.SHOP_DEMO_DATA_DIR ||
  fileURLToPath(new URL("../../../.local/demo-studio-v2/", import.meta.url));
await mkdir(root, { recursive: true });
const { repository, close } = await connectLocal(`${root}/database`);
const storage = new DemoStorage(
  `${root}/storage`,
  `http://127.0.0.1:${config.port}`,
);
await seedDemo(repository, storage);
const app = createApp(repository, config, storage);
app.use("/demo-storage", storage.router());
app.use(
  "/demo-media",
  express.static(
    fileURLToPath(new URL("../../../demo-assets/", import.meta.url)),
  ),
);
app.use(
  "/demo-previews",
  express.static(`${root}/storage/previews`, { dotfiles: "allow" }),
);
const server = app.listen(config.port, "127.0.0.1", () =>
  console.log(
    `ZENITH DEMO API at http://127.0.0.1:${config.port}; no real payments or production data.`,
  ),
);
const stop = () =>
  server.close(() => {
    void close().then(() => process.exit());
  });
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
