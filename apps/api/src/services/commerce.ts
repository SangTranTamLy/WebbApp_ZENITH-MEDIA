import { createHash, randomUUID } from "node:crypto";
import type { Actor, CheckoutInput, Order, Quote } from "@zenith/shared";
import type { Repository } from "../db/repository.js";
import type { Config } from "../config.js";
import { requireCondition } from "../domain/errors.js";
import { quoteCart } from "../domain/pricing.js";
import { categoryIsVisible } from "../domain/categories.js";
import { audit, bilingual, enqueue, notify, nowIso } from "./events.js";
import { grantPublishedFreeUpdates } from "./entitlements.js";

export async function calculateQuote(
  repo: Repository,
  actor: Actor,
  offerIds: string[],
  coupon = "",
): Promise<Quote> {
  const [products, offers, entitlements, coupons, orders, categories] =
    await Promise.all([
      repo.list("products"),
      repo.list("offers"),
      repo.list("entitlements", "userId", actor.id),
      repo.list("coupons"),
      repo.list("orders"),
      repo.list("categories"),
    ]);
  return quoteCart({
    actor,
    offerIds,
    coupon,
    products: products.filter(
      (product) =>
        product.published &&
        categoryIsVisible(product.published.categoryId, categories),
    ),
    offers,
    entitlements,
    coupons,
    orders,
    now: new Date(),
  });
}
export async function createOrder(
  repo: Repository,
  config: Config,
  actor: Actor,
  input: CheckoutInput,
) {
  requireCondition(
    actor.verified,
    "EMAIL_UNVERIFIED",
    "Vui lòng xác minh email trước khi thanh toán.",
    403,
  );
  const requestHash = createHash("sha256")
    .update(
      JSON.stringify({
        offerIds: [...input.offerIds].sort(),
        coupon: input.coupon.trim().toUpperCase(),
        termsVersion: input.termsVersion,
      }),
    )
    .digest("hex");
  return repo.transaction(async (tx) => {
    const previous = (await tx.list("orders", "userId", actor.id)).find(
      (o) => o.idempotencyKey === input.idempotencyKey,
    );
    if (previous) {
      requireCondition(
        previous.requestHash === requestHash,
        "IDEMPOTENCY_CONFLICT",
        "Yêu cầu này đã được sử dụng cho giỏ hàng khác.",
        409,
      );
      return previous;
    }
    const settings = await tx.get("settings", "store");
    requireCondition(
      settings?.checkoutEnabled && settings.legalReviewed,
      "CHECKOUT_DISABLED",
      "Cửa hàng chưa mở thanh toán.",
      503,
    );
    requireCondition(
      input.termsVersion === settings.termsVersion,
      "TERMS_CHANGED",
      "Điều khoản đã được cập nhật. Vui lòng đọc và xác nhận lại.",
      409,
    );
    requireCondition(
      config.bankAccount && config.bankName,
      "BANK_NOT_CONFIGURED",
      "Thông tin chuyển khoản chưa được cấu hình.",
      503,
    );
    const quote = await calculateQuote(tx, actor, input.offerIds, input.coupon);
    const active = (await tx.list("orders", "userId", actor.id)).filter(
      (o) =>
        ["reported", "support"].includes(o.status) ||
        (o.status === "pending" && new Date(o.expiresAt) > new Date()),
    );
    const conflict = active.find((o) =>
      o.lines.some((l) =>
        quote.lines.some((q) => q.rights.some((r) => l.rights.includes(r))),
      ),
    );
    requireCondition(
      !conflict,
      "ORDER_PENDING",
      "Bạn đã có đơn chờ xử lý cho nội dung này. Hãy mở đơn hàng hiện có.",
      409,
      { orderId: conflict?.id },
    );
    for (const line of quote.lines)
      for (const id of line.fileIds) {
        const file = await tx.get("files", id);
        requireCondition(
          file?.status === "ready",
          "FILE_UNAVAILABLE",
          "Tệp sản phẩm đang được khôi phục. Vui lòng thử lại sau.",
          409,
        );
      }
    const time = nowIso();
    const order: Order = {
      ...quote,
      id: `ZM${randomUUID().replaceAll("-", "").slice(0, 20).toUpperCase()}`,
      userId: actor.id,
      email: actor.email,
      status: "pending",
      createdAt: time,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      reportedAt: null,
      paidAt: null,
      idempotencyKey: input.idempotencyKey,
      requestHash,
      termsVersion: settings.termsVersion,
      bank: {
        account: config.bankAccount,
        name: config.bankName,
        bin: config.bankBin,
      },
      notes: [],
    };
    await tx.put("orders", order);
    await tx.put("carts", { id: actor.id, offerIds: [], updatedAt: time });
    if (order.totalVnd === 0)
      return settleOrder(
        tx,
        actor,
        order,
        {
          bankReference: `FREE-${order.id}`,
          amountVnd: 0,
          note: "Zero-value checkout validated by server",
          exception: false,
        },
        true,
      );
    return order;
  });
}
export function visibleOrder(order: Order): Order {
  return order.status === "pending" && new Date(order.expiresAt) < new Date()
    ? { ...order, status: "expired" }
    : order;
}
export async function getOrder(repo: Repository, actor: Actor, id: string) {
  const order = await repo.get("orders", id);
  requireCondition(
    order && (actor.admin || order.userId === actor.id),
    "NOT_FOUND",
    "Không tìm thấy đơn hàng.",
    404,
  );
  return visibleOrder(order);
}
export async function reportTransfer(
  repo: Repository,
  actor: Actor,
  id: string,
) {
  return repo.transaction(async (tx) => {
    const order = await getOrder(tx, actor, id);
    if (["reported", "paid"].includes(order.status)) return order;
    requireCondition(
      order.status === "pending",
      "ORDER_EXPIRED",
      "Đơn đã hết thời hạn. Nếu đã chuyển khoản, hãy tạo Ticket hỗ trợ.",
      409,
    );
    const updated = await tx.put("orders", {
      ...order,
      status: "reported",
      reportedAt: nowIso(),
    });
    await enqueue(
      tx,
      "payment-reported",
      "admin-discord",
      "Có đơn chờ xác nhận",
      `Đơn ${id}. Đối chiếu giao dịch MB Bank trước khi xác nhận.`,
      `/admin/orders/${id}`,
    );
    await audit(tx, actor.id, "transfer-reported", id);
    return updated;
  });
}
export interface Confirmation {
  bankReference: string;
  amountVnd: number;
  note: string;
  exception: boolean;
}
async function settleOrder(
  tx: Repository,
  actor: Actor,
  order: Order,
  input: Confirmation,
  free = false,
) {
  if (order.status === "paid") return order;
  requireCondition(
    actor.admin || free,
    "FORBIDDEN",
    "Chỉ Admin được xác nhận thanh toán.",
    403,
  );
  const exceptional =
    input.amountVnd !== order.totalVnd ||
    (new Date(order.expiresAt) < new Date() && !order.reportedAt);
  requireCondition(
    !exceptional || (input.exception && input.note.trim().length >= 10),
    "PAYMENT_EXCEPTION",
    "Số tiền hoặc thời hạn không khớp. Cần xác nhận ngoại lệ và ghi chú rõ.",
    409,
  );
  const used = (await tx.list("payments")).find(
    (p) => p.bankReference === input.bankReference.trim().toUpperCase(),
  );
  requireCondition(
    !used,
    "REFERENCE_USED",
    "Mã giao dịch ngân hàng đã được dùng cho đơn khác.",
    409,
  );
  const owned = await tx.list("entitlements", "userId", order.userId);
  requireCondition(
    !order.lines.some((l) =>
      owned.some((e) => e.line.rights.includes(l.rights[0])),
    ),
    "OWNERSHIP_CHANGED",
    "Khách đã có quyền này. Cần xử lý giao dịch ngoại lệ trước.",
    409,
  );
  const paidAt = nowIso();
  await tx.put("payments", {
    id: randomUUID(),
    orderId: order.id,
    bankReference: input.bankReference.trim().toUpperCase(),
    amountVnd: input.amountVnd,
    confirmedBy: actor.id,
    confirmedAt: paidAt,
    note: input.note,
  });
  for (const line of order.lines)
    await tx.put("entitlements", {
      id: randomUUID(),
      userId: order.userId,
      orderId: order.id,
      offerId: line.offerId,
      productId: line.productId,
      line,
      createdAt: paidAt,
      source: "purchase",
    });
  await grantPublishedFreeUpdates(tx, order.userId);
  const updated = await tx.put("orders", {
    ...order,
    status: "paid",
    paidAt,
    notes: [...order.notes, ...(input.note ? [input.note] : [])],
  });
  await notify(
    tx,
    order.userId,
    bilingual("Thanh toán thành công", "Payment confirmed"),
    bilingual(
      `Đơn ${order.id} đã hoàn tất. Sản phẩm đã có trong Thư viện.`,
      `Order ${order.id} is complete. Your assets are in My Library.`,
    ),
    "/library",
  );
  await enqueue(
    tx,
    "payment-confirmed",
    "email",
    "ZENITH MEDIA | Thanh toán thành công",
    `Đơn ${order.id} đã hoàn tất. Đăng nhập để mở Thư viện và tải sản phẩm.`,
    "/library",
    order.email,
  );
  await enqueue(
    tx,
    "payment-confirmed",
    "admin-discord",
    "Thanh toán được xác nhận",
    `Đơn ${order.id} đã được xác nhận.`,
    `/admin/orders/${order.id}`,
  );
  await audit(
    tx,
    actor.id,
    free ? "free-checkout" : "payment-confirmed",
    order.id,
    {
      amountVnd: input.amountVnd,
      bankReference: input.bankReference,
      note: input.note,
      exception: exceptional,
    },
  );
  return updated;
}
export async function confirmPayment(
  repo: Repository,
  actor: Actor,
  id: string,
  input: Confirmation,
) {
  requireCondition(
    actor.admin,
    "FORBIDDEN",
    "Chỉ Admin được xác nhận thanh toán.",
    403,
  );
  return repo.transaction(async (tx) =>
    settleOrder(tx, actor, await getOrder(tx, actor, id), input),
  );
}
