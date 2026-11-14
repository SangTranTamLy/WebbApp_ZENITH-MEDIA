import express from "express";
import { categoryIsVisible } from "./domain/categories.js";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import {
  categorySchema,
  checkoutSchema,
  contentSchema,
  couponSchema,
  idSchema,
  moneySchema,
  offerSchema,
  settingsSchema,
  type Actor,
} from "@zenith/shared";
import type { Repository } from "./db/repository.js";
import type { Config } from "./config.js";
import type { Storage } from "./integrations/storage.js";
import { authentication, adminOnly } from "./auth.js";
import { ShopError, requireCondition } from "./domain/errors.js";
import {
  addOffer,
  publicCatalog,
  publishProduct,
  saveDraft,
} from "./services/catalog.js";
import {
  calculateQuote,
  confirmPayment,
  createOrder,
  getOrder,
  reportTransfer,
  visibleOrder,
} from "./services/commerce.js";
import {
  beginUpload,
  claimJob,
  createJob,
  deleteUnusedFile,
  downloadFile,
  finalizeUpload,
  finishJob,
  flagMissing,
  heartbeat,
  restoreFile,
} from "./services/media.js";
import {
  downloadAttachment,
  getTicket,
  openTicket,
  replyTicket,
} from "./services/support.js";
import { audit, nowIso } from "./services/events.js";
import {
  confirmDeletion,
  processDeletion,
  requestDeletion,
} from "./services/account.js";
import { dispatchOutbox } from "./integrations/delivery.js";

export function createApp(repo: Repository, config: Config, storage: Storage) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        callback(null, !origin || origin === config.origin);
      },
      credentials: false,
    }),
  );
  app.use(express.json({ limit: "512kb" }));
  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use(
    "/api",
    rateLimit({
      windowMs: 60_000,
      limit: config.demo ? 2000 : 180,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  app.get("/api/health", async (_req, res) => {
    await repo.get("settings", "store");
    res.json({ ok: true, mode: config.demo ? "demo" : "production" });
  });
  app.get("/api/config", async (_req, res) => {
    const categories = await repo.list("categories");
    res.json({
      settings: await repo.get("settings", "store"),
      categories: categories
        .filter((c) => categoryIsVisible(c.id, categories))
        .sort((a, b) => a.position - b.position),
    });
  });
  app.get("/api/storefront", async (_req, res) => {
    const settings = await repo.get("settings", "store");
    const catalog = (await publicCatalog(repo)).filter(
      (p) => p.status === "active",
    );
    const featuredIds = [...catalog]
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 6)
      .map((p) => p.id);
    const latestIds = [...catalog]
      .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
      .slice(0, 3)
      .map((p) => p.id);
    const heroProductId =
      catalog.find((p) => p.id === settings?.heroProductId)?.id ?? null;
    const bundleId =
      [...catalog]
        .filter((p) => p.kind === "bundle")
        .sort((a, b) => b.priority - a.priority)[0]?.id ?? null;
    const ids = new Set([
      ...featuredIds,
      ...latestIds,
      heroProductId,
      bundleId,
    ]);
    res.json({
      settings,
      products: catalog.filter((p) => ids.has(p.id)),
      featuredIds,
      latestIds,
      heroProductId,
      bundleId,
    });
  });
  app.get("/api/hero", async (_req, res) => {
    const settings = await repo.get("settings", "store");
    res.json({
      product:
        (await publicCatalog(repo)).find(
          (p) => p.id === settings?.heroProductId && p.status === "active",
        ) ?? null,
    });
  });
  app.get("/api/catalog", async (req, res) => {
    let products = (await publicCatalog(repo)).filter(
      (p) => p.status === "active",
    );
    const search = String(req.query.q ?? "").toLocaleLowerCase();
    const category = String(req.query.category ?? "");
    const categories = await repo.list("categories");
    const ids = [
      category,
      ...categories.filter((c) => c.parentId === category).map((c) => c.id),
    ];
    products = products.filter(
      (p) =>
        (!category || ids.includes(p.categoryId)) &&
        (!search ||
          `${p.title.vi} ${p.title.en} ${p.tags.join(" ")}`
            .toLocaleLowerCase()
            .includes(search)),
    );
    const price = (p: (typeof products)[number]) =>
      Math.min(...p.offers.map((o) => o.priceVnd));
    const sort = String(req.query.sort ?? "featured");
    products.sort((a, b) =>
      sort === "price-asc"
        ? price(a) - price(b)
        : sort === "price-desc"
          ? price(b) - price(a)
          : sort === "newest"
            ? (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "")
            : b.priority - a.priority,
    );
    const offset = z.coerce
      .number()
      .int()
      .min(0)
      .max(100000)
      .parse(req.query.offset ?? 0);
    const limit = z.coerce
      .number()
      .int()
      .min(1)
      .max(48)
      .parse(req.query.limit ?? 12);
    res.json({
      products: products.slice(offset, offset + limit),
      total: products.length,
      categories: categories
        .filter((c) => categoryIsVisible(c.id, categories))
        .sort((a, b) => a.position - b.position),
      settings: await repo.get("settings", "store"),
    });
  });
  app.get("/api/products/:slug", async (req, res) => {
    const products = await publicCatalog(repo);
    const product = products.find((p) => p.slug === req.params.slug);
    requireCondition(product, "NOT_FOUND", "Không tìm thấy sản phẩm.", 404);
    const related = products
      .filter((p) => p.id !== product.id && p.status === "active")
      .sort((a, b) => {
        const rank = (id: string) => {
          const index = product.relatedIds.indexOf(id);
          return index < 0 ? product.relatedIds.length : index;
        };
        const tags = (p: typeof product) =>
          p.tags.filter((tag) => product.tags.includes(tag)).length;
        return (
          rank(a.id) - rank(b.id) ||
          Number(b.categoryId === product.categoryId) -
            Number(a.categoryId === product.categoryId) ||
          tags(b) - tags(a) ||
          b.priority - a.priority
        );
      });
    res.json({ product, related: related.slice(0, 4) });
  });
  const worker = express.Router();
  worker.use((req, _res, next) => {
    try {
      const supplied = Buffer.from(
        req.headers.authorization?.replace(/^Bearer /, "") ?? "",
      );
      const expected = Buffer.from(config.workerSecret);
      requireCondition(
        expected.length >= 32 &&
          supplied.length === expected.length &&
          timingSafeEqual(supplied, expected),
        "FORBIDDEN",
        "Worker authentication failed.",
        403,
      );
      next();
    } catch (error) {
      next(error);
    }
  });
  worker.post("/claim", async (_req, res) =>
    res.json(await claimJob(repo, storage)),
  );
  worker.post("/jobs/:id/heartbeat", async (req, res) =>
    res.json(
      await heartbeat(
        repo,
        String(req.params.id),
        z.string().uuid().parse(req.body.token),
      ),
    ),
  );
  worker.post("/jobs/:id/complete", async (req, res) => {
    const data = z
      .object({
        token: z.string().uuid(),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
        error: z.string().max(500).optional(),
        detectedType: z.string().optional(),
        zip: z
          .object({
            status: z.enum(["pending", "valid", "invalid"]),
            errors: z.array(z.string()).max(100),
            warnings: z.array(z.string()).max(100),
            entries: z.array(z.string().max(512)).max(10000),
            acknowledgedBy: z.null(),
          })
          .nullable()
          .optional(),
      })
      .parse(req.body);
    res.json(
      await finishJob(repo, storage, String(req.params.id), data.token, data),
    );
  });
  worker.post("/dispatch", async (_req, res) =>
    res.json({ worked: await dispatchOutbox(repo, config) }),
  );
  app.use("/api/worker", worker);
  app.use("/api", authentication(config, repo));
  const who = (res: express.Response) => res.locals.actor as Actor;
  app.get("/api/me", async (_req, res) => {
    const actor = who(res);
    res.json({
      actor,
      account: await repo.get("accounts", actor.id),
      entitlements: await repo.list("entitlements", "userId", actor.id),
      wishlist: (await repo.get("wishlists", actor.id))?.productIds ?? [],
      cart: (await repo.get("carts", actor.id))?.offerIds ?? [],
      unread: (await repo.list("notifications", "userId", actor.id)).filter(
        (n) => !n.read,
      ).length,
    });
  });
  app.put("/api/account", async (req, res) => {
    const data = z
      .object({
        name: z.string().trim().min(1).max(100),
        lastReleases: z.record(z.string(), z.string()).optional(),
      })
      .parse(req.body);
    res.json(
      await repo.transaction(async (tx) => {
        const account = (await tx.get("accounts", who(res).id))!;
        return tx.put("accounts", {
          ...account,
          name: data.name,
          lastReleases: data.lastReleases ?? account.lastReleases,
        });
      }),
    );
  });
  app.post("/api/account/deletion/request", async (req, res) =>
    res.json(
      await requestDeletion(
        repo,
        config,
        who(res),
        z.string().min(1).max(200).parse(req.body.password),
      ),
    ),
  );
  app.post("/api/account/deletion/confirm", async (req, res) =>
    res.json(
      await confirmDeletion(
        repo,
        config,
        who(res),
        z.string().min(6).max(10).parse(req.body.token),
      ),
    ),
  );
  app.put("/api/cart", async (req, res) => {
    const offerIds = z.array(idSchema).max(30).parse(req.body.offerIds);
    res.json(
      await repo.transaction((tx) =>
        tx.put("carts", {
          id: who(res).id,
          offerIds: [...new Set(offerIds)],
          updatedAt: nowIso(),
        }),
      ),
    );
  });
  app.get("/api/cart/details", async (_req, res) =>
    res.json({ products: await publicCatalog(repo) }),
  );
  app.put("/api/wishlist", async (req, res) =>
    res.json(
      await repo.transaction((tx) =>
        tx.put("wishlists", {
          id: who(res).id,
          productIds: [
            ...new Set(z.array(idSchema).max(300).parse(req.body.productIds)),
          ],
        }),
      ),
    ),
  );
  app.post("/api/quote", async (req, res) => {
    const data = z
      .object({
        offerIds: z.array(idSchema).min(1).max(30),
        coupon: z.string().max(32).default(""),
      })
      .parse(req.body);
    res.json(await calculateQuote(repo, who(res), data.offerIds, data.coupon));
  });
  app.post(
    "/api/orders",
    rateLimit({
      windowMs: 60_000,
      limit: 15,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
    async (req, res) =>
      res
        .status(201)
        .json(
          await createOrder(
            repo,
            config,
            who(res),
            checkoutSchema.parse(req.body),
          ),
        ),
  );
  app.get("/api/orders", async (_req, res) =>
    res.json(
      (await repo.list("orders", "userId", who(res).id))
        .map(visibleOrder)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    ),
  );
  app.get("/api/orders/:id", async (req, res) =>
    res.json(await getOrder(repo, who(res), String(req.params.id))),
  );
  app.post("/api/orders/:id/report", async (req, res) =>
    res.json(await reportTransfer(repo, who(res), String(req.params.id))),
  );
  app.get("/api/library", async (_req, res) => {
    const entitlements = await repo.list("entitlements", "userId", who(res).id);
    const ids = new Set(entitlements.flatMap((e) => e.line.fileIds));
    res.json({
      entitlements,
      files: (await repo.list("files"))
        .filter((f) => ids.has(f.id))
        .map(({ id, name, size, type, status }) => ({
          id,
          name,
          size,
          type,
          status,
        })),
      downloads: await repo.list("downloads", "userId", who(res).id),
    });
  });
  app.post(
    "/api/downloads/:id",
    rateLimit({
      windowMs: 60_000,
      limit: 30,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
    async (req, res) =>
      res.json(
        await downloadFile(repo, storage, who(res), String(req.params.id)),
      ),
  );
  app.get("/api/downloads", async (_req, res) =>
    res.json(
      (await repo.list("downloads", "userId", who(res).id)).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    ),
  );
  app.get("/api/notifications", async (_req, res) =>
    res.json(
      (await repo.list("notifications", "userId", who(res).id)).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    ),
  );
  app.post("/api/notifications/read-all", async (_req, res) => {
    await repo.transaction(async (tx) => {
      for (const n of await tx.list("notifications", "userId", who(res).id))
        await tx.put("notifications", { ...n, read: true });
    });
    res.json({ ok: true });
  });
  app.patch("/api/notifications/:id", async (req, res) => {
    res.json(
      await repo.transaction(async (tx) => {
        const n = await tx.get("notifications", String(req.params.id));
        requireCondition(
          n?.userId === who(res).id,
          "NOT_FOUND",
          "Không tìm thấy thông báo.",
          404,
        );
        return tx.put("notifications", {
          ...n,
          read: z.boolean().parse(req.body.read),
        });
      }),
    );
  });
  app.delete("/api/notifications/:id", async (req, res) => {
    await repo.transaction(async (tx) => {
      const n = await tx.get("notifications", String(req.params.id));
      requireCondition(
        n?.userId === who(res).id,
        "NOT_FOUND",
        "Không tìm thấy thông báo.",
        404,
      );
      await tx.remove("notifications", n.id);
    });
    res.json({ ok: true });
  });
  app.post("/api/uploads", async (req, res) =>
    res.json(
      await beginUpload(
        repo,
        storage,
        who(res),
        z
          .object({
            name: z.string(),
            type: z.string().min(1).max(120),
            size: z.number().int(),
            purpose: z.enum(["product", "preview-source", "attachment"]),
          })
          .parse(req.body),
      ),
    ),
  );
  app.post("/api/uploads/:id/complete", async (req, res) =>
    res.json(
      await finalizeUpload(repo, storage, who(res), String(req.params.id)),
    ),
  );
  app.get("/api/uploads/:id", async (req, res) => {
    const file = await repo.get("files", String(req.params.id));
    requireCondition(
      file && (who(res).admin || file.ownerId === who(res).id),
      "NOT_FOUND",
      "Không tìm thấy file.",
      404,
    );
    res.json({ id: file.id, name: file.name, status: file.status });
  });
  app.get("/api/tickets", async (_req, res) =>
    res.json(
      (await repo.list("tickets", "userId", who(res).id)).sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt),
      ),
    ),
  );
  app.post("/api/tickets", async (req, res) =>
    res.status(201).json(
      await openTicket(
        repo,
        who(res),
        z
          .object({
            orderId: idSchema,
            subject: z.string().trim().min(3).max(180),
            body: z.string().max(10000),
            fileIds: z.array(idSchema).max(5).default([]),
          })
          .parse(req.body),
      ),
    ),
  );
  app.get("/api/tickets/:id", async (req, res) => {
    const ticket = await getTicket(repo, who(res), String(req.params.id));
    res.json({
      ticket,
      messages: (await repo.list("ticketMessages", "ticketId", ticket.id)).sort(
        (a, b) => a.createdAt.localeCompare(b.createdAt),
      ),
    });
  });
  app.post("/api/tickets/:id/messages", async (req, res) => {
    const data = z
      .object({
        body: z.string().max(10000),
        fileIds: z.array(idSchema).max(5).default([]),
      })
      .parse(req.body);
    res.json(
      await replyTicket(
        repo,
        who(res),
        String(req.params.id),
        data.body,
        data.fileIds,
      ),
    );
  });
  app.patch("/api/tickets/:id", async (req, res) => {
    res.json(
      await repo.transaction(async (tx) => {
        const ticket = await getTicket(tx, who(res), String(req.params.id));
        const status = z.enum(["open", "closed"]).parse(req.body.status);
        await audit(tx, who(res).id, `ticket-${status}`, ticket.id);
        return tx.put("tickets", { ...ticket, status, updatedAt: nowIso() });
      }),
    );
  });
  app.post("/api/tickets/:id/files/:fileId", async (req, res) =>
    res.json(
      await downloadAttachment(
        repo,
        storage,
        who(res),
        String(req.params.id),
        String(req.params.fileId),
      ),
    ),
  );
  const admin = express.Router();
  admin.use(adminOnly);
  admin.get("/overview", async (_req, res) => {
    const [orders, products, jobs, files, tickets, outbox, accounts] =
      await Promise.all([
        repo.list("orders"),
        repo.list("products"),
        repo.list("jobs"),
        repo.list("files"),
        repo.list("tickets"),
        repo.list("outbox"),
        repo.list("accounts"),
      ]);
    res.json({
      orders: orders.map(visibleOrder),
      products,
      jobs,
      files,
      tickets,
      accounts,
      outbox,
      settings: await repo.get("settings", "store"),
      categories: await repo.list("categories"),
      offers: await repo.list("offers"),
      coupons: await repo.list("coupons"),
      audit: (await repo.list("audit"))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 100),
    });
  });
  admin.put("/products/:id/draft", async (req, res) => {
    const data = z
      .object({ content: contentSchema, revision: z.number().int().min(0) })
      .parse(req.body);
    res.json(
      await saveDraft(
        repo,
        who(res),
        idSchema.parse(req.params.id),
        data.content,
        data.revision,
      ),
    );
  });
  admin.post("/offers", async (req, res) =>
    res
      .status(201)
      .json(await addOffer(repo, who(res), offerSchema.parse(req.body))),
  );
  admin.post("/products/:id/publish", async (req, res) => {
    const data = z
      .object({
        revision: z.number().int(),
        acknowledgeWarnings: z.boolean().default(false),
      })
      .parse(req.body);
    res.json(
      await publishProduct(
        repo,
        who(res),
        String(req.params.id),
        data.revision,
        data.acknowledgeWarnings,
      ),
    );
  });
  admin.patch("/products/:id/status", async (req, res) =>
    res.json(
      await repo.transaction(async (tx) => {
        const p = await tx.get("products", String(req.params.id));
        requireCondition(p, "NOT_FOUND", "Không tìm thấy sản phẩm.", 404);
        const status = z.enum(["hidden", "retired"]).parse(req.body.status);
        await audit(tx, who(res).id, "product-status", p.id, { status });
        return tx.put("products", { ...p, status, revision: p.revision + 1 });
      }),
    ),
  );
  admin.put("/categories/:id", async (req, res) => {
    const c = categorySchema.parse({ ...req.body, id: req.params.id });
    res.json(
      await repo.transaction(async (tx) => {
        if (c.parentId) {
          const parent = await tx.get("categories", c.parentId);
          requireCondition(
            parent &&
              !parent.parentId &&
              parent.id !== c.id &&
              !(await tx.list("categories")).some(
                (child) => child.parentId === c.id,
              ),
            "INVALID_PARENT",
            "Danh mục chỉ có hai cấp.",
          );
        }
        await audit(tx, who(res).id, "category-saved", c.id);
        return tx.put("categories", c);
      }),
    );
  });
  admin.put("/coupons/:id", async (req, res) => {
    const coupon = couponSchema.parse({ ...req.body, id: req.params.id });
    res.json(
      await repo.transaction(async (tx) => {
        await audit(tx, who(res).id, "coupon-saved", coupon.id);
        return tx.put("coupons", coupon);
      }),
    );
  });
  admin.post("/orders/:id/confirm", async (req, res) =>
    res.json(
      await confirmPayment(
        repo,
        who(res),
        String(req.params.id),
        z
          .object({
            bankReference: z
              .string()
              .trim()
              .min(3)
              .max(100)
              .regex(/^[a-zA-Z0-9_/-]+$/),
            amountVnd: moneySchema,
            note: z.string().max(1000).default(""),
            exception: z.boolean().default(false),
          })
          .parse(req.body),
      ),
    ),
  );
  admin.post("/orders/:id/support", async (req, res) =>
    res.json(
      await repo.transaction(async (tx) => {
        const order = await getOrder(tx, who(res), String(req.params.id));
        requireCondition(
          order.status !== "paid",
          "ORDER_PAID",
          "Đơn đã thanh toán.",
          409,
        );
        const note = z.string().trim().min(5).max(1000).parse(req.body.note);
        await audit(tx, who(res).id, "order-support", order.id, { note });
        return tx.put("orders", {
          ...order,
          status: "support",
          notes: [...order.notes, note],
        });
      }),
    ),
  );
  admin.post("/jobs", async (req, res) => {
    const data = z
      .object({
        fileId: idSchema,
        type: z.enum(["preview", "zip", "verify"]),
        start: z.number().min(0).max(86400).default(0),
        duration: z.number().min(1).max(120).default(10),
      })
      .parse(req.body);
    res.json(
      await repo.transaction((tx) =>
        createJob(tx, data.fileId, data.type, data.start, data.duration),
      ),
    );
  });
  admin.post("/jobs/:id/retry", async (req, res) =>
    res.json(
      await repo.transaction(async (tx) => {
        const job = await tx.get("jobs", String(req.params.id));
        requireCondition(
          job?.status === "failed",
          "JOB_NOT_FAILED",
          "Chỉ xử lý lại tác vụ lỗi.",
          409,
        );
        await audit(tx, who(res).id, "job-retry", job.id);
        return tx.put("jobs", {
          ...job,
          status: "queued",
          error: null,
          leaseToken: null,
          leaseUntil: null,
        });
      }),
    ),
  );
  admin.post("/files/:id/check", async (req, res) => {
    const file = await repo.get("files", String(req.params.id));
    requireCondition(file, "NOT_FOUND", "Không tìm thấy file.", 404);
    try {
      await storage.head(file.bucket, file.key);
      res.json({ ok: true });
    } catch (error) {
      if (error instanceof ShopError && error.code === "OBJECT_MISSING")
        await flagMissing(repo, file);
      throw error;
    }
  });
  admin.post("/files/:id/restore", async (req, res) =>
    res.json(
      await restoreFile(
        repo,
        storage,
        who(res),
        String(req.params.id),
        idSchema.parse(req.body.replacementId),
      ),
    ),
  );
  admin.delete("/files/:id", async (req, res) => {
    await deleteUnusedFile(repo, storage, who(res), String(req.params.id));
    res.json({ ok: true });
  });
  admin.patch("/accounts/:id", async (req, res) =>
    res.json(
      await repo.transaction(async (tx) => {
        requireCondition(
          req.params.id !== who(res).id,
          "ADMIN_SELF_BLOCK",
          "Không thể tự khóa Admin.",
        );
        const account = await tx.get("accounts", String(req.params.id));
        requireCondition(
          account,
          "NOT_FOUND",
          "Không tìm thấy tài khoản.",
          404,
        );
        const blocked = z.boolean().parse(req.body.blocked);
        requireCondition(
          !account.deletionProcessedAt || blocked,
          "ACCOUNT_DELETED",
          "Tài khoản đã xử lý xóa không thể mở khóa.",
          409,
        );
        await audit(tx, who(res).id, "account-status", account.id, { blocked });
        return tx.put("accounts", { ...account, blocked });
      }),
    ),
  );
  admin.post("/accounts/:id/delete", async (req, res) => {
    const input = z
      .object({
        confirm: z.literal(true),
        retentionNote: z.string().trim().min(20).max(2000),
      })
      .parse(req.body);
    res.json(
      await processDeletion(
        repo,
        config,
        who(res),
        String(req.params.id),
        input.retentionNote,
      ),
    );
  });
  admin.put("/settings", async (req, res) => {
    const settings = settingsSchema.parse(req.body);
    res.json(
      await repo.transaction(async (tx) => {
        await audit(tx, who(res).id, "settings-updated", "store");
        return tx.put("settings", settings);
      }),
    );
  });
  admin.post("/outbox/:id/retry", async (req, res) =>
    res.json(
      await repo.transaction(async (tx) => {
        const item = await tx.get("outbox", String(req.params.id));
        requireCondition(
          item?.status === "failed",
          "INVALID_OUTBOX",
          "Chỉ gửi lại thông báo lỗi.",
        );
        return tx.put("outbox", {
          ...item,
          status: "queued",
          attempts: 0,
          nextAt: nowIso(),
        });
      }),
    ),
  );
  app.use("/api/admin", admin);
  app.use("/api", (_req, res) =>
    res
      .status(404)
      .json({ error: { code: "NOT_FOUND", message: "Không tìm thấy API." } }),
  );
  const onError: express.ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: "VALIDATION",
          message: "Dữ liệu chưa hợp lệ.",
          details: error.issues,
        },
      });
      return;
    }
    if (error instanceof ShopError) {
      res.status(error.status).json({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
      return;
    }
    if (error?.type === "entity.parse.failed") {
      res.status(400).json({
        error: {
          code: "INVALID_JSON",
          message: "Nội dung JSON không hợp lệ.",
        },
      });
      return;
    }
    console.error("API failure", error?.code ?? error?.name ?? "unknown");
    res.status(500).json({
      error: { code: "INTERNAL", message: "Có lỗi xử lý. Vui lòng thử lại." },
    });
  };
  app.use(onError);
  return app;
}
