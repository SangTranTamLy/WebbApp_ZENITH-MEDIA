import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { connectLocal } from "../src/db/local.js";
import { DemoStorage } from "../src/demo/storage.js";
import { seedDemo } from "../src/demo/seed.js";
import { loadConfig } from "../src/config.js";
import { createApp } from "../src/app.js";

test(
  "upload, local worker verification, ZIP, preview, publication and immutable file copy",
  { timeout: 60000 },
  async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "zenith-workflow-"));
    const db = await connectLocal();
    const storage = new DemoStorage(dir);
    await seedDemo(db.repository, storage);
    const config = loadConfig({
      SHOP_DEMO: "true",
      SHOP_MB_ACCOUNT: "DEMO",
      SHOP_MB_NAME: "DEMO",
      SHOP_WORKER_SECRET: "test-worker-integration-32-characters",
    });
    const app = createApp(db.repository, config, storage);
    app.use("/demo-storage", storage.router());
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    storage.setOrigin(origin);
    const api = async (route: string, body: unknown, method = "POST") => {
      const response = await fetch(`${origin}/api${route}`, {
        method,
        headers: {
          Authorization: "Bearer demo-admin",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      assert(response.ok, JSON.stringify(result));
      return result;
    };
    const cwd = fileURLToPath(new URL("../../worker/", import.meta.url));
    const worker = spawn(process.execPath, ["--import", "tsx", "src/main.ts"], {
      cwd,
      windowsHide: true,
      env: {
        ...process.env,
        SHOP_API_URL: origin,
        SHOP_WORKER_SECRET: config.workerSecret,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    worker.stdout.on("data", (b) => {
      output += String(b);
    });
    worker.stderr.on("data", (b) => {
      output += String(b);
    });
    async function waitFor<T>(
      read: () => Promise<T>,
      accept: (result: T) => boolean,
    ) {
      const start = Date.now();
      while (Date.now() - start < 40000) {
        const value = await read();
        if (accept(value)) return value;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      throw new Error(`Worker did not complete: ${output}`);
    }
    try {
      const bytes = await readFile(
        new URL("../../../demo-assets/preview.mp4", import.meta.url),
      );
      const upload = await api("/uploads", {
        name: "workflow.mp4",
        type: "video/mp4",
        size: bytes.length,
        purpose: "product",
      });
      assert.equal(
        (
          await fetch(upload.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": "video/mp4" },
            body: bytes,
          })
        ).status,
        200,
      );
      const finished = await api(`/uploads/${upload.file.id}/complete`, {});
      assert(!finished.key.startsWith("staging/"));
      // An old PUT URL can modify only staging, never the finalized sold object.
      await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "video/mp4" },
        body: "changed staging",
      });
      assert.equal(
        (await storage.head("products", finished.key)).size,
        bytes.length,
      );
      await waitFor(
        () => db.repository.get("files", finished.id),
        (file) => file?.status === "ready",
      );
      const preview = await api("/admin/jobs", {
        fileId: finished.id,
        type: "preview",
        start: 1,
        duration: 2,
      });
      const product = (await db.repository.get("products", "light-leaks"))!;
      const draft = { ...product.draft, mainPreviewJobId: preview.id };
      const saved = await api(
        `/admin/products/${product.id}/draft`,
        { content: draft, revision: product.revision },
        "PUT",
      );
      const publishedEarly = await fetch(
        `${origin}/api/admin/products/${product.id}/publish`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer demo-admin",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ revision: saved.revision }),
        },
      );
      assert.equal(publishedEarly.status, 409);
      const completed = await waitFor(
        () => db.repository.get("jobs", preview.id),
        (job) => job?.status === "done",
      );
      assert(completed?.outputUrl?.includes("/demo-previews/"));
      const published = await api(`/admin/products/${product.id}/publish`, {
        revision: saved.revision,
      });
      assert.equal(published.published.media[0].url, completed!.outputUrl);
      const zipBytes = await readFile(
        new URL("../../../demo-assets/collection.zip", import.meta.url),
      );
      const zip = await api("/uploads", {
        name: "workflow.zip",
        type: "application/zip",
        size: zipBytes.length,
        purpose: "product",
      });
      await fetch(zip.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/zip" },
        body: zipBytes,
      });
      await api(`/uploads/${zip.file.id}/complete`, {});
      const checked = await waitFor(
        () => db.repository.get("files", zip.file.id),
        (file) => file?.status === "ready",
      );
      assert.equal(checked?.zip?.status, "valid");
      assert(checked?.zip?.entries.includes("sample.mp4"));
    } finally {
      worker.kill();
      await new Promise<void>((resolve) => {
        if (worker.exitCode !== null) resolve();
        else {
          worker.once("exit", () => resolve());
          setTimeout(resolve, 3000);
        }
      });
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await db.close();
      if (path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep))
        await rm(dir, { recursive: true, force: true });
    }
  },
);
