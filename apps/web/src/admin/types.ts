import type {
  Account,
  AssetFile,
  Audit,
  Category,
  Coupon,
  Offer,
  Order,
  Outbox,
  PreviewJob,
  Product,
  Settings,
  Ticket,
} from "@zenith/shared/browser";
export interface AdminData {
  products: Product[];
  offers: Offer[];
  files: AssetFile[];
  jobs: PreviewJob[];
  orders: Order[];
  tickets: Ticket[];
  accounts: Account[];
  coupons: Coupon[];
  categories: Category[];
  settings: Settings;
  audit: Audit[];
  outbox: Outbox[];
}
