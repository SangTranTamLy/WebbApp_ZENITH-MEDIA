import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  ownershipKey,
  type Category,
  type Locale,
  type PublicProduct,
  type Settings,
} from "@zenith/shared/browser";
import { Context, type CartItem, type Me, type ShopContext } from "./context";
import { api, errorMessage, put, setAccessToken } from "./api";
import { isDemo, supabase } from "./supabase";

function saved<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export function Provider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() =>
    saved("zenith-locale", "vi"),
  );
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    saved("zenith-theme", "light"),
  );
  const [currency, setCurrency] = useState<"VND" | "USD">(() =>
    saved("zenith-currency", "VND"),
  );
  const [cart, setCart] = useState<CartItem[]>(() => saved("zenith-cart", []));
  const [cartOpen, setCartOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(!isDemo && !supabase);
  const [notice, setNotice] = useState("");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const toast = useCallback((message: string) => setNotice(message), []);
  const refreshMe = useCallback(async () => {
    const next = await api<Me>("/me");
    setMe(next);
  }, []);
  const reloadConfig = useCallback(async () => {
    try {
      const data = await api<{ settings: Settings; categories: Category[] }>(
        "/config",
      );
      setSettings(data.settings);
      setCategories(data.categories);
      setCatalogError("");
    } catch (e) {
      setCatalogError(errorMessage(e, locale));
    }
  }, [locale]);
  useEffect(() => {
    const controller = new AbortController();
    api<{ settings: Settings; categories: Category[] }>("/config", {
      signal: controller.signal,
    })
      .then((data) => {
        setSettings(data.settings);
        setCategories(data.categories);
        setCatalogError("");
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setCatalogError(errorMessage(e, locale));
      });
    return () => controller.abort();
  }, [locale]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = locale;
    localStorage.setItem("zenith-theme", JSON.stringify(theme));
    localStorage.setItem("zenith-locale", JSON.stringify(locale));
    localStorage.setItem("zenith-currency", JSON.stringify(currency));
  }, [theme, locale, currency]);
  useEffect(() => {
    localStorage.setItem("zenith-cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    let live = true;
    let generation = 0;
    async function synchronize(token: string | null) {
      const current = ++generation;
      setAccessToken(token);
      try {
        if (token) {
          const next = await api<Me>("/me");
          if (!live || current !== generation) return;
          setMe(next);
          const local = saved<CartItem[]>("zenith-cart", []);
          const merged = [
            ...new Set([...next.cart, ...local.map((i) => i.offerId)]),
          ];
          const catalog = await api<{ products: PublicProduct[] }>(
            "/cart/details",
          );
          const available = catalog.products.flatMap((p) =>
            p.offers
              .filter((o) => merged.includes(o.id))
              .map((o) => ({
                offerId: o.id,
                productId: p.id,
                slug: p.slug,
                title: p.title,
                label: o.label,
                priceVnd: o.priceVnd,
                cover: p.cover,
                rights: o.grantedRights,
              })),
          );
          if (!live || current !== generation) return;
          setCart(available);
          await put("/cart", { offerIds: available.map((i) => i.offerId) });
        } else if (live) setMe(null);
      } catch (e) {
        if (live && current === generation) toast(errorMessage(e, locale));
      } finally {
        if (live && current === generation) setReady(true);
      }
    }
    if (isDemo) {
      void synchronize(sessionStorage.getItem("zenith-demo-token"));
      return () => {
        live = false;
      };
    }
    if (!supabase) return;
    void supabase.auth
      .getSession()
      .then(({ data }) => synchronize(data.session?.access_token ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => {
        void synchronize(session?.access_token ?? null);
      }, 0);
    });
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
    // Auth listeners deliberately remain stable; language is read only for initial failures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function syncCart(items: CartItem[]) {
    setCart(items);
    if (me)
      try {
        await put("/cart", { offerIds: items.map((i) => i.offerId) });
      } catch (e) {
        toast(errorMessage(e, locale));
      }
  }
  const value: ShopContext = {
    locale,
    setLocale,
    theme,
    toggleTheme: () => setTheme(theme === "light" ? "dark" : "light"),
    currency,
    setCurrency,
    t: (vi, en) => (locale === "vi" ? vi : en),
    money: (v) =>
      new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: currency === "VND" ? 0 : 2,
      }).format(currency === "USD" ? v / (settings?.usdRate ?? 25000) : v),
    settings,
    categories,
    me,
    ready,
    refreshMe,
    loginDemo: async (role) => {
      sessionStorage.setItem("zenith-demo-token", role);
      setAccessToken(role);
      await refreshMe();
    },
    logout: async (all = false) => {
      if (supabase)
        await supabase.auth.signOut({ scope: all ? "global" : "local" });
      sessionStorage.removeItem("zenith-demo-token");
      setAccessToken(null);
      setMe(null);
      setCart([]);
    },
    cart,
    cartOpen,
    setCartOpen,
    addCart: (p, o, buyNow = false) => {
      if (
        me?.entitlements.some((e) => e.line.rights.includes(ownershipKey(o)))
      ) {
        toast(
          locale === "vi"
            ? "Bạn đã sở hữu sản phẩm này."
            : "You already own this option.",
        );
        return;
      }
      const item: CartItem = {
        offerId: o.id,
        productId: p.id,
        slug: p.slug,
        title: p.title,
        label: o.label,
        priceVnd: o.priceVnd,
        cover: p.cover,
        rights: o.grantedRights,
      };
      void syncCart(
        buyNow
          ? [item]
          : cart.some((i) => i.offerId === o.id)
            ? cart
            : [...cart, item],
      );
      if (!buyNow) setCartOpen(true);
    },
    removeCart: (id) => {
      void syncCart(cart.filter((i) => i.offerId !== id));
    },
    clearCart: () => {
      void syncCart([]);
    },
    toggleWishlist: async (id) => {
      if (!me) {
        toast(
          locale === "vi"
            ? "Đăng nhập để lưu sản phẩm yêu thích."
            : "Sign in to save your favorites.",
        );
        return;
      }
      const productIds = me.wishlist.includes(id)
        ? me.wishlist.filter((i) => i !== id)
        : [...me.wishlist, id];
      await put("/wishlist", { productIds });
      setMe({ ...me, wishlist: productIds });
    },
    toast,
    notice,
    catalogError,
    reloadConfig,
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
