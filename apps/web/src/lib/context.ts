import { createContext, useContext } from "react";
import type {
  Account,
  Actor,
  Category,
  Entitlement,
  Locale,
  PublicOffer,
  PublicProduct,
  Settings,
} from "@zenith/shared/browser";
export interface CartItem {
  offerId: string;
  productId: string;
  slug: string;
  title: { vi: string; en: string };
  label: { vi: string; en: string };
  priceVnd: number;
  cover: string;
  rights?: string[];
}
export interface Me {
  actor: Actor;
  account: Account;
  entitlements: Entitlement[];
  wishlist: string[];
  cart: string[];
  unread: number;
}
export interface ShopContext {
  locale: Locale;
  setLocale: (v: Locale) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  currency: "VND" | "USD";
  setCurrency: (v: "VND" | "USD") => void;
  t: (vi: string, en: string) => string;
  money: (v: number) => string;
  settings: Settings | null;
  categories: Category[];
  me: Me | null;
  ready: boolean;
  refreshMe: () => Promise<void>;
  loginDemo: (role: string) => Promise<void>;
  logout: (all?: boolean) => Promise<void>;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addCart: (p: PublicProduct, o: PublicOffer, buyNow?: boolean) => void;
  removeCart: (id: string) => void;
  clearCart: () => void;
  toggleWishlist: (id: string) => Promise<void>;
  toast: (message: string) => void;
  notice: string;
  catalogError: string;
  reloadConfig: () => Promise<void>;
}
export const Context = createContext<ShopContext | null>(null);
export function useShop() {
  const value = useContext(Context);
  if (!value) throw new Error("Missing ShopProvider");
  return value;
}
