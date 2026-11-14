import { useState, useEffect, Suspense } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowRight,
  Bell,
  ChevronDown,
  Heart,
  Library,
  Menu,
  Moon,
  Search,
  ShoppingBag,
  Sun,
  UserRound,
  Trash2,
} from "lucide-react";
import { localized } from "@zenith/shared/browser";
import { useShop } from "../lib/context";
import { isDemo } from "../lib/supabase";
import { Modal, Loading } from "./Primitives";

export function Layout() {
  const shop = useShop();
  const {
    t,
    locale,
    setLocale,
    categories,
    theme,
    toggleTheme,
    currency,
    setCurrency,
    me,
    cart,
    cartOpen,
    setCartOpen,
    removeCart,
    money,
    notice,
  } = shop;
  const [mobileKey, setMobileKey] = useState(""),
    [search, setSearch] = useState("");
  const navigate = useNavigate(),
    location = useLocation();
  const mobile = mobileKey === location.key;
  const overlap = cart.some((item, i) =>
    cart
      .slice(i + 1)
      .some((other) =>
        (item.rights ?? [item.offerId]).some((right) =>
          (other.rights ?? [other.offerId]).includes(right),
        ),
      ),
  );
  const setMobile = (value: boolean) => setMobileKey(value ? location.key : "");
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  const searchForm = (
    <form
      className="header-search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate(`/shop?q=${encodeURIComponent(search)}`);
        setMobile(false);
      }}
    >
      <Search size={17} />
      <input
        aria-label={t("Tìm sản phẩm", "Search assets")}
        placeholder={t("Tìm cảm hứng của bạn…", "Find your next asset…")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </form>
  );
  return (
    <>
      <a className="skip-link" href="#main">
        {t("Đến nội dung", "Skip to content")}
      </a>
      {isDemo && (
        <div className="demo-strip">
          {t(
            "BẢN TRẢI NGHIỆM CỤC BỘ · Sản phẩm minh họa, không chuyển tiền thật.",
            "LOCAL DEMO · Sample products. Do not transfer real money.",
          )}
        </div>
      )}
      <header className="header">
        <div className="header-main container">
          <Link to="/" className="brand">
            <img src="/favicon.svg" alt="" />
            <span>
              ZENITH <span className="brand-small">MEDIA</span>
            </span>
          </Link>
          <nav
            className="desktop-nav"
            aria-label={t("Điều hướng chính", "Main navigation")}
          >
            <NavLink to="/shop">{t("Khám phá", "Explore")}</NavLink>
            <details className="nav-dropdown">
              <summary>
                {t("Danh mục", "Categories")}
                <ChevronDown size={14} />
              </summary>
              <div className="dropdown-menu">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    className={c.parentId ? "sub-category" : ""}
                    to={`/shop?category=${c.id}`}
                    onClick={(e) =>
                      e.currentTarget
                        .closest("details")
                        ?.removeAttribute("open")
                    }
                  >
                    {localized(c.name, locale)}
                  </Link>
                ))}
              </div>
            </details>
            <NavLink to="/shop?category=bundle">Bundle</NavLink>
          </nav>
          {searchForm}
          <div className="header-actions">
            <button
              className="icon-button theme-toggle"
              onClick={toggleTheme}
              aria-label={
                theme === "light"
                  ? t("Chuyển sang giao diện tối", "Switch to dark mode")
                  : t("Chuyển sang giao diện sáng", "Switch to light mode")
              }
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <Link
              className="icon-button"
              to="/wishlist"
              aria-label={t("Yêu thích", "Wishlist")}
            >
              <Heart size={19} />
            </Link>
            <Link
              className="icon-button notification-button"
              to="/notifications"
              aria-label={t("Thông báo", "Notifications")}
            >
              <Bell size={19} />
              {!!me?.unread && (
                <span className="notification-count">{me.unread}</span>
              )}
            </Link>
            <button
              className="cart-trigger"
              onClick={() => setCartOpen(true)}
              aria-label={t("Giỏ hàng", "Cart")}
            >
              <ShoppingBag size={18} />
              <span aria-hidden="true">{cart.length}</span>
            </button>
            <Link
              className="account-trigger"
              to={me ? "/library" : "/login"}
              aria-label={
                me ? t("Tài khoản", "Account") : t("Đăng nhập", "Sign in")
              }
            >
              <UserRound size={18} />
              <span>
                {me ? t("Tài khoản", "Account") : t("Đăng nhập", "Sign in")}
              </span>
            </Link>
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobile(!mobile)}
              aria-expanded={mobile}
              aria-label="Menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
        {mobile && (
          <div className="mobile-navigation container">
            {searchForm}
            <Link to="/shop">{t("Tất cả sản phẩm", "All assets")}</Link>
            {categories.map((c) => (
              <Link key={c.id} to={`/shop?category=${c.id}`}>
                {localized(c.name, locale)}
              </Link>
            ))}
            <Link to="/library">{t("Thư viện", "My Library")}</Link>
            <Link to="/wishlist">{t("Yêu thích", "Wishlist")}</Link>
            <Link to="/notifications">
              {t("Thông báo", "Notifications")}
              {me?.unread ? ` (${me.unread})` : ""}
            </Link>
            <Link to="/account">{t("Tài khoản", "Account")}</Link>
          </div>
        )}
      </header>
      <main id="main">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
      <footer className="footer container">
        <div className="footer-top">
          <div>
            <Link to="/" className="footer-brand">
              ZENITH MEDIA
            </Link>
            <p>
              {t(
                "Tài nguyên cho những khung hình mang dấu ấn của bạn.",
                "Assets for frames that feel like you.",
              )}
            </p>
          </div>
          <div className="footer-links">
            <Link to="/faq">FAQ</Link>
            <Link to="/support">{t("Hỗ trợ", "Support")}</Link>
            <Link to="/license">
              {t("Giấy phép & điều khoản", "License & terms")}
            </Link>
            <Link to="/refund">
              {t("Chính sách hoàn tiền", "Refund policy")}
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} ZENITH MEDIA</span>
          <div className="preferences">
            <select
              aria-label={t("Ngôn ngữ", "Language")}
              value={locale}
              onChange={(e) => setLocale(e.target.value as "vi" | "en")}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
            <select
              aria-label={t("Tiền tệ", "Currency")}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "VND" | "USD")}
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        {currency === "USD" && (
          <p className="currency-note">
            {t(
              "USD là giá quy đổi tham khảo. Chuyển khoản MB Bank thanh toán bằng VND.",
              "USD prices are indicative. MB Bank transfers are settled in VND.",
            )}
          </p>
        )}
      </footer>
      <Modal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title={t("Giỏ hàng của bạn", "Your cart")}
        drawer
      >
        <div className="drawer-body">
          {!cart.length ? (
            <div className="empty">
              <ShoppingBag size={36} />
              <h3>{t("Chưa có sản phẩm", "Your cart is empty")}</h3>
              <p>
                {t(
                  "Tìm tài nguyên cho ý tưởng tiếp theo của bạn.",
                  "Find an asset for your next idea.",
                )}
              </p>
              <Link
                className="button"
                to="/shop"
                onClick={() => setCartOpen(false)}
              >
                {t("Khám phá sản phẩm", "Explore assets")}
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div className="cart-line" key={item.offerId}>
                  <img src={item.cover} alt="" />
                  <div>
                    <Link
                      to={`/products/${item.slug}`}
                      onClick={() => setCartOpen(false)}
                    >
                      {localized(item.title, locale)}
                    </Link>
                    <small>{localized(item.label, locale)}</small>
                    <strong>{money(item.priceVnd)}</strong>
                  </div>
                  <button
                    className="icon-button"
                    aria-label={t("Bỏ sản phẩm", "Remove item")}
                    onClick={() => removeCart(item.offerId)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
              <div className="drawer-summary">
                {overlap && (
                  <p className="error-box" role="alert">
                    {t(
                      "Có video trùng giữa sản phẩm riêng và Bundle. Hãy bỏ một sản phẩm trước khi thanh toán.",
                      "A standalone asset and bundle include the same content. Remove one before checkout.",
                    )}
                  </p>
                )}
                <div>
                  <span>{t("Tạm tính", "Subtotal")}</span>
                  <strong>
                    {money(cart.reduce((s, i) => s + i.priceVnd, 0))}
                  </strong>
                </div>
                <p>
                  {t(
                    "Khoản giảm theo quyền sở hữu và Coupon sẽ được kiểm tra tại thanh toán.",
                    "Ownership credits and coupons are verified at checkout.",
                  )}
                </p>
                {overlap ? (
                  <button className="button full" disabled>
                    {t(
                      "Chọn lại sản phẩm trong giỏ",
                      "Resolve duplicate content",
                    )}
                  </button>
                ) : (
                  <Link
                    to="/checkout"
                    className="button full"
                    onClick={() => setCartOpen(false)}
                  >
                    {t("Đến thanh toán", "Continue to checkout")}
                    <ArrowRight size={18} />
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </>
  );
}
export function AccountNav() {
  const { t, me } = useShop();
  return (
    <nav className="account-nav" aria-label={t("Tài khoản", "Account")}>
      <NavLink to="/library">
        <Library size={16} />
        {t("Thư viện", "My Library")}
      </NavLink>
      <NavLink to="/orders">{t("Đơn hàng", "Orders")}</NavLink>
      <NavLink to="/downloads">{t("Lịch sử tải", "Downloads")}</NavLink>
      <NavLink to="/support">{t("Hỗ trợ", "Support")}</NavLink>
      <NavLink to="/notifications">{t("Thông báo", "Notifications")}</NavLink>
      <NavLink to="/account">{t("Hồ sơ", "Profile")}</NavLink>
      {me?.actor.admin && <NavLink to="/admin">Admin</NavLink>}
    </nav>
  );
}
