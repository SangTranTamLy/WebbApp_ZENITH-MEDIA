import { Link, NavLink, useParams } from "react-router-dom";
import {
  BarChart3,
  Box,
  FileVideo,
  FolderTree,
  LifeBuoy,
  Receipt,
  Settings,
  Tag,
  Users,
  History,
  Plus,
  RefreshCw,
  Bell,
} from "lucide-react";
import { localized } from "@zenith/shared/browser";
import { useShop } from "../lib/context";
import { useResource } from "../lib/useResource";
import { errorMessage, patch, post } from "../lib/api";
import {
  Empty,
  ErrorState,
  Loading,
  PageHead,
  Status,
} from "../components/Primitives";
import type { AdminData } from "./types";
import { ProductEditor } from "./ProductEditor";
import {
  CategoriesAdmin,
  CouponsAdmin,
  CustomersAdmin,
  PaymentReview,
  SettingsAdmin,
  UploadAdmin,
} from "./Operations";

export default function Admin() {
  const { section = "overview", id } = useParams();
  const { t, locale, money, toast } = useShop();
  const { data, error, loading, reload } =
    useResource<AdminData>("/admin/overview");
  const menu = [
    ["overview", t("Tổng quan", "Overview"), BarChart3],
    ["products", t("Sản phẩm", "Products"), Box],
    ["categories", t("Danh mục", "Categories"), FolderTree],
    ["uploads", t("File & Preview", "Files & previews"), FileVideo],
    ["orders", t("Đơn hàng", "Orders"), Receipt],
    ["coupons", "Coupon", Tag],
    ["customers", t("Khách hàng", "Customers"), Users],
    ["support", t("Hỗ trợ", "Support"), LifeBuoy],
    ["notifications", t("Thông báo", "Notifications"), Bell],
    ["settings", t("Cấu hình", "Settings"), Settings],
    ["audit", t("Nhật ký", "Audit log"), History],
  ] as const;
  const title = menu.find((m) => m[0] === section)?.[1] ?? "Admin";
  if (loading && !data) return <Loading />;
  if (error || !data)
    return (
      <div className="container">
        <ErrorState message={error} retry={reload} />
      </div>
    );
  const product = data.products.find((p) => p.id === id);
  const order = data.orders.find((o) => o.id === id);
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-label">
          ZENITH STUDIO<span>ADMIN</span>
        </Link>
        <nav>
          {menu.map(([key, label, Icon]) => (
            <NavLink
              end={key === "overview"}
              to={key === "overview" ? "/admin" : `/admin/${key}`}
              key={key}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <Link className="text-link" to="/">
          {t("Về cửa hàng", "Back to store")}
        </Link>
      </aside>
      <div className="admin-main">
        <PageHead
          title={title}
          description={t(
            "Quản lý cửa hàng sản phẩm số của bạn.",
            "Manage your digital asset store.",
          )}
        >
          <button
            className="icon-button"
            onClick={reload}
            aria-label={t("Làm mới", "Refresh")}
          >
            <RefreshCw size={19} />
          </button>
          {section === "products" && !id && (
            <Link className="button" to="/admin/products/new">
              <Plus size={17} />
              {t("Sản phẩm mới", "New product")}
            </Link>
          )}
        </PageHead>
        {section === "overview" && (
          <>
            <div className="metric-grid">
              {[
                [
                  t("Doanh thu đã xác nhận", "Confirmed revenue"),
                  money(
                    data.orders
                      .filter((o) => o.status === "paid")
                      .reduce((s, o) => s + o.totalVnd, 0),
                  ),
                ],
                [
                  t("Chờ xác nhận", "Awaiting confirmation"),
                  data.orders.filter((o) => o.status === "reported").length,
                ],
                [
                  t("Sản phẩm đang bán", "Published products"),
                  data.products.filter((p) => p.status === "active").length,
                ],
                [
                  t("Ticket đang mở", "Open tickets"),
                  data.tickets.filter((t) => t.status === "open").length,
                ],
              ].map(([label, value]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="admin-overview-columns">
              <section className="form-panel">
                <h2>{t("Cần xử lý", "Needs attention")}</h2>
                {data.orders
                  .filter(
                    (o) => o.status === "reported" || o.status === "support",
                  )
                  .map((o) => (
                    <Link
                      className="category-row"
                      key={o.id}
                      to={`/admin/orders/${o.id}`}
                    >
                      <span>{o.id}</span>
                      <Status value={o.status} />
                    </Link>
                  ))}
                {!data.orders.some((o) =>
                  ["reported", "support"].includes(o.status),
                ) && (
                  <p className="muted">
                    {t(
                      "Chưa có đơn chờ đối chiếu.",
                      "No orders are awaiting review.",
                    )}
                  </p>
                )}
              </section>
              <section className="form-panel">
                <h2>{t("Tình trạng vận hành", "Operations")}</h2>
                <p>
                  {data.jobs.filter((j) => j.status === "queued").length}{" "}
                  {t("tác vụ đang chờ worker", "jobs waiting for the worker")}
                </p>
                <p>
                  {data.files.filter((f) => f.status === "missing").length}{" "}
                  {t("file cần khôi phục", "files need restoration")}
                </p>
                <p>
                  {data.outbox.filter((o) => o.status === "failed").length}{" "}
                  {t("thông báo gửi lỗi", "failed notification deliveries")}
                </p>
                <Link to="/admin/uploads">
                  {t("Quản lý file", "Manage files")}
                </Link>
              </section>
            </div>
          </>
        )}
        {section === "products" &&
          (id ? (
            product || id === "new" ? (
              <ProductEditor
                key={id}
                product={product}
                data={data}
                reload={reload}
              />
            ) : loading ? (
              <Loading />
            ) : (
              <ErrorState
                message={t("Không tìm thấy sản phẩm.", "Product not found.")}
              />
            )
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("Sản phẩm", "Product")}</th>
                    <th>{t("Trạng thái", "Status")}</th>
                    <th>{t("Bản nháp", "Draft")}</th>
                    <th>{t("Thao tác", "Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link to={`/admin/products/${p.id}`}>
                          {localized(p.draft.title, locale)}
                        </Link>
                        <small>{p.draft.kind}</small>
                      </td>
                      <td>
                        <Status value={p.status} />
                      </td>
                      <td>{p.revision}</td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/admin/products/${p.id}`}>
                            {t("Chỉnh sửa", "Edit")}
                          </Link>
                          {(["hidden", "retired"] as const).map((status) => (
                            <button
                              className="text-button"
                              key={status}
                              onClick={() =>
                                void patch(`/admin/products/${p.id}/status`, {
                                  status,
                                })
                                  .then(reload)
                                  .catch((e) => toast(errorMessage(e, locale)))
                              }
                            >
                              {status === "hidden"
                                ? t("Tạm ẩn", "Hide")
                                : t("Ngừng bán", "Retire")}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        {section === "orders" &&
          (order ? (
            <PaymentReview key={order.id} order={order} reload={reload} />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t("Đơn hàng", "Order")}</th>
                    <th>Email</th>
                    <th>{t("Tổng tiền", "Total")}</th>
                    <th>{t("Trạng thái", "Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.orders]
                    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                    .map((o) => (
                      <tr key={o.id}>
                        <td>
                          <Link to={`/admin/orders/${o.id}`}>{o.id}</Link>
                          <small>
                            {new Date(o.createdAt).toLocaleString(locale)}
                          </small>
                        </td>
                        <td>{o.email}</td>
                        <td>{money(o.totalVnd)}</td>
                        <td>
                          <Status value={o.status} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ))}
        {section === "categories" && (
          <CategoriesAdmin data={data} reload={reload} />
        )}{" "}
        {section === "uploads" && <UploadAdmin data={data} reload={reload} />}{" "}
        {section === "coupons" && <CouponsAdmin data={data} reload={reload} />}{" "}
        {section === "settings" && (
          <SettingsAdmin data={data} reload={reload} />
        )}{" "}
        {section === "customers" && (
          <CustomersAdmin data={data} reload={reload} />
        )}{" "}
        {section === "support" && (
          <div className="ticket-list">
            {[...data.tickets]
              .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
              .map((ticket) => (
                <Link
                  key={ticket.id}
                  to={`/support/${ticket.id}`}
                  className="ticket-row"
                >
                  <div>
                    <strong>{ticket.subject}</strong>
                    <small>
                      {ticket.orderId} /{" "}
                      {new Date(ticket.createdAt).toLocaleString(locale)}
                    </small>
                  </div>
                  <Status value={ticket.status} />
                </Link>
              ))}
            {!data.tickets.length && (
              <Empty
                title={t("Chưa có Ticket", "No tickets yet")}
                body={t(
                  "Yêu cầu hỗ trợ sẽ xuất hiện theo thứ tự gửi đến.",
                  "Support requests appear in arrival order.",
                )}
              />
            )}
          </div>
        )}
        {section === "notifications" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("Sự kiện", "Event")}</th>
                  <th>{t("Kênh", "Channel")}</th>
                  <th>{t("Trạng thái", "Status")}</th>
                  <th>{t("Thao tác", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {data.outbox.map((o) => (
                  <tr key={o.id}>
                    <td>
                      {o.title}
                      <small>{o.event}</small>
                      {o.error && <p className="error-text">{o.error}</p>}
                    </td>
                    <td>{o.channel}</td>
                    <td>
                      <Status value={o.status} />
                    </td>
                    <td>
                      {o.status === "failed" && (
                        <button
                          className="button secondary"
                          onClick={() =>
                            void post(`/admin/outbox/${o.id}/retry`)
                              .then(reload)
                              .catch((e) => toast(errorMessage(e, locale)))
                          }
                        >
                          {t("Gửi lại", "Retry")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {section === "audit" && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t("Thời gian", "Time")}</th>
                  <th>{t("Hành động", "Action")}</th>
                  <th>{t("Đối tượng", "Target")}</th>
                  <th>{t("Chi tiết", "Details")}</th>
                </tr>
              </thead>
              <tbody>
                {data.audit.map((a) => (
                  <tr key={a.id}>
                    <td>{new Date(a.createdAt).toLocaleString(locale)}</td>
                    <td>
                      {a.action}
                      <small>{a.actorId}</small>
                    </td>
                    <td>{a.targetId}</td>
                    <td>
                      <code>{JSON.stringify(a.detail)}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
