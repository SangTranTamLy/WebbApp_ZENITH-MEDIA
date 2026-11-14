import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  ownershipKey,
  type Actor,
  type Entitlement,
  type Offer,
  type Order,
  type Quote,
} from "@zenith/shared";
import { connectLocal } from "../src/db/local.js";
import { seedDemo } from "../src/demo/seed.js";
import { DemoStorage } from "../src/demo/storage.js";
import { loadConfig } from "../src/config.js";
import { createApp } from "../src/app.js";
import { quoteCart } from "../src/domain/pricing.js";
import { confirmPayment, createOrder } from "../src/services/commerce.js";
import {
  addOffer,
  publishProduct,
  saveDraft,
} from "../src/services/catalog.js";
import {
  claimJob,
  createJob,
  downloadFile,
  finishJob,
  heartbeat,
  restoreFile,
} from "../src/services/media.js";

const admin: Actor = {
  id: "demo-admin",
  name: "Admin",
  email: "admin@example.test",
  verified: true,
  admin: true,
};
const customer: Actor = {
  id: "demo-customer",
  name: "Customer",
  email: "customer@example.test",
  verified: true,
  admin: false,
};
const config = loadConfig({
  SHOP_DEMO: "true",
  SHOP_MB_ACCOUNT: "DEMO",
  SHOP_MB_NAME: "Demo",
  SHOP_WORKER_SECRET: "test-worker-secret-with-32-characters",
});

test("commerce, ownership and security integration against PostgreSQL", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "zenith-tests-"));
  const local = await connectLocal();
  const repo = local.repository;
  const storage = new DemoStorage(directory);
  await seedDemo(repo, storage);
  const app = createApp(repo, config, storage);
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  const request = async (
    route: string,
    token = "demo-customer",
    method = "GET",
    body?: unknown,
  ) => {
    const response = await fetch(`${origin}/api${route}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, data: await response.json() };
  };
  await request("/me");
  await request("/me", "demo-admin");
  await request("/me", "demo-other");
  const checkout = (
    offerIds: string[],
    extras: Record<string, unknown> = {},
  ) => ({
    offerIds,
    coupon: "",
    acceptedTerms: true as const,
    termsVersion: "draft-2026-11",
    idempotencyKey: randomUUID(),
    ...extras,
  });
  let bought: Order;
  try {
    await t.test(
      "catalog never exposes private object keys or checksums",
      async () => {
        const result = await request("/catalog");
        assert.equal(result.status, 200);
        const output = JSON.stringify(result.data);
        assert(!output.includes("demo/sample.mp4"));
        assert(!output.includes("sha256"));
        assert.equal(result.data.products.length, 6);
      },
    );
    await t.test(
      "spoofed admin or anonymous callers are rejected",
      async () => {
        assert.equal((await request("/admin/overview")).status, 403);
        assert.equal(
          (await request("/admin/overview", "fake-admin")).status,
          401,
        );
      },
    );
    await t.test("unverified users cannot checkout", async () => {
      const result = await request(
        "/orders",
        "demo-unverified",
        "POST",
        checkout(["aurora-standard"]),
      );
      assert.equal(result.status, 403);
      assert.equal(result.data.error.code, "EMAIL_UNVERIFIED");
    });
    await t.test(
      "hiding a parent category hides descendants and blocks direct checkout",
      async () => {
        const category = (await repo.get("categories", "video"))!;
        await request("/admin/categories/video", "demo-admin", "PUT", {
          ...category,
          active: false,
        });
        const catalog = (await request("/catalog")).data;
        assert(
          !catalog.products.some((p: { id: string }) => p.id === "aurora"),
        );
        assert(
          !catalog.categories.some(
            (c: { id: string }) => c.id === "flowframes",
          ),
        );
        assert.equal((await request("/products/aurora")).status, 404);
        assert.equal(
          (
            await request(
              "/orders",
              "demo-customer",
              "POST",
              checkout(["aurora-standard"]),
            )
          ).data.error.code,
          "PRODUCT_UNAVAILABLE",
        );
        await request("/admin/categories/video", "demo-admin", "PUT", category);
        assert.equal(
          (
            await request("/admin/categories/video", "demo-admin", "PUT", {
              ...category,
              parentId: "ae",
            })
          ).data.error.code,
          "INVALID_PARENT",
        );
      },
    );
    await t.test(
      "Bundle cannot credit the same content twice through repriced offer IDs",
      async () => {
        const original = (await repo.get("offers", "aurora-standard"))!;
        const repriced = {
          ...original,
          id: "aurora-repriced-check",
          priceVnd: 150000,
        };
        await addOffer(repo, admin, repriced);
        const bundle = (await repo.get("offers", "studio-bundle-standard"))!;
        await assert.rejects(
          addOffer(repo, admin, {
            ...bundle,
            id: "duplicate-rights-bundle",
            items: [
              { ...bundle.items[0], offerId: original.id },
              { ...bundle.items[0], offerId: repriced.id },
            ],
          }),
          { code: "DUPLICATE_COMPONENT" },
        );
      },
    );
    await t.test(
      "duplicate cart options and overlapping bundle content are blocked",
      async () => {
        assert.equal(
          (
            await request("/quote", "demo-customer", "POST", {
              offerIds: ["aurora-standard", "aurora-standard"],
            })
          ).data.error.code,
          "DUPLICATE_CART",
        );
        assert.equal(
          (
            await request("/quote", "demo-customer", "POST", {
              offerIds: ["aurora-standard", "studio-bundle-standard"],
            })
          ).data.error.code,
          "CART_OVERLAP",
        );
      },
    );
    await t.test("server ignores forged checkout prices", async () => {
      const result = await request(
        "/orders",
        "demo-customer",
        "POST",
        checkout(["aurora-standard"], { totalVnd: 1, priceVnd: 1 }),
      );
      assert.equal(result.status, 201);
      assert.equal(result.data.totalVnd, 120000);
      bought = result.data;
      assert.equal((await repo.list("entitlements")).length, 0);
    });
    await t.test(
      "same request is idempotent and changed payload is rejected",
      async () => {
        const input = {
          ...checkout(["aurora-standard"]),
          idempotencyKey: bought.idempotencyKey,
        };
        assert.equal(
          (await request("/orders", "demo-customer", "POST", input)).data.id,
          bought.id,
        );
        assert.equal(
          (
            await request("/orders", "demo-customer", "POST", {
              ...input,
              offerIds: ["blue-hour-standard"],
            })
          ).data.error.code,
          "IDEMPOTENCY_CONFLICT",
        );
      },
    );
    await t.test(
      "pending orders cannot silently duplicate a purchase",
      async () => {
        assert.equal(
          (
            await request(
              "/orders",
              "demo-customer",
              "POST",
              checkout(["aurora-standard"]),
            )
          ).data.error.code,
          "ORDER_PENDING",
        );
      },
    );
    await t.test("orders enforce object ownership", async () => {
      assert.equal(
        (await request(`/orders/${bought.id}`, "demo-other")).status,
        404,
      );
      assert.equal(
        (await request(`/orders/${bought.id}/report`, "demo-other", "POST"))
          .status,
        404,
      );
    });
    await t.test("reporting a transfer never grants ownership", async () => {
      const result = await request(
        `/orders/${bought.id}/report`,
        "demo-customer",
        "POST",
      );
      assert.equal(result.data.status, "reported");
      assert.equal((await repo.list("entitlements")).length, 0);
      assert.equal(
        (await request("/downloads/demo-clip", "demo-customer", "POST")).status,
        404,
      );
    });
    await t.test(
      "only admin can verify payment and mismatched amounts require explicit resolution",
      async () => {
        const input = {
          bankReference: "BANK-001",
          amountVnd: 1,
          note: "",
          exception: false,
        };
        assert.equal(
          (
            await request(
              `/admin/orders/${bought.id}/confirm`,
              "demo-customer",
              "POST",
              input,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request(
              `/admin/orders/${bought.id}/confirm`,
              "demo-admin",
              "POST",
              input,
            )
          ).data.error.code,
          "PAYMENT_EXCEPTION",
        );
      },
    );
    await t.test(
      "concurrent confirmations grant entitlement and payment once",
      async () => {
        const input = {
          bankReference: "BANK-001",
          amountVnd: 120000,
          note: "Checked bank statement",
          exception: false,
        };
        const result = await Promise.all([
          confirmPayment(repo, admin, bought.id, input),
          confirmPayment(repo, admin, bought.id, input),
        ]);
        assert(result.every((o) => o.status === "paid"));
        assert.equal((await repo.list("payments")).length, 1);
        assert.equal((await repo.list("entitlements")).length, 1);
        assert.equal(
          (await repo.list("outbox")).filter((o) => o.channel === "email")
            .length,
          1,
        );
      },
    );
    await t.test(
      "library and downloads are scoped to the authenticated owner",
      async () => {
        const mine = await request("/library"),
          other = await request("/library", "demo-other");
        assert.equal(mine.data.entitlements.length, 1);
        assert.equal(other.data.entitlements.length, 0);
        assert(!JSON.stringify(mine.data).includes("demo/sample.mp4"));
        assert.equal(
          (await request("/downloads/demo-clip", "demo-other", "POST")).status,
          404,
        );
        const download = await request(
          "/downloads/demo-clip",
          "demo-customer",
          "POST",
        );
        assert.equal(download.status, 200);
        assert.equal(download.data.expiresIn, 300);
        assert.equal((await repo.list("downloads")).length, 1);
      },
    );
    await t.test(
      "owned option cannot be bought again; bundle credits apply to exact rights",
      async () => {
        assert.equal(
          (
            await request("/quote", "demo-customer", "POST", {
              offerIds: ["aurora-standard"],
            })
          ).data.error.code,
          "ALREADY_OWNED",
        );
        const quote = await request("/quote", "demo-customer", "POST", {
          offerIds: ["studio-bundle-standard"],
          coupon: "STUDIO10",
        });
        assert.equal(quote.data.ownershipDiscountVnd, 80000);
        assert.equal(quote.data.couponDiscountVnd, 31000);
        assert.equal(quote.data.totalVnd, 279000);
      },
    );
    await t.test(
      "coupon validity, usage reservations and stacking are enforced",
      async () => {
        const original = (await repo.get("coupons", "studio10"))!;
        await repo.transaction((tx) =>
          tx.put("coupons", { ...original, stackOwnership: false }),
        );
        assert.equal(
          (
            await request("/quote", "demo-customer", "POST", {
              offerIds: ["studio-bundle-standard"],
              coupon: "STUDIO10",
            })
          ).data.error.code,
          "COUPON_STACKING",
        );
        await repo.transaction((tx) =>
          tx.put("coupons", {
            ...original,
            endsAt: "2020-02-01T00:00:00.000Z",
          }),
        );
        assert.equal(
          (
            await request("/quote", "demo-customer", "POST", {
              offerIds: ["blue-hour-standard"],
              coupon: "STUDIO10",
            })
          ).data.error.code,
          "INVALID_COUPON",
        );
        await repo.transaction((tx) => tx.put("coupons", original));
      },
    );
    await t.test("a bank transaction cannot pay a second order", async () => {
      const second = await createOrder(
        repo,
        config,
        customer,
        checkout(["blue-hour-standard"]),
      );
      await assert.rejects(
        confirmPayment(repo, admin, second.id, {
          bankReference: "BANK-001",
          amountVnd: 150000,
          note: "",
          exception: false,
        }),
        { code: "REFERENCE_USED" },
      );
    });
    await t.test(
      "tickets cannot reference other customers orders and remain private",
      async () => {
        assert.equal(
          (
            await request("/tickets", "demo-other", "POST", {
              orderId: bought.id,
              subject: "Help",
              body: "Please help",
              fileIds: [],
            })
          ).status,
          404,
        );
        const ticket = await request("/tickets", "demo-customer", "POST", {
          orderId: bought.id,
          subject: "Download help",
          body: "Need help with the clip",
          fileIds: [],
        });
        assert.equal(ticket.status, 201);
        assert.equal(
          (await request(`/tickets/${ticket.data.id}`, "demo-other")).status,
          404,
        );
        assert.equal(
          (
            await request(
              `/tickets/${ticket.data.id}/messages`,
              "demo-other",
              "POST",
              { body: "Attack", fileIds: [] },
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await request(
              `/tickets/${ticket.data.id}`,
              "demo-customer",
              "PATCH",
              { status: "closed" },
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(
              `/tickets/${ticket.data.id}/messages`,
              "demo-customer",
              "POST",
              { body: "Reply", fileIds: [] },
            )
          ).data.error.code,
          "TICKET_CLOSED",
        );
        assert.equal(
          (
            await request(`/tickets/${ticket.data.id}`, "demo-admin", "PATCH", {
              status: "open",
            })
          ).status,
          200,
        );
      },
    );
    await t.test("notification operations enforce ownership", async () => {
      const notification = (
        await repo.list("notifications", "userId", customer.id)
      )[0];
      assert.equal(
        (
          await request(
            `/notifications/${notification.id}`,
            "demo-other",
            "DELETE",
          )
        ).status,
        404,
      );
      assert.equal(
        (
          await request(
            `/notifications/${notification.id}`,
            "demo-customer",
            "PATCH",
            { read: true },
          )
        ).status,
        200,
      );
    });
    await t.test(
      "draft editing does not modify published content and uses revision checks",
      async () => {
        const p = (await repo.get("products", "aurora"))!;
        await saveDraft(
          repo,
          admin,
          p.id,
          {
            ...p.draft,
            title: { vi: "New draft", en: "New draft" },
            mainPreviewJobId: null,
          },
          p.revision,
        );
        assert.equal(
          (await repo.get("products", p.id))?.published?.title.vi,
          p.published?.title.vi,
        );
        await assert.rejects(
          saveDraft(repo, admin, p.id, p.draft, p.revision),
          { code: "DRAFT_CONFLICT" },
        );
        await assert.rejects(
          publishProduct(repo, admin, p.id, p.revision + 1, false),
          { code: "PREVIEW_NOT_READY" },
        );
      },
    );
    await t.test(
      "sold files cannot be deleted; hidden products remain downloadable",
      async () => {
        assert.equal(
          (await request("/admin/files/demo-clip", "demo-admin", "DELETE")).data
            .error.code,
          "FILE_REFERENCED",
        );
        await request("/admin/products/aurora/status", "demo-admin", "PATCH", {
          status: "hidden",
        });
        assert.equal((await request("/products/aurora")).status, 404);
        assert.equal(
          (await request("/downloads/demo-clip", "demo-customer", "POST"))
            .status,
          200,
        );
      },
    );
    await t.test(
      "offer and order snapshots are immutable at the database boundary",
      async () => {
        const offer = (await repo.get("offers", "aurora-standard"))!;
        await assert.rejects(
          repo.transaction((tx) => tx.put("offers", { ...offer, priceVnd: 1 })),
        );
        await assert.rejects(
          repo.transaction(async (tx) => {
            const o = (await tx.get("orders", bought.id))!;
            await tx.put("orders", { ...o, totalVnd: 0 });
          }),
        );
        assert.equal((await repo.get("orders", bought.id))!.totalVnd, 120000);
      },
    );
    await t.test(
      "worker secrets do not grant admin access and missing tokens fail",
      async () => {
        assert.equal(
          (await request("/worker/claim", "demo-admin", "POST")).status,
          403,
        );
        assert.equal(
          (await request("/admin/overview", config.workerSecret)).status,
          401,
        );
      },
    );
    await t.test(
      "worker leases survive a crash and stale workers cannot complete jobs",
      async () => {
        const created = await repo.transaction((tx) =>
          createJob(tx, "demo-clip", "verify"),
        );
        const first = (await claimJob(repo, storage))!;
        assert.equal(first.job.id, created.id);
        await repo.transaction(async (tx) => {
          const job = (await tx.get("jobs", created.id))!;
          await tx.put("jobs", {
            ...job,
            leaseUntil: "2000-01-01T00:00:00.000Z",
          });
        });
        const reclaimed = (await claimJob(repo, storage))!;
        assert.notEqual(reclaimed.job.leaseToken, first.job.leaseToken);
        await assert.rejects(
          heartbeat(repo, created.id, first.job.leaseToken!),
          { code: "LEASE_LOST" },
        );
        await assert.rejects(
          finishJob(repo, storage, created.id, first.job.leaseToken!, {
            sha256: "0".repeat(64),
          }),
          { code: "LEASE_LOST" },
        );
        assert.equal(
          (await heartbeat(repo, created.id, reclaimed.job.leaseToken!)).status,
          "processing",
        );
      },
    );
    await t.test(
      "free updates preserve old rights and are granted to late-paid old orders",
      async () => {
        const original = (await repo.get("offers", "type-motion-standard"))!;
        const pending = await createOrder(
          repo,
          config,
          customer,
          checkout([original.id]),
        );
        const next = {
          ...original,
          id: "type-motion-v2",
          release: "2.0",
          freeFromOfferIds: [original.id],
        };
        const p = (await repo.get("products", "type-motion"))!;
        await repo.transaction((tx) => tx.put("offers", next));
        const saved = await saveDraft(
          repo,
          admin,
          p.id,
          { ...p.draft, offerIds: [next.id] },
          p.revision,
        );
        await publishProduct(repo, admin, p.id, saved.revision, false);
        await confirmPayment(repo, admin, pending.id, {
          bankReference: "BANK-AE",
          amountVnd: 240000,
          note: "Verified",
          exception: false,
        });
        const owned = await repo.list("entitlements", "userId", customer.id);
        assert(owned.some((e) => e.offerId === original.id));
        assert(
          owned.some(
            (e) => e.offerId === next.id && e.source === "free-update",
          ),
        );
      },
    );
    await t.test(
      "missing files trigger alerts and wrong backups cannot replace sold content",
      async () => {
        const original = (await repo.get("files", "demo-clip"))!;
        await storage.copy("products", original.key, "backup/sample.mp4");
        await repo.transaction((tx) =>
          tx.put("files", {
            ...original,
            id: "verified-backup",
            key: "backup/sample.mp4",
          }),
        );
        await storage.remove("products", "demo/sample.mp4");
        await assert.rejects(
          downloadFile(repo, storage, customer, "demo-clip"),
          { code: "OBJECT_MISSING" },
        );
        assert.equal((await repo.get("files", "demo-clip"))!.status, "missing");
        assert(
          (await repo.list("outbox")).some((o) => o.event === "file-missing"),
        );
        await assert.rejects(
          restoreFile(repo, storage, admin, "demo-clip", "demo-readme"),
          { code: "RESTORE_MISMATCH" },
        );
        await restoreFile(repo, storage, admin, "demo-clip", "verified-backup");
        assert.equal((await repo.get("files", "demo-clip"))!.status, "ready");
        assert.equal(
          (await storage.head("products", original.key)).size,
          original.size,
        );
        assert(
          (await repo.list("notifications", "userId", customer.id)).some(
            (notice) => notice.title.en === "File restored",
          ),
        );
        assert((await downloadFile(repo, storage, customer, "demo-clip")).url);
      },
    );
    await t.test(
      "account deletion requires password/email challenge and retains transaction evidence",
      async () => {
        const target = "demo-other";
        const before = await repo.list("orders", "userId", target);
        const adminBody = {
          confirm: true,
          retentionNote:
            "Test retention policy: preserve order records for audit review.",
        };
        assert.equal(
          (
            await request(
              `/admin/accounts/${target}/delete`,
              "demo-admin",
              "POST",
              adminBody,
            )
          ).data.error.code,
          "NO_DELETION_REQUEST",
        );
        assert.equal(
          (
            await request("/account/deletion/confirm", target, "POST", {
              token: "123456",
            })
          ).data.error.code,
          "CHALLENGE_EXPIRED",
        );
        assert.equal(
          (
            await request("/account/deletion/request", target, "POST", {
              password: "demo-password",
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await request("/account/deletion/confirm", target, "POST", {
              token: "000000",
            })
          ).data.error.code,
          "INVALID_OTP",
        );
        assert.equal(
          (
            await request("/account/deletion/confirm", target, "POST", {
              token: "123456",
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await request(
              `/admin/accounts/${target}/delete`,
              "demo-customer",
              "POST",
              adminBody,
            )
          ).status,
          403,
        );
        const deleted = await request(
          `/admin/accounts/${target}/delete`,
          "demo-admin",
          "POST",
          adminBody,
        );
        assert.equal(deleted.status, 200);
        assert(deleted.data.deletionProcessedAt);
        assert.equal(deleted.data.email, "");
        assert.equal(
          (await request("/me", target)).data.error.code,
          "ACCOUNT_BLOCKED",
        );
        assert.equal(
          (
            await request(`/admin/accounts/${target}`, "demo-admin", "PATCH", {
              blocked: false,
            })
          ).data.error.code,
          "ACCOUNT_DELETED",
        );
        assert.equal(
          (
            await request(
              `/admin/accounts/${target}/delete`,
              "demo-admin",
              "POST",
              adminBody,
            )
          ).data.deletionProcessedAt,
          deleted.data.deletionProcessedAt,
        );
        assert.deepEqual(await repo.list("orders", "userId", target), before);
        assert.equal(
          (await repo.list("notifications", "userId", target)).length,
          0,
        );
      },
    );
    await t.test(
      "Supabase client roles cannot read private commerce tables",
      async () => {
        await local.client.exec("create role authenticated");
        await local.client.exec("set role authenticated");
        try {
          await assert.rejects(local.client.query("select * from shop.orders"));
        } finally {
          await local.client.exec("reset role");
        }
        const rls = await local.client.query<{ relrowsecurity: boolean }>(
          "select relrowsecurity from pg_class where relnamespace='shop'::regnamespace and relname='orders'",
        );
        assert.equal(rls.rows[0].relrowsecurity, true);
      },
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await local.close();
    if (
      path.resolve(directory).startsWith(path.resolve(os.tmpdir()) + path.sep)
    )
      await rm(directory, { recursive: true, force: true });
  }
});

test("pricing handles ownership precision, upgrades, rounding and zero floors", async (t) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "zenith-pricing-"));
  const local = await connectLocal();
  const repo = local.repository;
  await seedDemo(repo, new DemoStorage(directory));
  const products = await repo.list("products"),
    offers = await repo.list("offers"),
    coupons = await repo.list("coupons");
  const quote = (
    offerIds: string[],
    extra: Partial<Parameters<typeof quoteCart>[0]> = {},
  ) =>
    quoteCart({
      offerIds,
      actor: customer,
      coupon: "",
      products,
      offers,
      coupons,
      entitlements: [],
      orders: [],
      now: new Date(),
      ...extra,
    });
  const ownership = (offerId: string): Entitlement => ({
    id: "owned",
    userId: customer.id,
    orderId: "previous",
    productId: "aurora",
    offerId,
    line: {
      ...quote(["aurora-standard"]).lines[0],
      offerId,
      rights: [
        ownershipKey(
          offers.find((o) => o.id === offerId) ?? {
            productId: offerId,
            quality: "",
            release: "",
          },
        ),
      ],
    },
    createdAt: new Date().toISOString(),
    source: "purchase",
  });
  try {
    await t.test("unrelated ownership does not reduce bundle price", () => {
      assert.equal(
        quote(["studio-bundle-standard"], {
          entitlements: [ownership("light-leaks-standard")],
        }).totalVnd,
        390000,
      );
    });
    await t.test(
      "different quality does not receive a matching-content credit",
      () => {
        assert.equal(
          quote(["studio-bundle-standard"], {
            entitlements: [ownership("aurora-4k")],
          }).ownershipDiscountVnd,
          0,
        );
      },
    );
    await t.test("credits cannot create negative totals", () => {
      const configured = structuredClone(offers);
      configured.find(
        (o) => o.id === "studio-bundle-standard",
      )!.items[0].creditVnd = 1000000;
      assert.equal(
        quote(["studio-bundle-standard"], {
          offers: configured,
          entitlements: [ownership("aurora-standard")],
        }).totalVnd,
        0,
      );
    });
    await t.test("per-product upgrade price is applied on the server", () => {
      const configured = structuredClone(offers);
      configured.find((o) => o.id === "aurora-standard")!.upgrades = [
        { fromOfferId: "aurora-legacy", priceVnd: 45000 },
      ];
      configured.push({
        ...offers[0],
        id: "aurora-legacy",
        productId: "aurora-legacy",
        release: "",
        quality: "",
      });
      const q = quote(["aurora-standard"], {
        offers: configured,
        entitlements: [ownership("aurora-legacy")],
      });
      assert.equal(q.upgradeDiscountVnd, 75000);
      assert.equal(q.totalVnd, 45000);
    });
    await t.test("fixed discount allocation conserves every VND", () => {
      const coupon = { ...coupons[0], kind: "fixed" as const, value: 100001 };
      const q = quote(["aurora-standard", "blue-hour-standard"], {
        coupon: "STUDIO10",
        coupons: [coupon],
      });
      assert.equal(q.totalVnd, 169999);
      assert.equal(
        q.lines.reduce((n, l) => n + l.couponDiscountVnd, 0),
        100001,
      );
      assert(
        q.lines.every(
          (l) => Number.isSafeInteger(l.totalVnd) && l.totalVnd >= 0,
        ),
      );
    });
    await t.test(
      "coupon reservations include reported orders even after QR expiry",
      () => {
        const coupon = { ...coupons[0], maxUses: 1 };
        const order = {
          id: "reserved",
          userId: "other",
          couponId: coupon.id,
          status: "reported",
          expiresAt: "2000-01-01T00:00:00.000Z",
        } as Order;
        assert.throws(
          () =>
            quote(["aurora-standard"], {
              coupon: "STUDIO10",
              coupons: [coupon],
              orders: [order],
            }),
          { code: "COUPON_LIMIT" },
        );
      },
    );
    await t.test(
      "repricing the same quality/release never creates a new purchasable right",
      () => {
        const original = offers.find((o) => o.id === "aurora-standard")!;
        const replacement = {
          ...original,
          id: "aurora-repriced",
          priceVnd: 160000,
        };
        const configured = structuredClone(products);
        configured.find((p) => p.id === "aurora")!.published!.offerIds = [
          "aurora-repriced",
        ];
        assert.throws(
          () =>
            quote(["aurora-repriced"], {
              products: configured,
              offers: [...offers, replacement],
              entitlements: [ownership(original.id)],
            }),
          { code: "ALREADY_OWNED" },
        );
      },
    );
    await t.test("zero total coupons are deterministic", () => {
      const configured = structuredClone(offers);
      configured.find((o) => o.id === "aurora-standard")!.priceVnd = 0;
      const q = quote(["aurora-standard"], {
        offers: configured,
        coupon: "STUDIO10",
      });
      assert.equal(q.totalVnd, 0);
      assert.equal(q.couponDiscountVnd, 0);
    });
  } finally {
    await local.close();
    if (
      path.resolve(directory).startsWith(path.resolve(os.tmpdir()) + path.sep)
    )
      await rm(directory, { recursive: true, force: true });
  }
});
