import "dotenv/config";
import { loadConfig } from "./config.js";
import { connectPostgres } from "./db/connect.js";
import { R2Storage } from "./integrations/storage.js";
import { createApp } from "./app.js";
import { dispatchOutbox } from "./integrations/delivery.js";

const config = loadConfig();
if (config.demo)
  throw new Error("Use the separate demo entry point for local fixtures.");
const { repository, close } = connectPostgres(config.databaseUrl);
if (!(await repository.get("settings", "store")))
  throw new Error(
    "Run the explicit migration and seed commands before starting the store.",
  );
const app = createApp(repository, config, new R2Storage(config));
const server = app.listen(config.port, "127.0.0.1", () =>
  console.log(`ZENITH API listening on ${config.port}`),
);
let running = false;
const timer = setInterval(async () => {
  if (running) return;
  running = true;
  try {
    await dispatchOutbox(repository, config);
  } catch {
    console.error("Outbox dispatch failed");
  } finally {
    running = false;
  }
}, 5000);
const stop = () => {
  clearInterval(timer);
  server.close(() => {
    void close().then(() => process.exit());
  });
};
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
