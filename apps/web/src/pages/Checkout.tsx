import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LockKeyhole, Trash2 } from "lucide-react";
import { localized, type Order, type Quote } from "@zenith/shared/browser";
import { useShop } from "../lib/context";
import { ApiError, errorMessage, post } from "../lib/api";
import { Empty, ErrorState, PageHead } from "../components/Primitives";
import { isDemo } from "../lib/supabase";

export function PriceSummary({ quote }: { quote: Quote }) {
  const { t, money } = useShop();
  return (
    <dl className="price-summary">
      <div>
        <dt>{t("Tạm tính", "Subtotal")}</dt>
        <dd>{money(quote.subtotalVnd)}</dd>
      </div>
      {quote.upgradeDiscountVnd > 0 && (
        <div>
          <dt>{t("Giảm giá nâng cấp", "Upgrade discount")}</dt>
          <dd>-{money(quote.upgradeDiscountVnd)}</dd>
        </div>
      )}
      {quote.ownershipDiscountVnd > 0 && (
        <div>
          <dt>{t("Nội dung đã sở hữu", "Ownership credit")}</dt>
          <dd>-{money(quote.ownershipDiscountVnd)}</dd>
        </div>
      )}
      {quote.couponDiscountVnd > 0 && (
        <div>
          <dt>Coupon {quote.couponCode}</dt>
          <dd>-{money(quote.couponDiscountVnd)}</dd>
        </div>
      )}
      <div className="total">
        <dt>{t("Tổng cộng", "Total")}</dt>
        <dd>{money(quote.totalVnd)}</dd>
      </div>
      <div className="settlement">
        <dt>{t("Số tiền chuyển khoản", "Bank transfer amount")}</dt>
        <dd>{new Intl.NumberFormat("vi-VN").format(quote.totalVnd)} VND</dd>
      </div>
    </dl>
  );
}
export function Checkout() {
  const {
    t,
    locale,
    cart,
    removeCart,
    clearCart,
    settings,
    me,
    refreshMe,
    money,
    toast,
  } = useShop();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState(""),
    [applied, setApplied] = useState(""),
    [accepted, setAccepted] = useState(false),
    [response, setResponse] = useState<{
      key: string;
      quote: Quote | null;
      error: string;
    } | null>(null),
    [submissionError, setSubmissionError] = useState({ key: "", message: "" }),
    [pendingOrder, setPendingOrder] = useState(""),
    [busy, setBusy] = useState(false);
  const ids = JSON.stringify(cart.map((i) => i.offerId));
  const quoteKey = JSON.stringify([ids, applied, locale, me?.actor.id]);
  const quoting = cart.length > 0 && response?.key !== quoteKey;
  const quote = response?.key === quoteKey ? response.quote : null;
  const error =
    (submissionError.key === quoteKey ? submissionError.message : "") ||
    (response?.key === quoteKey ? response.error : "");
  const setError = (message: string) =>
    setSubmissionError({ key: quoteKey, message });
  // Only a response for the current request may enable checkout.
  useEffect(() => {
    if (!cart.length) return;
    let active = true;
    post<Quote>("/quote", { offerIds: JSON.parse(ids), coupon: applied })
      .then((q) => {
        if (active) setResponse({ key: quoteKey, quote: q, error: "" });
      })
      .catch((e) => {
        if (active)
          setResponse({
            key: quoteKey,
            quote: null,
            error: errorMessage(e, locale),
          });
      });
    return () => {
      active = false;
    };
  }, [ids, applied, locale, cart.length, quoteKey]);
  async function submit() {
    if (!settings || !quote) return;
    setBusy(true);
    setError("");
    try {
      const signature = JSON.stringify({
        ids: JSON.parse(ids),
        coupon: applied,
        terms: settings.termsVersion,
      });
      let saved: { signature: string; key: string } | null = null;
      try {
        saved = JSON.parse(sessionStorage.getItem("zenith-checkout") ?? "null");
      } catch {
        /* Recover an invalid local key. */
      }
      const key =
        saved?.signature === signature ? saved.key : crypto.randomUUID();
      sessionStorage.setItem(
        "zenith-checkout",
        JSON.stringify({ signature, key }),
      );
      const order = await post<Order>("/orders", {
        offerIds: JSON.parse(ids),
        coupon: applied,
        acceptedTerms: accepted,
        termsVersion: settings.termsVersion,
        idempotencyKey: key,
      });
      navigate(`/orders/${order.id}`);
      clearCart();
      // The order is committed. A failed profile refresh must not strand the
      // customer on an empty checkout or imply that payment creation failed.
      void refreshMe().catch((e) => toast(errorMessage(e, locale)));
    } catch (e) {
      setError(errorMessage(e, locale));
      if (e instanceof ApiError && e.code === "ORDER_PENDING")
        setPendingOrder((e.details as { orderId: string }).orderId);
    } finally {
      setBusy(false);
    }
  }
  if (!cart.length)
    return (
      <div className="container">
        <Empty
          title={t("Giỏ hàng đang trống", "Your cart is empty")}
          body={t(
            "Chọn sản phẩm trước khi thanh toán.",
            "Choose an asset to continue.",
          )}
          href="/shop"
          label={t("Khám phá sản phẩm", "Explore assets")}
        />
      </div>
    );
  return (
    <div className="container checkout-page">
      <Link className="back-link" to="/shop">
        <ArrowLeft size={16} />
        {t("Tiếp tục khám phá", "Continue exploring")}
      </Link>
      <PageHead
        title={t("Hoàn tất lựa chọn của bạn", "Make it yours")}
        description={t(
          "Thanh toán một lần. Lưu giữ trong thư viện riêng.",
          "One purchase. Your own creative library.",
        )}
      />
      {isDemo && (
        <p className="notice-box">
          {t(
            "Chế độ demo: không thực hiện chuyển khoản thật.",
            "Demo mode: do not make a real transfer.",
          )}
        </p>
      )}
      <div className="checkout-grid">
        <div>
          <section className="checkout-section">
            <h2>{t("Sản phẩm của bạn", "Your assets")}</h2>
            {cart.map((item) => (
              <div className="cart-line" key={item.offerId}>
                <img src={item.cover} alt="" />
                <div>
                  <Link to={`/products/${item.slug}`}>
                    {localized(item.title, locale)}
                  </Link>
                  <small>{localized(item.label, locale)}</small>
                  <strong>
                    {money(
                      quote?.lines.find((line) => line.offerId === item.offerId)
                        ?.totalVnd ?? item.priceVnd,
                    )}
                  </strong>
                  {quote?.lines
                    .filter(
                      (line) =>
                        line.offerId === item.offerId &&
                        line.totalVnd < line.priceVnd,
                    )
                    .map((line) => (
                      <small key={line.offerId}>
                        {t("Giá gốc", "Base price")}: {money(line.priceVnd)}
                        {line.upgradeDiscountVnd > 0 && (
                          <>
                            {" "}
                            / {t("Nâng cấp", "Upgrade")}: -
                            {money(line.upgradeDiscountVnd)}
                          </>
                        )}
                        {line.ownershipDiscountVnd > 0 && (
                          <>
                            {" "}
                            / {t("Đã sở hữu", "Ownership")}: -
                            {money(line.ownershipDiscountVnd)}
                          </>
                        )}
                        {line.couponDiscountVnd > 0 && (
                          <> / Coupon: -{money(line.couponDiscountVnd)}</>
                        )}
                      </small>
                    ))}
                </div>
                <button
                  className="icon-button"
                  aria-label={t("Bỏ sản phẩm", "Remove item")}
                  onClick={() => removeCart(item.offerId)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </section>
          <section className="checkout-section">
            <h2>{t("Tài khoản nhận sản phẩm", "Your account")}</h2>
            <p>{me?.actor.email}</p>
            {!me?.actor.verified && (
              <p className="error-box">
                {t(
                  "Xác minh email trước khi thanh toán.",
                  "Verify your email before checkout.",
                )}{" "}
                <Link to="/account">{t("Mở hồ sơ", "Open profile")}</Link>
              </p>
            )}
          </section>
          <section className="checkout-section">
            <h2>{t("Phương thức thanh toán", "Payment method")}</h2>
            <div className="payment-method">
              <span className="bank-mark">MB</span>
              <div>
                <strong>MB Bank / VietQR</strong>
                <p>
                  {t(
                    "Chuyển khoản ngân hàng. Admin đối chiếu giao dịch và xác nhận.",
                    "Bank transfer. An admin checks the transaction and confirms payment.",
                  )}
                </p>
              </div>
            </div>
          </section>
        </div>
        <aside className="checkout-summary">
          <h2>{t("Thông tin thanh toán", "Order summary")}</h2>
          <form
            className="coupon-field"
            onSubmit={(e) => {
              e.preventDefault();
              setApplied(coupon.trim().toUpperCase());
            }}
          >
            <input
              aria-label="Coupon"
              placeholder={t("Mã ưu đãi", "Coupon code")}
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
            />
            <button type="submit" className="button secondary">
              {t("Áp dụng", "Apply")}
            </button>
          </form>
          {applied && (
            <button
              className="text-button"
              onClick={() => {
                setApplied("");
                setCoupon("");
              }}
            >
              {t("Bỏ Coupon", "Remove coupon")} {applied}
            </button>
          )}
          {quote && <PriceSummary quote={quote} />}
          <label className="checkbox">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>
              {t("Tôi đã đọc và đồng ý với", "I have read and agree to the")}{" "}
              <Link target="_blank" to="/license">
                {t("giấy phép & điều khoản", "license & terms")}
              </Link>{" "}
              {t("và", "and")}{" "}
              <Link target="_blank" to="/refund">
                {t("chính sách hoàn tiền", "refund policy")}
              </Link>
              .
            </span>
          </label>
          {error && <ErrorState message={error} />}{" "}
          {pendingOrder && (
            <Link
              className="button secondary full"
              to={`/orders/${pendingOrder}`}
            >
              {t("Mở đơn hiện có", "Open existing order")}
            </Link>
          )}
          <button
            className="button full"
            onClick={() => void submit()}
            disabled={
              busy || quoting || !quote || !accepted || !me?.actor.verified
            }
          >
            {busy
              ? t("Đang tạo đơn…", "Creating order…")
              : t("Tạo đơn & thanh toán", "Create order & pay")}
            <LockKeyhole size={17} />
          </button>
          <p className="small muted">
            {t(
              "File chỉ được cấp sau khi thanh toán được xác nhận.",
              "Files become available after payment is confirmed.",
            )}
          </p>
        </aside>
      </div>
    </div>
  );
}
