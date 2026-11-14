import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Check, Copy, Download, LifeBuoy } from "lucide-react";
import { localized, type Order } from "@zenith/shared/browser";
import { useResource } from "../lib/useResource";
import { useShop } from "../lib/context";
import { errorMessage, post } from "../lib/api";
import { AccountNav } from "../components/Layout";
import {
  Empty,
  ErrorState,
  Loading,
  PageHead,
  Status,
} from "../components/Primitives";
import { PriceSummary } from "./Checkout";
import { isDemo } from "../lib/supabase";

export function Orders() {
  const { t, locale, money } = useShop();
  const { data, error, loading, reload } = useResource<Order[]>("/orders");
  return (
    <div className="container account-page">
      <AccountNav />
      <PageHead
        title={t("Đơn hàng của bạn", "Your orders")}
        description={t(
          "Theo dõi thanh toán và xem lại thông tin mua hàng.",
          "Track payments and revisit your purchases.",
        )}
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : data?.length ? (
        <div className="orders-table table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("Đơn hàng", "Order")}</th>
                <th>{t("Ngày tạo", "Created")}</th>
                <th>{t("Sản phẩm", "Assets")}</th>
                <th>{t("Tổng tiền", "Total")}</th>
                <th>{t("Trạng thái", "Status")}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/orders/${o.id}`}>{o.id}</Link>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleDateString(locale)}</td>
                  <td>
                    {o.lines.map((l) => localized(l.title, locale)).join(", ")}
                  </td>
                  <td>{money(o.totalVnd)}</td>
                  <td>
                    <Status value={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          title={t("Chưa có đơn hàng", "No orders yet")}
          body={t(
            "Những lần mua hàng của bạn sẽ xuất hiện ở đây.",
            "Your purchases will appear here.",
          )}
          href="/shop"
          label={t("Khám phá sản phẩm", "Explore assets")}
        />
      )}
    </div>
  );
}
export function OrderDetail() {
  const { id } = useParams();
  const { t, locale, toast, refreshMe, money } = useShop();
  const {
    data: order,
    error,
    loading,
    reload,
    setData,
  } = useResource<Order>(`/orders/${id}`);
  const [busy, setBusy] = useState(false),
    [actionError, setActionError] = useState(""),
    [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (order?.status !== "reported") return;
    const timer = setInterval(() => {
      reload();
      void refreshMe();
    }, 15000);
    return () => clearInterval(timer);
  }, [order?.status, reload, refreshMe]);
  if (loading && !order) return <Loading />;
  if (error || !order)
    return (
      <div className="container">
        <ErrorState message={error} retry={reload} />
      </div>
    );
  const remaining = Math.max(
    0,
    Math.floor((new Date(order.expiresAt).getTime() - now) / 1000),
  );
  const state =
    order.status === "pending" && remaining === 0 ? "expired" : order.status;
  const qr = `https://img.vietqr.io/image/${order.bank.bin}-${order.bank.account}-compact2.png?${new URLSearchParams({ amount: String(order.totalVnd), addInfo: order.id, accountName: order.bank.name })}`;
  async function report() {
    setBusy(true);
    setActionError("");
    try {
      setData(await post<Order>(`/orders/${id}/report`));
    } catch (e) {
      setActionError(errorMessage(e, locale));
    } finally {
      setBusy(false);
    }
  }
  const copy = (value: string) => {
    void navigator.clipboard
      .writeText(value)
      .then(() => toast(t("Đã sao chép", "Copied")))
      .catch(() =>
        toast(
          t(
            "Không thể sao chép. Vui lòng chọn và sao chép thủ công.",
            "Unable to copy. Please select and copy the text.",
          ),
        ),
      );
  };
  return (
    <div className="container account-page">
      <AccountNav />
      <PageHead
        title={t("Chi tiết đơn hàng", "Order details")}
        description={order.id}
      >
        <Status value={state} />
      </PageHead>
      <div className="checkout-grid">
        <div>
          {state === "pending" && (
            <section className="bank-panel">
              <h2>
                {t(
                  "Quét mã để chuyển khoản MB Bank",
                  "Scan to pay with MB Bank",
                )}
              </h2>
              <p>
                {t("QR còn hiệu lực", "QR expires in")}{" "}
                <strong>
                  {String(Math.floor(remaining / 60)).padStart(2, "0")}:
                  {String(remaining % 60).padStart(2, "0")}
                </strong>
              </p>
              {isDemo ? (
                <div className="demo-qr">
                  <span className="bank-mark">MB</span>
                  <strong>{t("THANH TOÁN DEMO", "DEMO PAYMENT")}</strong>
                  <p>
                    {t(
                      "Không chuyển tiền thật. Bấm báo chuyển khoản để kiểm tra luồng.",
                      "Do not send money. Report a transfer to test the workflow.",
                    )}
                  </p>
                </div>
              ) : (
                <img
                  className="vietqr"
                  src={qr}
                  alt={t("Mã VietQR MB Bank", "MB Bank VietQR code")}
                />
              )}
              <dl className="bank-details">
                {[
                  [t("Người nhận", "Recipient"), order.bank.name],
                  [t("Số tài khoản", "Account number"), order.bank.account],
                  [t("Số tiền", "Amount"), `${order.totalVnd} VND`],
                  [t("Nội dung chuyển khoản", "Transfer reference"), order.id],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>
                      <span>{value}</span>
                      <button
                        className="icon-button"
                        onClick={() => copy(value)}
                        aria-label={`${t("Sao chép", "Copy")} ${label}`}
                      >
                        <Copy size={15} />
                      </button>
                    </dd>
                  </div>
                ))}
              </dl>
              <button
                className="button full"
                disabled={busy}
                onClick={() => void report()}
              >
                {t(
                  "Tôi đã chuyển khoản MB Bank",
                  "I have transferred via MB Bank",
                )}
              </button>
              <p className="small muted">
                {t(
                  "Thao tác này chỉ báo Admin kiểm tra, chưa cấp quyền tải.",
                  "This asks an admin to verify your payment. It does not unlock downloads.",
                )}
              </p>
            </section>
          )}
          {state === "reported" && (
            <div className="order-state">
              <span className="state-icon">MB</span>
              <h2>
                {t("Đang chờ Admin xác nhận", "Awaiting payment confirmation")}
              </h2>
              <p>
                {t(
                  "Chúng tôi đã nhận thông báo chuyển khoản. Bạn có thể rời trang và kiểm tra lại trong Đơn hàng.",
                  "Your transfer report has been received. You can leave this page and return through Orders.",
                )}
              </p>
              <button className="button secondary" onClick={reload}>
                {t("Kiểm tra trạng thái", "Check status")}
              </button>
            </div>
          )}
          {state === "paid" && (
            <div className="order-state">
              <span className="state-icon">
                <Check size={28} />
              </span>
              <h2>{t("Sản phẩm đã sẵn sàng", "Your assets are ready")}</h2>
              <p>
                {t(
                  "Đơn hàng đã hoàn tất. Hãy mở Thư viện để tải file.",
                  "Payment is confirmed. Open My Library to download your files.",
                )}
              </p>
              <Link className="button" to="/library">
                <Download size={18} />
                {t("Mở Thư viện", "Open My Library")}
              </Link>
            </div>
          )}
          {["expired", "support"].includes(state) && (
            <div className="notice-box">
              <h2>
                {t("Đơn hàng cần kiểm tra", "This order needs attention")}
              </h2>
              <p>
                {t(
                  "Nếu bạn đã chuyển tiền hoặc số tiền/nội dung chưa chính xác, hãy tạo Ticket để Admin đối chiếu.",
                  "If you transferred money or the amount/reference differs, create a ticket for the admin to investigate.",
                )}
              </p>
            </div>
          )}
          {actionError && <ErrorState message={actionError} />}
          <Link className="support-link" to={`/support/new?order=${order.id}`}>
            <LifeBuoy size={18} />
            {t("Cần hỗ trợ với đơn hàng này", "Get help with this order")}
          </Link>
          {!!order.notes.length && (
            <section className="checkout-section">
              <h3>{t("Ghi chú xử lý", "Resolution notes")}</h3>
              {order.notes.map((note, i) => (
                <p key={i}>{note}</p>
              ))}
            </section>
          )}
        </div>
        <aside className="checkout-summary">
          <h2>{t("Biên nhận đơn hàng", "Order receipt")}</h2>
          <small>{new Date(order.createdAt).toLocaleString(locale)}</small>
          {order.lines.map((line) => (
            <div className="receipt-line" key={line.offerId}>
              <img src={line.cover} alt="" />
              <div>
                <strong>{localized(line.title, locale)}</strong>
                <small>{localized(line.label, locale)}</small>
                <small>
                  {line.release && `${line.release} / `}
                  {money(line.totalVnd)}
                </small>
              </div>
            </div>
          ))}
          <PriceSummary quote={order} />
          <p className="small muted">
            {t(
              "Biên nhận cơ bản. Không thay thế hóa đơn điện tử theo quy định.",
              "Basic receipt. This does not replace a statutory electronic invoice.",
            )}
          </p>
        </aside>
      </div>
    </div>
  );
}
