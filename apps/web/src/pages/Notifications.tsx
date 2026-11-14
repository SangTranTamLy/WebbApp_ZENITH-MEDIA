import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCheck, Trash2 } from "lucide-react";
import { localized, type Notification } from "@zenith/shared/browser";
import { useResource } from "../lib/useResource";
import { useShop } from "../lib/context";
import { api, errorMessage, patch, post } from "../lib/api";
import { AccountNav } from "../components/Layout";
import { Empty, ErrorState, Loading, PageHead } from "../components/Primitives";

export function Notifications() {
  const { t, locale, refreshMe, toast } = useShop();
  const { data, error, loading, reload } =
    useResource<Notification[]>("/notifications");
  const [unread, setUnread] = useState(false);
  async function action(work: () => Promise<unknown>) {
    try {
      await work();
      reload();
      await refreshMe();
    } catch (e) {
      toast(errorMessage(e, locale));
    }
  }
  const shown = data?.filter((n) => !unread || !n.read);
  return (
    <div className="container account-page">
      <AccountNav />
      <PageHead
        title={t("Thông báo", "Notifications")}
        description={t(
          "Cập nhật về sản phẩm, đơn hàng và hỗ trợ.",
          "Updates on your assets, orders and support.",
        )}
      >
        <button
          className="button secondary"
          onClick={() => void action(() => post("/notifications/read-all"))}
        >
          <CheckCheck size={17} />
          {t("Đánh dấu tất cả đã đọc", "Mark all as read")}
        </button>
      </PageHead>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={unread}
          onChange={(e) => setUnread(e.target.checked)}
        />
        {t("Chỉ chưa đọc", "Unread only")}
      </label>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : shown?.length ? (
        <div className="notification-list">
          {shown.map((n) => (
            <article
              className={`notification-row ${n.read ? "" : "unread"}`}
              key={n.id}
            >
              <Link
                to={n.href}
                onClick={() =>
                  void action(() =>
                    patch(`/notifications/${n.id}`, { read: true }),
                  )
                }
              >
                <h3>{localized(n.title, locale)}</h3>
                <p>{localized(n.body, locale)}</p>
                <time>{new Date(n.createdAt).toLocaleString(locale)}</time>
              </Link>
              <button
                className="text-button"
                onClick={() =>
                  void action(() =>
                    patch(`/notifications/${n.id}`, { read: !n.read }),
                  )
                }
              >
                {n.read
                  ? t("Chưa đọc", "Mark unread")
                  : t("Đã đọc", "Mark read")}
              </button>
              <button
                className="icon-button"
                aria-label={t("Xóa thông báo", "Delete notification")}
                onClick={() =>
                  void action(() =>
                    api(`/notifications/${n.id}`, { method: "DELETE" }),
                  )
                }
              >
                <Trash2 size={17} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title={t("Bạn đã xem hết thông báo", "You’re all caught up")}
          body={t(
            "Thông báo mới sẽ xuất hiện ở đây.",
            "New notifications will appear here.",
          )}
        />
      )}
    </div>
  );
}
