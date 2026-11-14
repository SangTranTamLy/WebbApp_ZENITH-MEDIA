import "dotenv/config";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import os from "node:os";
import path from "node:path";
import type { PreviewJob } from "@zenith/shared";
import { validateZip } from "./zip.js";
import { detectType, renderPreview, sha256 } from "./process.js";

const api = process.env.SHOP_API_URL ?? "http://127.0.0.1:4000";
const secret = process.env.SHOP_WORKER_SECRET ?? "";
if (secret.length < 32)
  throw new Error("Set SHOP_WORKER_SECRET (at least 32 characters).");
if (
  !api.startsWith("https://") &&
  !/^http:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(api)
)
  throw new Error("Use HTTPS for the worker API.");
async function request<T>(route: string, body: unknown = {}): Promise<T> {
  const response = await fetch(`${api}/api/worker${route}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error(`Worker API HTTP ${response.status}`);
  return response.json() as Promise<T>;
}
let stopping = false;
process.on("SIGINT", () => {
  stopping = true;
});
process.on("SIGTERM", () => {
  stopping = true;
});
console.log(
  "ZENITH local media worker running. Close this process to pause new jobs.",
);
while (!stopping) {
  try {
    const work = await request<{
      job: PreviewJob;
      file: { size: number; type: string };
      sourceUrl: string;
      uploadUrl: string | null;
    } | null>("/claim");
    if (!work) {
      await request("/dispatch");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      continue;
    }
    const directory = await mkdtemp(path.join(os.tmpdir(), "zenith-media-"));
    const input = path.join(directory, "source");
    let leaseLost = false;
    const heartbeat = setInterval(() => {
      void request(`/jobs/${work.job.id}/heartbeat`, {
        token: work.job.leaseToken,
      }).catch(() => {
        leaseLost = true;
      });
    }, 30000);
    try {
      const response = await fetch(work.sourceUrl, {
        signal: AbortSignal.timeout(30 * 60_000),
      });
      if (!response.ok || !response.body)
        throw new Error("Cannot download source");
      await pipeline(
        Readable.fromWeb(
          response.body as import("node:stream/web").ReadableStream,
        ),
        createWriteStream(input),
      );
      if ((await stat(input)).size !== work.file.size)
        throw new Error("Downloaded source size mismatch");
      const hash = await sha256(input);
      let zip;
      if (work.job.type === "zip") zip = await validateZip(input);
      if (work.job.type === "preview") {
        const { output } = await renderPreview(input, directory, work.job);
        if (leaseLost) throw new Error("Lease lost during rendering");
        const uploaded = await fetch(work.uploadUrl!, {
          method: "PUT",
          headers: {
            "Content-Type": "video/mp4",
            "Content-Length": String((await stat(output)).size),
          },
          body: createReadStream(output) as unknown as BodyInit,
          duplex: "half",
          signal: AbortSignal.timeout(30 * 60_000),
        } as RequestInit);
        if (!uploaded.ok)
          throw new Error(`Preview upload failed (${uploaded.status})`);
      }
      if (leaseLost) throw new Error("Lease lost");
      await request(`/jobs/${work.job.id}/complete`, {
        token: work.job.leaseToken,
        sha256: hash,
        zip,
        detectedType: await detectType(input),
      });
      console.log(`Completed ${work.job.type} job ${work.job.id}`);
    } catch (error) {
      await request(`/jobs/${work.job.id}/complete`, {
        token: work.job.leaseToken,
        sha256: "0".repeat(64),
        error: (error as Error).message.slice(0, 500),
      }).catch(() => {});
      console.error("Job failed; available for retry in Admin.");
    } finally {
      clearInterval(heartbeat);
      const resolved = path.resolve(directory);
      if (
        resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) &&
        path.basename(resolved).startsWith("zenith-media-")
      )
        await rm(resolved, { recursive: true, force: true });
    }
  } catch (error) {
    console.error((error as Error).message);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
