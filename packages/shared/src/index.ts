import { z } from "zod";
export { localized, ownershipKey } from "./browser.ts";

export const textSchema = z.object({
  vi: z.string().max(20000),
  en: z.string().max(20000),
});
export type Localized = z.infer<typeof textSchema>;
export type Locale = "vi" | "en";
export const moneySchema = z.number().int().min(0).max(1_000_000_000);
export const idSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/);
export const safeUrl = z
  .string()
  .max(2048)
  .refine(
    (v) => v === "" || /^https:\/\//.test(v) || /^\/(?!\/)/.test(v),
    "Use HTTPS or a relative path",
  );
export const categorySchema = z.object({
  id: idSchema,
  name: textSchema,
  parentId: idSchema.nullable(),
  position: z.number().int(),
  active: z.boolean(),
});
export type Category = z.infer<typeof categorySchema>;
export const mediaSchema = z.object({
  id: idSchema,
  url: safeUrl,
  poster: safeUrl,
  type: z.enum(["video", "image"]),
  label: textSchema,
});
export type Media = z.infer<typeof mediaSchema>;
export const specSchema = z.object({ label: textSchema, value: textSchema });
export const contentSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(150)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: textSchema,
  description: textSchema,
  instructions: textSchema,
  kind: z.enum(["video", "ae", "bundle"]),
  categoryId: idSchema,
  tags: z.array(z.string().max(40)).max(20),
  priority: z.number().int().min(0).max(9999),
  cover: safeUrl,
  media: z.array(mediaSchema).max(30),
  mainPreviewJobId: idSchema.nullable(),
  offerIds: z.array(idSchema).max(100),
  relatedIds: z.array(idSchema).max(12),
  specs: z.array(specSchema).max(30),
  dependencies: z
    .array(
      z.object({
        kind: z.enum(["software", "plugin", "font", "other"]),
        name: z.string().max(100),
        version: z.string().max(100),
        required: z.boolean(),
        url: safeUrl,
      }),
    )
    .max(50),
});
export type ProductContent = z.infer<typeof contentSchema>;
export interface Product {
  id: string;
  status: "draft" | "active" | "hidden" | "retired";
  published: ProductContent | null;
  draft: ProductContent;
  revision: number;
  createdAt: string;
  publishedAt: string | null;
}
export const offerSchema = z.object({
  id: idSchema,
  productId: idSchema,
  label: textSchema,
  release: z.string().max(60),
  quality: z.string().max(60),
  priceVnd: moneySchema,
  fileIds: z.array(idSchema).min(1).max(300),
  readmeFileId: idSchema.nullable(),
  changelog: textSchema,
  specs: z.array(specSchema).max(30).optional(),
  items: z
    .array(
      z.object({
        offerId: idSchema.nullable(),
        title: textSchema,
        fileIds: z.array(idSchema).max(100),
        creditVnd: moneySchema,
        preview: mediaSchema.optional(),
      }),
    )
    .max(300),
  upgrades: z
    .array(z.object({ fromOfferId: idSchema, priceVnd: moneySchema }))
    .max(100),
  freeFromOfferIds: z.array(idSchema).max(100),
});
export type Offer = z.infer<typeof offerSchema>;
export interface AssetFile {
  id: string;
  name: string;
  key: string;
  bucket: "products" | "previews";
  type: string;
  size: number;
  sha256: string | null;
  status: "pending" | "ready" | "missing" | "invalid" | "deleting";
  purpose: "product" | "preview-source" | "preview" | "attachment";
  ownerId: string | null;
  createdAt: string;
  zip: {
    status: "pending" | "valid" | "invalid";
    errors: string[];
    warnings: string[];
    entries: string[];
    acknowledgedBy: string | null;
  } | null;
}
export const couponSchema = z
  .object({
    id: idSchema,
    code: z
      .string()
      .min(2)
      .max(32)
      .regex(/^[A-Z0-9_-]+$/),
    kind: z.enum(["percent", "fixed"]),
    value: moneySchema,
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    minVnd: moneySchema,
    maxUses: z.number().int().min(1),
    perUser: z.number().int().min(1),
    productIds: z.array(idSchema).max(100),
    stackOwnership: z.boolean(),
    active: z.boolean(),
  })
  .refine(
    (c) => c.kind !== "percent" || c.value <= 100,
    "Percent must be at most 100",
  );
export type Coupon = z.infer<typeof couponSchema>;
export interface Actor {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  admin: boolean;
}
export interface Account {
  id: string;
  email: string;
  name: string;
  blocked: boolean;
  createdAt: string;
  deletionRequestedAt: string | null;
  deletionProcessedAt?: string | null;
  lastReleases: Record<string, string>;
}
export interface Cart {
  id: string;
  offerIds: string[];
  updatedAt: string;
}
export interface Wishlist {
  id: string;
  productIds: string[];
}
export interface OrderLine {
  offerId: string;
  productId: string;
  title: Localized;
  label: Localized;
  kind: ProductContent["kind"];
  cover: string;
  release: string;
  quality: string;
  changelog: Localized;
  fileIds: string[];
  rights: string[];
  priceVnd: number;
  upgradeDiscountVnd: number;
  ownershipDiscountVnd: number;
  couponDiscountVnd: number;
  totalVnd: number;
}
export interface Quote {
  lines: OrderLine[];
  subtotalVnd: number;
  upgradeDiscountVnd: number;
  ownershipDiscountVnd: number;
  couponDiscountVnd: number;
  totalVnd: number;
  couponId: string | null;
  couponCode: string | null;
}
export interface Order extends Quote {
  id: string;
  userId: string;
  email: string;
  status: "pending" | "reported" | "paid" | "expired" | "support";
  createdAt: string;
  expiresAt: string;
  reportedAt: string | null;
  paidAt: string | null;
  idempotencyKey: string;
  requestHash: string;
  termsVersion: string;
  bank: { account: string; name: string; bin: string };
  notes: string[];
}
export interface Payment {
  id: string;
  orderId: string;
  bankReference: string;
  amountVnd: number;
  confirmedBy: string;
  confirmedAt: string;
  note: string;
}
export interface Entitlement {
  id: string;
  userId: string;
  orderId: string;
  offerId: string;
  productId: string;
  line: OrderLine;
  createdAt: string;
  source: "purchase" | "free-update";
}
export interface Download {
  id: string;
  userId: string;
  fileId: string;
  entitlementId: string;
  name: string;
  createdAt: string;
}
export interface Notification {
  id: string;
  userId: string;
  title: Localized;
  body: Localized;
  href: string;
  read: boolean;
  createdAt: string;
}
export interface Ticket {
  id: string;
  userId: string;
  orderId: string;
  subject: string;
  status: "open" | "closed";
  createdAt: string;
  updatedAt: string;
}
export interface TicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  admin: boolean;
  body: string;
  fileIds: string[];
  createdAt: string;
}
export interface PreviewJob {
  id: string;
  type: "preview" | "zip" | "verify";
  fileId: string;
  status: "queued" | "processing" | "done" | "failed";
  start: number;
  duration: number;
  watermark: string;
  outputKey: string;
  outputUrl: string | null;
  attempts: number;
  leaseToken: string | null;
  leaseUntil: string | null;
  error: string | null;
  createdAt: string;
}
export interface Audit {
  id: string;
  actorId: string;
  action: string;
  targetId: string;
  detail: Record<string, unknown>;
  createdAt: string;
}
export interface Outbox {
  id: string;
  channel: "email" | "admin-discord" | "community-discord";
  event: string;
  recipient: string;
  title: string;
  body: string;
  href: string;
  status: "queued" | "sending" | "sent" | "failed";
  attempts: number;
  nextAt: string;
  leaseUntil: string | null;
  error: string | null;
}
export const settingsSchema = z.object({
  id: z.literal("store"),
  heroTitle: textSchema,
  heroDescription: textSchema,
  heroProductId: idSchema.nullable(),
  heroMediaId: idSchema.nullable(),
  watermark: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[\p{L}\p{N} ._-]+$/u),
  usdRate: z.number().positive().max(1000000),
  usdRateUpdatedAt: z.string().datetime(),
  termsVersion: z.string().min(1).max(40),
  license: textSchema,
  refund: textSchema,
  legalReviewed: z.boolean(),
  checkoutEnabled: z.boolean(),
  faq: z.array(z.object({ question: textSchema, answer: textSchema })).max(40),
});
export type Settings = z.infer<typeof settingsSchema>;
export interface Tables {
  categories: Category;
  products: Product;
  offers: Offer;
  files: AssetFile;
  coupons: Coupon;
  accounts: Account;
  carts: Cart;
  wishlists: Wishlist;
  orders: Order;
  payments: Payment;
  entitlements: Entitlement;
  downloads: Download;
  notifications: Notification;
  tickets: Ticket;
  ticketMessages: TicketMessage;
  jobs: PreviewJob;
  audit: Audit;
  outbox: Outbox;
  settings: Settings;
}
export type TableName = keyof Tables;
export interface PublicProduct extends ProductContent {
  id: string;
  status: Product["status"];
  publishedAt: string | null;
  offers: PublicOffer[];
  files: { id: string; name: string; size: number; type: string }[];
}
export interface PublicOffer extends Offer {
  includedFileIds: string[];
  grantedRights: string[];
  components: {
    title: Localized;
    offerId: string | null;
    slug: string | null;
    quality: string;
    preview: Media | null;
  }[];
}
export const checkoutSchema = z.object({
  offerIds: z.array(idSchema).min(1).max(30),
  coupon: z.string().max(32).default(""),
  acceptedTerms: z.literal(true),
  termsVersion: z.string().min(1).max(40),
  idempotencyKey: z.string().uuid(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
