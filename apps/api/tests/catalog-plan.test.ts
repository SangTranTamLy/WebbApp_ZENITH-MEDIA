import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import type { Actor } from "@zenith/shared";
import { connectLocal } from "../src/db/local.js";
import { DemoStorage } from "../src/demo/storage.js";
import { seedDemo } from "../src/demo/seed.js";
import {
  publicCatalog,
  publishProduct,
  saveDraft,
  addOffer,
} from "../src/services/catalog.js";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config.js";

test("plan audit: public variants, bundle previews, related ordering and preview publication", async (t) => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "zenith-catalog-audit-"),
  );
  const local = await connectLocal();
  const repo = local.repository;
  const actor: Actor = {
    id: "demo-admin",
    email: "admin@example.test",
    name: "Admin",
    verified: true,
    admin: true,
  };
  const storage = new DemoStorage(directory);
  await seedDemo(repo, storage);
  const server = createApp(
    repo,
    loadConfig({ SHOP_DEMO: "true" }),
    storage,
  ).listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  try {
    await t.test(
      "the homepage shares a deduplicated snapshot and keeps the admin-selected hero",
      async () => {
        const response = await fetch(`${origin}/api/storefront`);
        const result = await response.json();
        assert.equal(
          result.products.length,
          new Set(result.products.map((p: { id: string }) => p.id)).size,
        );
        assert.equal(result.heroProductId, "violet");
        assert.equal(result.bundleId, "studio-bundle");
        assert.equal(result.latestIds.length, 3);
        assert(
          result.products.some(
            (p: { id: string }) => p.id === result.heroProductId,
          ),
        );
        const configResponse = await fetch(`${origin}/api/config`);
        const config = await configResponse.json();
        assert(!("products" in config));
        assert(
          config.categories.some((c: { id: string }) => c.id === "flowframes"),
        );
      },
    );
    await t.test(
      "options retain publication order and each exposes only its actual included files",
      async () => {
        const product = (await publicCatalog(repo)).find(
          (p) => p.id === "aurora",
        )!;
        assert.deepEqual(
          product.offers.map((o) => o.id),
          ["aurora-standard", "aurora-720"],
        );
        assert.deepEqual(product.offers[0].includedFileIds, [
          "demo-clip",
          "demo-readme",
        ]);
        assert.deepEqual(product.offers[1].includedFileIds, [
          "demo-aurora-720",
          "demo-readme",
        ]);
        assert.equal(product.offers[1].specs?.[0].value.en, "1280 × 720");
        const json = JSON.stringify(product);
        assert(!json.includes("sha256") && !json.includes("demo/sample.mp4"));
      },
    );
    await t.test(
      "bundle components resolve watermarked previews and exact ownership rights",
      async () => {
        const products = await publicCatalog(repo);
        const bundle = products.find((p) => p.id === "studio-bundle")!
          .offers[0];
        assert.equal(
          bundle.components[1].preview?.url,
          "/demo-media/studio-preview-2.mp4",
        );
        assert.equal(bundle.components[0].slug, "aurora");
        assert(
          bundle.grantedRights.includes(
            products.find((p) => p.id === "aurora")!.offers[0].grantedRights[0],
          ),
        );
        assert(bundle.includedFileIds.includes("demo-blue-clip"));
        assert.equal(bundle.components[2].slug, null);
      },
    );
    await t.test(
      "hidden component content and private drafts never leak via a public bundle",
      async () => {
        const member = (await repo.get("products", "blue-hour"))!;
        await repo.transaction((tx) =>
          tx.put("products", {
            ...member,
            status: "hidden",
            draft: {
              ...member.draft,
              title: { vi: "PRIVATE DRAFT", en: "PRIVATE DRAFT" },
            },
          }),
        );
        const bundle = (await publicCatalog(repo)).find(
          (p) => p.id === "studio-bundle",
        )!;
        assert.equal(bundle.offers[0].components[1].slug, null);
        assert.equal(bundle.offers[0].components[1].preview, null);
        assert(!JSON.stringify(bundle).includes("PRIVATE DRAFT"));
        await repo.transaction((tx) => tx.put("products", member));
      },
    );
    await t.test(
      "admin related-product order precedes category and tag fallback",
      async () => {
        const product = (await repo.get("products", "aurora"))!;
        await repo.transaction((tx) =>
          tx.put("products", {
            ...product,
            published: {
              ...product.published!,
              relatedIds: ["studio-bundle", "light-leaks"],
            },
          }),
        );
        const response = await fetch(`${origin}/api/products/aurora`);
        const result = await response.json();
        assert.deepEqual(
          result.related.slice(0, 2).map((p: { id: string }) => p.id),
          ["studio-bundle", "light-leaks"],
        );
        await repo.transaction((tx) => tx.put("products", product));
      },
    );
    await t.test(
      "unprocessed secondary and exclusive component videos cannot bypass watermark processing",
      async () => {
        const product = (await repo.get("products", "aurora"))!;
        const preview = {
          id: "unprocessed",
          type: "video" as const,
          url: "https://example.test/raw.mp4",
          poster: "",
          label: { vi: "Raw", en: "Raw" },
        };
        const draft = await saveDraft(
          repo,
          actor,
          product.id,
          { ...product.draft, media: [...product.draft.media, preview] },
          product.revision,
        );
        await assert.rejects(
          publishProduct(repo, actor, draft.id, draft.revision, false),
          { code: "PREVIEW_NOT_READY" },
        );
        const bundle = (await repo.get("offers", "studio-bundle-standard"))!;
        await assert.rejects(
          addOffer(repo, actor, {
            ...bundle,
            id: "unsafe-preview",
            items: bundle.items.map((item) => ({ ...item, preview })),
          }),
          { code: "PREVIEW_NOT_READY" },
        );
        const restored = await saveDraft(
          repo,
          actor,
          product.id,
          product.draft,
          draft.revision,
        );
        await publishProduct(
          repo,
          actor,
          restored.id,
          restored.revision,
          false,
        );
      },
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await local.close();
    if (
      path.resolve(directory).startsWith(path.resolve(os.tmpdir()) + path.sep)
    )
      await rm(directory, { recursive: true, force: true });
  }
});
