import { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Paperclip, Plus, Send } from "lucide-react";
import type { Order, Ticket, TicketMessage } from "@zenith/shared/browser";
import { useShop } from "../lib/context";
import { useResource } from "../lib/useResource";
import { errorMessage, patch, post } from "../lib/api";
import { AccountNav } from "../components/Layout";
import {
  Empty,
  ErrorState,
  Loading,
  PageHead,
  Status,
} from "../components/Primitives";
import { UploadPicker } from "../components/UploadPicker";

export function Support() {
  const { t, locale } = useShop();
  const { data, error, loading, reload } = useResource<Ticket[]>("/tickets");
  return (
    <div className="container account-page">
      <AccountNav />
      <PageHead
        title={t("Hỗ trợ của bạn", "Your support tickets")}
        description={t(
          "Gửi yêu cầu khi cần hỗ trợ về đơn hàng hoặc sản phẩm.",
          "Get help with an order or an asset.",
        )}
      >
        <Link className="button" to="/support/new">
          <Plus size={17} />
          {t("Tạo Ticket", "New ticket")}
        </Link>
      </PageHead>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : data?.length ? (
        <div className="ticket-list">
          {data.map((ticket) => (
            <Link
              to={`/support/${ticket.id}`}
              className="ticket-row"
              key={ticket.id}
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
        </div>
      ) : (
        <Empty
          title={t("Chưa có yêu cầu hỗ trợ", "No support tickets yet")}
          body={t(
            "Bạn có thể tạo Ticket từ chi tiết đơn hàng bất cứ khi nào cần.",
            "You can create a ticket from your order details whenever you need help.",
          )}
        />
      )}
    </div>
  );
}
export function NewTicket() {
  const { t, locale } = useShop();
  const [params] = useSearchParams();
  const { data: orders } = useResource<Order[]>("/orders");
  const [orderId, setOrderId] = useState(params.get("order") ?? ""),
    [subject, setSubject] = useState(""),
    [body, setBody] = useState(""),
    [fileIds, setFileIds] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [uploadsPending, setUploadsPending] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const ticket = await post<Ticket>("/tickets", {
        orderId,
        subject,
        body,
        fileIds,
      });
      navigate(`/support/${ticket.id}`);
    } catch (e) {
      setError(errorMessage(e, locale));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container account-page">
      <AccountNav />
      <PageHead
        title={t("Tạo yêu cầu hỗ trợ", "Create a support ticket")}
        description={t(
          "Ticket được xử lý theo thứ tự gửi đến.",
          "Tickets are handled in the order they arrive.",
        )}
      />
      <form className="form-panel narrow-form" onSubmit={(e) => void submit(e)}>
        <label>
          {t("Đơn hàng liên quan", "Related order")}
          <select
            required
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          >
            <option value="">{t("Chọn đơn hàng", "Select an order")}</option>
            {orders?.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("Tiêu đề", "Subject")}
          <input
            required
            minLength={3}
            maxLength={180}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </label>
        <label>
          {t("Nội dung cần hỗ trợ", "How can we help?")}
          <textarea
            required
            rows={6}
            maxLength={10000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <UploadPicker
          onReady={setFileIds}
          onPendingChange={setUploadsPending}
        />
        {error && <ErrorState message={error} />}
        <button
          className="button"
          disabled={busy || uploadsPending || fileIds.length > 5}
        >
          <Send size={16} />
          {t("Gửi Ticket", "Send ticket")}
        </button>
      </form>
    </div>
  );
}
export function TicketDetail() {
  const { id } = useParams();
  const { t, locale, me, toast } = useShop();
  const { data, error, loading, reload } = useResource<{
    ticket: Ticket;
    messages: TicketMessage[];
  }>(`/tickets/${id}`);
  const [body, setBody] = useState(""),
    [files, setFiles] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [uploadsPending, setUploadsPending] = useState(false),
    [version, setVersion] = useState(0);
  async function action(work: () => Promise<unknown>) {
    setBusy(true);
    try {
      await work();
      reload();
    } catch (e) {
      toast(errorMessage(e, locale));
    } finally {
      setBusy(false);
    }
  }
  if (loading && !data) return <Loading />;
  if (error || !data)
    return (
      <div className="container">
        <ErrorState message={error} retry={reload} />
      </div>
    );
  return (
    <div className="container account-page">
      <AccountNav />
      <PageHead title={data.ticket.subject} description={data.ticket.orderId}>
        <Status value={data.ticket.status} />
        <button
          className="button secondary"
          disabled={busy}
          onClick={() =>
            void action(() =>
              patch(`/tickets/${id}`, {
                status: data.ticket.status === "open" ? "closed" : "open",
              }),
            )
          }
        >
          {data.ticket.status === "open"
            ? t("Đóng Ticket", "Close ticket")
            : t("Mở lại Ticket", "Reopen ticket")}
        </button>
      </PageHead>
      <div className="ticket-conversation">
        {data.messages.map((m) => (
          <article
            key={m.id}
            className={`ticket-message ${m.admin ? "from-admin" : ""}`}
          >
            <div className="message-meta">
              <strong>
                {m.admin
                  ? "ZENITH Support"
                  : m.userId === me?.actor.id
                    ? t("Bạn", "You")
                    : t("Khách hàng", "Customer")}
              </strong>
              <time>{new Date(m.createdAt).toLocaleString(locale)}</time>
            </div>
            <p className="preserve-lines">{m.body}</p>
            {m.fileIds.map((fid) => (
              <button
                className="text-button"
                key={fid}
                onClick={() =>
                  void action(async () => {
                    const result = await post<{ url: string }>(
                      `/tickets/${id}/files/${fid}`,
                    );
                    location.assign(result.url);
                  })
                }
              >
                <Paperclip size={16} />
                {t("Tải file đính kèm", "Download attachment")}
              </button>
            ))}
          </article>
        ))}
      </div>
      {data.ticket.status === "open" && (
        <form
          className="form-panel"
          onSubmit={(e) => {
            e.preventDefault();
            void action(async () => {
              await post(`/tickets/${id}/messages`, { body, fileIds: files });
              setBody("");
              setFiles([]);
              setVersion((v) => v + 1);
            });
          }}
        >
          <label>
            {t("Trả lời", "Reply")}
            <textarea
              rows={5}
              required
              maxLength={10000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <UploadPicker
            key={version}
            onReady={setFiles}
            onPendingChange={setUploadsPending}
          />
          <button
            className="button"
            disabled={busy || uploadsPending || files.length > 5}
          >
            <Send size={17} />
            {t("Gửi trả lời", "Send reply")}
          </button>
        </form>
      )}
    </div>
  );
}
