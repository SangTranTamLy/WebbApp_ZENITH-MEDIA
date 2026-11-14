import express from "express";
import { createServer } from "node:http";
import { AsyncLocalStorage } from "node:async_hooks";
import { handleAsNodeRequest } from "cloudflare:node";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { connectPostgres } from "./db/connect.js";
import type { Repository } from "./db/repository.js";
import { R2Storage } from "./integrations/storage.js";
import { dispatchOutbox } from "./integrations/delivery.js";

// Real Express adapter. Connections belong to one request, never another isolate request.
const scope = new AsyncLocalStorage<Repository>();
const scoped = new Proxy({} as Repository, {
  get(_target, key) {
    const repo = scope.getStore();
    if (!repo) throw new Error("Database accessed outside request scope");
    const value = repo[key as keyof Repository];
    return typeof value === "function" ? value.bind(repo) : value;
  },
});
let application: ReturnType<typeof createApp> | null = null;
const shell = express();
shell.get("/api/runtime", (_req, res) =>
  res.json({
    ok: true,
    framework: "express",
    runtime: "cloudflare-workers",
    productionValidated: false,
  }),
);
shell.use((req, res, next) => {
  if (!application) {
    res.status(503).json({
      error: {
        code: "SETUP_REQUIRED",
        message: "Store services are not configured.",
      },
    });
    return;
  }
  application(req, res, next);
});
createServer(shell).listen(8080);
type Bindings = Record<string, string>;
type Execution = { waitUntil(promise: Promise<unknown>): void };
export default {
  async fetch(request: Request, env: Bindings, ctx: Execution) {
    if (new URL(request.url).pathname === "/api/runtime")
      return handleAsNodeRequest(8080, request);
    let config;
    try {
      config = loadConfig({ ...env, NODE_ENV: "production" });
    } catch {
      return Response.json(
        {
          error: {
            code: "SETUP_REQUIRED",
            message: "Store services are not configured.",
          },
        },
        { status: 503 },
      );
    }
    const connection = connectPostgres(config.databaseUrl);
    application ??= createApp(scoped, config, new R2Storage(config));
    try {
      return await scope.run(connection.repository, () =>
        handleAsNodeRequest(8080, request),
      );
    } finally {
      ctx.waitUntil(connection.close());
    }
  },
  async scheduled(_event: unknown, env: Bindings, ctx: Execution) {
    const config = loadConfig({ ...env, NODE_ENV: "production" });
    const connection = connectPostgres(config.databaseUrl);
    ctx.waitUntil(
      dispatchOutbox(connection.repository, config).finally(() =>
        connection.close(),
      ),
    );
  },
};
