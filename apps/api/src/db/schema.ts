import { sql } from "drizzle-orm";
import {
  pgSchema,
  text,
  jsonb,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import type { Tables } from "@zenith/shared";

export const shop = pgSchema("shop");
// Flexible catalog documents; immutable offers and order snapshots remain independent rows.
// Generated relational keys enforce ownership/payment integrity at the database boundary.
export const categories = shop.table("categories", {
  id: text().primaryKey(),
  payload: jsonb().$type<Tables["categories"]>().notNull(),
});
export const products = shop.table(
  "products",
  {
    id: text().primaryKey(),
    payload: jsonb().$type<Tables["products"]>().notNull(),
  },
  (t) => [
    uniqueIndex("product_slug").on(sql`(${t.payload}->'published'->>'slug')`),
  ],
);
export const files = shop.table(
  "files",
  {
    id: text().primaryKey(),
    payload: jsonb().$type<Tables["files"]>().notNull(),
  },
  (t) => [
    uniqueIndex("file_object_key").on(
      sql`(${t.payload}->>'bucket')`,
      sql`(${t.payload}->>'key')`,
    ),
  ],
);
export const offers = shop.table("offers", {
  id: text().primaryKey(),
  payload: jsonb().$type<Tables["offers"]>().notNull(),
  productId: text("product_id")
    .generatedAlwaysAs(sql`payload->>'productId'`)
    .references(() => products.id)
    .notNull(),
});
export const accounts = shop.table("accounts", {
  id: text().primaryKey(),
  payload: jsonb().$type<Tables["accounts"]>().notNull(),
});
export const coupons = shop.table(
  "coupons",
  {
    id: text().primaryKey(),
    payload: jsonb().$type<Tables["coupons"]>().notNull(),
  },
  (t) => [uniqueIndex("coupon_code").on(sql`(${t.payload}->>'code')`)],
);
export const carts = shop.table("carts", {
  id: text()
    .primaryKey()
    .references(() => accounts.id),
  payload: jsonb().$type<Tables["carts"]>().notNull(),
});
export const wishlists = shop.table("wishlists", {
  id: text()
    .primaryKey()
    .references(() => accounts.id),
  payload: jsonb().$type<Tables["wishlists"]>().notNull(),
});
export const orders = shop.table(
  "orders",
  {
    id: text().primaryKey(),
    payload: jsonb().$type<Tables["orders"]>().notNull(),
    userId: text("user_id")
      .generatedAlwaysAs(sql`payload->>'userId'`)
      .notNull()
      .references(() => accounts.id),
    idempotencyKey: text("idempotency_key")
      .generatedAlwaysAs(sql`payload->>'idempotencyKey'`)
      .notNull(),
  },
  (t) => [
    uniqueIndex("order_request").on(t.userId, t.idempotencyKey),
    check("order_nonnegative", sql`(${t.payload}->>'totalVnd')::bigint >= 0`),
  ],
);
export const payments = shop.table(
  "payments",
  {
    id: text().primaryKey(),
    payload: jsonb().$type<Tables["payments"]>().notNull(),
    orderId: text("order_id")
      .generatedAlwaysAs(sql`payload->>'orderId'`)
      .notNull()
      .references(() => orders.id),
    bankReference: text("bank_reference")
      .generatedAlwaysAs(sql`payload->>'bankReference'`)
      .notNull(),
  },
  (t) => [
    uniqueIndex("payment_order").on(t.orderId),
    uniqueIndex("payment_reference").on(t.bankReference),
  ],
);
export const entitlements = shop.table(
  "entitlements",
  {
    id: text().primaryKey(),
    payload: jsonb().$type<Tables["entitlements"]>().notNull(),
    rightKey: text("right_key")
      .generatedAlwaysAs(sql`payload->'line'->'rights'->>0`)
      .notNull(),
    userId: text("user_id")
      .generatedAlwaysAs(sql`payload->>'userId'`)
      .notNull()
      .references(() => accounts.id),
    offerId: text("offer_id")
      .generatedAlwaysAs(sql`payload->>'offerId'`)
      .notNull()
      .references(() => offers.id),
    orderId: text("order_id")
      .generatedAlwaysAs(sql`payload->>'orderId'`)
      .notNull()
      .references(() => orders.id),
  },
  (t) => [
    uniqueIndex("owned_offer").on(t.userId, t.offerId),
    uniqueIndex("owned_identity").on(t.userId, t.rightKey),
    index("library_user").on(t.userId),
  ],
);
export const downloads = shop.table("downloads", {
  id: text().primaryKey(),
  payload: jsonb().$type<Tables["downloads"]>().notNull(),
  entitlementId: text("entitlement_id")
    .generatedAlwaysAs(sql`payload->>'entitlementId'`)
    .notNull()
    .references(() => entitlements.id),
});
export const notifications = shop.table(
  "notifications",
  {
    id: text().primaryKey(),
    payload: jsonb().$type<Tables["notifications"]>().notNull(),
  },
  (t) => [index("notification_user").on(sql`(${t.payload}->>'userId')`)],
);
export const tickets = shop.table(
  "tickets",
  {
    id: text().primaryKey(),
    payload: jsonb().$type<Tables["tickets"]>().notNull(),
    orderId: text("order_id")
      .generatedAlwaysAs(sql`payload->>'orderId'`)
      .notNull()
      .references(() => orders.id),
  },
  (t) => [index("ticket_user").on(sql`(${t.payload}->>'userId')`)],
);
export const ticketMessages = shop.table("ticketMessages", {
  id: text().primaryKey(),
  payload: jsonb().$type<Tables["ticketMessages"]>().notNull(),
  ticketId: text("ticket_id")
    .generatedAlwaysAs(sql`payload->>'ticketId'`)
    .notNull()
    .references(() => tickets.id),
});
export const jobs = shop.table(
  "jobs",
  {
    id: text().primaryKey(),
    payload: jsonb().$type<Tables["jobs"]>().notNull(),
    fileId: text("file_id")
      .generatedAlwaysAs(sql`payload->>'fileId'`)
      .notNull()
      .references(() => files.id),
  },
  (t) => [index("queue_status").on(sql`(${t.payload}->>'status')`)],
);
export const audit = shop.table("audit", {
  id: text().primaryKey(),
  payload: jsonb().$type<Tables["audit"]>().notNull(),
});
export const outbox = shop.table(
  "outbox",
  {
    id: text().primaryKey(),
    payload: jsonb().$type<Tables["outbox"]>().notNull(),
  },
  (t) => [index("outbox_status").on(sql`(${t.payload}->>'status')`)],
);
export const settings = shop.table("settings", {
  id: text().primaryKey(),
  payload: jsonb().$type<Tables["settings"]>().notNull(),
});
export const guard = shop.table("guard", { id: text().primaryKey() });
