import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  mkdir,
  stat,
  readFile,
  writeFile,
  copyFile,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import express from "express";
import type { Storage } from "../integrations/storage.js";
import type { AssetFile } from "@zenith/shared";
import { ShopError } from "../domain/errors.js";

export class DemoStorage implements Storage {
  private secret = randomBytes(32);
  constructor(
    public root: string,
    private origin = "http://127.0.0.1:4000",
  ) {}
  setOrigin(origin: string) {
    this.origin = origin;
  }
  private resolve(bucket: string, key: string) {
    const resolved = path.resolve(this.root, bucket, key);
    if (!resolved.startsWith(path.resolve(this.root) + path.sep))
      throw new ShopError(400, "INVALID_KEY", "Invalid storage key");
    return resolved;
  }
  private sign(
    op: string,
    bucket: string,
    key: string,
    type: string,
    expires: string,
  ) {
    return createHmac("sha256", this.secret)
      .update(JSON.stringify([op, bucket, key, type, expires]))
      .digest("hex");
  }
  private url(op: string, bucket: string, key: string, type = "") {
    const expires = String(Date.now() + 300000);
    return `${this.origin}/demo-storage?${new URLSearchParams({ op, bucket, key, type, expires, sig: this.sign(op, bucket, key, type, expires) })}`;
  }
  async upload(bucket: AssetFile["bucket"], key: string, type: string) {
    return this.url("PUT", bucket, key, type);
  }
  async download(bucket: AssetFile["bucket"], key: string) {
    return this.url("GET", bucket, key);
  }
  async head(bucket: AssetFile["bucket"], key: string) {
    try {
      const file = this.resolve(bucket, key);
      return {
        size: (await stat(file)).size,
        type: await readFile(`${file}.mime`, "utf8"),
      };
    } catch {
      throw new ShopError(404, "OBJECT_MISSING", "Demo file missing");
    }
  }
  async copy(bucket: AssetFile["bucket"], from: string, to: string) {
    const target = this.resolve(bucket, to);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(this.resolve(bucket, from), target);
    await copyFile(`${this.resolve(bucket, from)}.mime`, `${target}.mime`);
  }
  async remove(bucket: AssetFile["bucket"], key: string) {
    await unlink(this.resolve(bucket, key));
    await unlink(`${this.resolve(bucket, key)}.mime`).catch(() => {});
  }
  publicUrl(key: string) {
    return `${this.origin}/demo-previews/${key}`;
  }
  async seed(key: string, source: Buffer, type: string) {
    const target = this.resolve("products", key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, source);
    await writeFile(`${target}.mime`, type);
  }
  router() {
    const router = express.Router();
    router.use(express.raw({ type: () => true, limit: "30mb" }));
    router.use(async (req, res) => {
      const op = String(req.query.op),
        bucket = String(req.query.bucket),
        key = String(req.query.key),
        type = String(req.query.type),
        expires = String(req.query.expires),
        sig = String(req.query.sig);
      const expected = this.sign(op, bucket, key, type, expires);
      if (
        !["products", "previews"].includes(bucket) ||
        req.method !== op ||
        Number(expires) < Date.now() ||
        sig.length !== expected.length ||
        !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
      ) {
        res.status(403).end();
        return;
      }
      const target = this.resolve(bucket, key);
      if (op === "PUT") {
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, req.body as Buffer);
        await writeFile(`${target}.mime`, type);
        res.status(200).end();
      } else {
        const metadata = await this.head(bucket as AssetFile["bucket"], key);
        res.setHeader("Content-Type", metadata.type);
        res.download(target, path.basename(key), { dotfiles: "allow" });
      }
    });
    return router;
  }
}
