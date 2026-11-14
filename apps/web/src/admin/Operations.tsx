import { bytes } from "../lib/format";
import { blankText } from "../lib/format";
import { useState } from "react";
import {
  localized,
  type Category,
  type Coupon,
  type Order,
  type Settings,
} from "@zenith/shared/browser";
import { useShop } from "../lib/context";
import { api, errorMessage, patch, post, put } from "../lib/api";
import { ErrorState, Status } from "../components/Primitives";
import { UploadPicker } from "../components/UploadPicker";
import { PriceSummary } from "../pages/Checkout";
import { BilingualField } from "./Fields";
import type { AdminData } from "./types";

export function PaymentReview({
  order,
  reload,
}: {
  order: Order;
  reload: () => void;
}) {
  const { t, locale } = useShop();
  const [reference, setReference] = useState(""),
    [amount, setAmount] = useState(order.totalVnd),
    [note, setNote] = useState(""),
    [exception, setException] = useState(false),
    [verified, setVerified] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function act(action: "confirm" | "support") {
    setBusy(true);
    setError("");
    try {
      await post(
        `/admin/orders/${order.id}/${action}`,
        action === "confirm"
          ? { bankReference: reference, amountVnd: amount, note, exception }
          : { note },
      );
      reload();
    } catch (e) {
      setError(errorMessage(e, locale));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="review-grid">
      <div className="form-panel">
        <h2>
          {t("Đối chiếu giao dịch MB Bank", "Review MB Bank transaction")}
        </h2>
        <p>
          {order.id} / {order.email}
        </p>
        <Status value={order.status} />
        {order.status !== "paid" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void act("confirm");
            }}
          >
            <label>
              {t(
                "Mã giao dịch ngân hàng thực tế",
                "Actual bank transaction reference",
              )}
              <input
                required
                minLength={3}
                maxLength={100}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </label>
            <label>
              {t("Số tiền thực nhận (VND)", "Received amount (VND)")}
              <input
                type="number"
                required
                min={0}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </label>
            <label>
              {t(
                "Ghi chú đối chiếu / ngoại lệ",
                "Reconciliation / exception note",
              )}
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={exception}
                onChange={(e) => setException(e.target.checked)}
              />
              {t(
                "Tôi chấp nhận ngoại lệ số tiền/thời hạn và đã ghi rõ cách xử lý.",
                "I accept the amount/timing exception and documented the resolution.",
              )}
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
              />
              {t(
                "Tôi đã đối chiếu giao dịch trên tài khoản ngân hàng thực tế.",
                "I verified the transaction in the actual bank account.",
              )}
            </label>
            {error && <ErrorState message={error} />}
            <div className="form-actions">
              <button className="button" disabled={busy || !verified}>
                {t(
                  "Xác nhận thanh toán & cấp quyền",
                  "Confirm payment & grant access",
                )}
              </button>
              <button
                className="button secondary"
                type="button"
                disabled={busy || note.trim().length < 5}
                onClick={() => void act("support")}
              >
                {t("Chuyển sang cần hỗ trợ", "Mark for support")}
              </button>
            </div>
          </form>
        )}
      </div>
      <div className="form-panel">
        <h2>{t("Snapshot đơn hàng", "Order snapshot")}</h2>
        {order.lines.map((l) => (
          <p key={l.offerId}>
            {localized(l.title, locale)} / {localized(l.label, locale)}
          </p>
        ))}
        <PriceSummary quote={order} />
        {order.notes.map((n, i) => (
          <p key={i}>{n}</p>
        ))}
      </div>
    </div>
  );
}
export function UploadAdmin({
  data,
  reload,
}: {
  data: AdminData;
  reload: () => void;
}) {
  const { t, locale, toast } = useShop();
  const [purpose, setPurpose] = useState<"product" | "preview-source">(
      "product",
    ),
    [source, setSource] = useState(""),
    [start, setStart] = useState(0),
    [duration, setDuration] = useState(10),
    [restoreId, setRestoreId] = useState(""),
    [replacement, setReplacement] = useState(""),
    [busy, setBusy] = useState(false);
  async function action(work: () => Promise<unknown>) {
    setBusy(true);
    try {
      await work();
      reload();
      toast(t("Đã cập nhật.", "Updated."));
    } catch (e) {
      toast(errorMessage(e, locale));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="form-panel">
        <h2>{t("Upload tập trung", "Upload center")}</h2>
        <label>
          {t("Mục đích upload", "Upload purpose")}
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as typeof purpose)}
          >
            <option value="product">
              {t("File sản phẩm / ZIP / README", "Product file / ZIP / README")}
            </option>
            <option value="preview-source">
              {t("Video nguồn để tạo Preview", "Source video for preview")}
            </option>
          </select>
        </label>
        <UploadPicker
          key={purpose}
          purpose={purpose}
          onReady={() => reload()}
        />
        <button className="button secondary" onClick={reload}>
          {t("Cập nhật trạng thái", "Refresh status")}
        </button>
      </section>
      <section className="form-panel">
        <h2>{t("Tạo Preview nền", "Create a background preview")}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void action(() =>
              post("/admin/jobs", {
                fileId: source,
                type: "preview",
                start,
                duration,
              }),
            );
          }}
        >
          <div className="form-row">
            <label>
              {t("Video nguồn", "Source video")}
              <select
                value={source}
                required
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="">
                  {t("Chọn file đã kiểm tra", "Select a validated file")}
                </option>
                {data.files
                  .filter(
                    (f) => f.status === "ready" && f.type.startsWith("video/"),
                  )
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              {t("Bắt đầu (giây)", "Start (seconds)")}
              <input
                type="number"
                min={0}
                value={start}
                onChange={(e) => setStart(Number(e.target.value))}
              />
            </label>
            <label>
              {t("Thời lượng (giây)", "Duration (seconds)")}
              <input
                type="number"
                min={1}
                max={120}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </label>
          </div>
          <button className="button" disabled={busy || !source}>
            {t("Đưa vào hàng đợi", "Queue preview")}
          </button>
        </form>
      </section>
      <section className="form-panel">
        <h2>{t("Tác vụ xử lý", "Processing jobs")}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t("File / loại", "File / type")}</th>
                <th>{t("Trạng thái", "Status")}</th>
                <th>{t("Lần chạy", "Attempts")}</th>
                <th>{t("Thao tác", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {data.jobs.map((j) => (
                <tr key={j.id}>
                  <td>
                    {data.files.find((f) => f.id === j.fileId)?.name}
                    <small>
                      {j.type} / {j.start}s / {j.duration}s
                    </small>
                    {j.error && <p className="error-text">{j.error}</p>}
                  </td>
                  <td>
                    <Status value={j.status} />
                  </td>
                  <td>{j.attempts}</td>
                  <td>
                    {j.status === "failed" && (
                      <button
                        className="button secondary"
                        disabled={busy}
                        onClick={() =>
                          void action(() => post(`/admin/jobs/${j.id}/retry`))
                        }
                      >
                        {t("Thử lại", "Retry")}
                      </button>
                    )}
                    {j.outputUrl && (
                      <a href={j.outputUrl} target="_blank" rel="noreferrer">
                        {t("Xem Preview", "View preview")}
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="form-panel">
        <h2>{t("File trong kho", "Stored files")}</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>{t("Dung lượng", "Size")}</th>
                <th>{t("Trạng thái", "Status")}</th>
                <th>{t("Thao tác", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {data.files.map((f) => (
                <tr key={f.id}>
                  <td>
                    {f.name}
                    <small>{f.id}</small>
                    {f.zip && (
                      <details>
                        <summary>ZIP: {f.zip.status}</summary>
                        {[...f.zip.errors, ...f.zip.warnings].map((m, i) => (
                          <p key={i}>{m}</p>
                        ))}
                        <small>
                          {f.zip.entries.length}{" "}
                          {t("file thành phần", "entries")}
                        </small>
                      </details>
                    )}
                  </td>
                  <td>{bytes(f.size)}</td>
                  <td>
                    <Status value={f.status} />
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() =>
                          void action(() => post(`/admin/files/${f.id}/check`))
                        }
                      >
                        {t("Kiểm tra", "Check")}
                      </button>
                      <button
                        className="text-button danger-text"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              t(
                                "Xóa file nếu không còn được tham chiếu?",
                                "Delete this file only if no records reference it?",
                              ),
                            )
                          )
                            void action(() =>
                              api(`/admin/files/${f.id}`, { method: "DELETE" }),
                            );
                        }}
                      >
                        {t("Xóa file chưa dùng", "Delete unused")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="form-panel">
        <h2>{t("Khôi phục file bị lỗi", "Restore a missing file")}</h2>
        <p>
          {t(
            "Upload bản gốc từ máy tính trước. Checksum phải trùng tuyệt đối; khách liên quan nhận thông báo trong tài khoản.",
            "Upload the original backup first. Its checksum must match exactly; affected customers receive an account notification.",
          )}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void action(() =>
              post(`/admin/files/${restoreId}/restore`, {
                replacementId: replacement,
              }),
            );
          }}
        >
          <div className="form-row">
            <label>
              {t("File cần khôi phục", "Missing file")}
              <select
                required
                value={restoreId}
                onChange={(e) => setRestoreId(e.target.value)}
              >
                <option value="">{t("Chọn file", "Select file")}</option>
                {data.files
                  .filter((f) => f.status === "missing")
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              {t("Bản gốc vừa upload", "Uploaded backup")}
              <select
                required
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
              >
                <option value="">{t("Chọn file", "Select file")}</option>
                {data.files
                  .filter((f) => f.status === "ready")
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} / {f.id}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <button className="button" disabled={busy}>
            {t("Xác minh & khôi phục", "Verify & restore")}
          </button>
        </form>
      </section>
    </>
  );
}
export function CategoriesAdmin({
  data,
  reload,
}: {
  data: AdminData;
  reload: () => void;
}) {
  const { t, locale } = useShop();
  const blank = (): Category => ({
    id: crypto.randomUUID(),
    name: blankText(),
    parentId: null,
    position: 0,
    active: true,
  });
  const [value, setValue] = useState<Category>(blank),
    [error, setError] = useState("");
  return (
    <div className="admin-split">
      <div className="form-panel">
        {data.categories.map((c) => (
          <button
            className="category-row"
            key={c.id}
            onClick={() => setValue(c)}
          >
            <span>
              {c.parentId ? "↳ " : ""}
              {localized(c.name, locale)}
            </span>
            <Status value={c.active ? "active" : "hidden"} />
          </button>
        ))}
        <button className="button secondary" onClick={() => setValue(blank())}>
          {t("Thêm danh mục", "Add category")}
        </button>
      </div>
      <form
        className="form-panel"
        onSubmit={(e) => {
          e.preventDefault();
          void put(`/admin/categories/${value.id}`, value)
            .then(reload)
            .catch((e) => setError(errorMessage(e, locale)));
        }}
      >
        <BilingualField
          label={t("Tên danh mục", "Category name")}
          value={value.name}
          onChange={(name) => setValue({ ...value, name })}
        />
        <label>
          {t("Danh mục cha", "Parent category")}
          <select
            value={value.parentId ?? ""}
            onChange={(e) =>
              setValue({ ...value, parentId: e.target.value || null })
            }
          >
            <option value="">{t("Danh mục gốc", "Top level")}</option>
            {data.categories
              .filter((c) => !c.parentId && c.id !== value.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {localized(c.name, locale)}
                </option>
              ))}
          </select>
        </label>
        <label>
          {t("Thứ tự", "Position")}
          <input
            type="number"
            value={value.position}
            onChange={(e) =>
              setValue({ ...value, position: Number(e.target.value) })
            }
          />
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={value.active}
            onChange={(e) => setValue({ ...value, active: e.target.checked })}
          />
          {t("Hoạt động", "Active")}
        </label>
        {error && <ErrorState message={error} />}
        <button className="button">{t("Lưu danh mục", "Save category")}</button>
      </form>
    </div>
  );
}
export function CouponsAdmin({
  data,
  reload,
}: {
  data: AdminData;
  reload: () => void;
}) {
  const { t, locale } = useShop();
  const blank = (): Coupon => ({
    id: crypto.randomUUID(),
    code: "",
    kind: "percent",
    value: 10,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    minVnd: 0,
    maxUses: 100,
    perUser: 1,
    productIds: [],
    stackOwnership: false,
    active: true,
  });
  const [value, setValue] = useState<Coupon>(blank),
    [error, setError] = useState("");
  const set = <K extends keyof Coupon>(key: K, v: Coupon[K]) =>
    setValue((current) => ({ ...current, [key]: v }));
  return (
    <div className="admin-split">
      <div className="form-panel">
        {data.coupons.map((c) => (
          <button
            className="category-row"
            key={c.id}
            onClick={() => setValue(c)}
          >
            <strong>{c.code}</strong>
            <span>
              {c.value}
              {c.kind === "percent" ? "%" : " VND"}
            </span>
          </button>
        ))}
        <button className="button secondary" onClick={() => setValue(blank())}>
          {t("Tạo Coupon", "Create coupon")}
        </button>
      </div>
      <form
        className="form-panel"
        onSubmit={(e) => {
          e.preventDefault();
          void put(`/admin/coupons/${value.id}`, value)
            .then(reload)
            .catch((e) => setError(errorMessage(e, locale)));
        }}
      >
        <label>
          {t("Mã Coupon", "Coupon code")}
          <input
            required
            value={value.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
          />
        </label>
        <div className="form-row">
          <label>
            {t("Loại giảm", "Discount type")}
            <select
              value={value.kind}
              onChange={(e) => set("kind", e.target.value as Coupon["kind"])}
            >
              <option value="percent">%</option>
              <option value="fixed">VND</option>
            </select>
          </label>
          {(["value", "minVnd", "maxUses", "perUser"] as const).map(
            (key, i) => (
              <label key={key}>
                {
                  [
                    t("Giá trị", "Value"),
                    t("Tối thiểu VND", "Minimum VND"),
                    t("Tổng lượt dùng", "Total uses"),
                    t("Lượt mỗi khách", "Uses per customer"),
                  ][i]
                }
                <input
                  type="number"
                  min={key === "value" || key === "minVnd" ? 0 : 1}
                  value={value[key]}
                  onChange={(e) => set(key, Number(e.target.value))}
                />
              </label>
            ),
          )}
        </div>
        <div className="form-row">
          {(["startsAt", "endsAt"] as const).map((key) => (
            <label key={key}>
              {key === "startsAt"
                ? t("Bắt đầu (UTC)", "Starts (UTC)")
                : t("Kết thúc (UTC)", "Ends (UTC)")}
              <input
                type="datetime-local"
                required
                value={value[key].slice(0, 16)}
                onChange={(e) => {
                  if (e.target.value)
                    set(key, new Date(`${e.target.value}Z`).toISOString());
                }}
              />
            </label>
          ))}
        </div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={value.stackOwnership}
            onChange={(e) => set("stackOwnership", e.target.checked)}
          />
          {t(
            "Cho phép cộng dồn với giảm giá đã sở hữu",
            "Allow stacking with ownership credits",
          )}
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={value.active}
            onChange={(e) => set("active", e.target.checked)}
          />
          {t("Kích hoạt", "Active")}
        </label>
        <fieldset>
          <legend>
            {t(
              "Sản phẩm áp dụng (bỏ trống = tất cả)",
              "Eligible products (empty = all)",
            )}
          </legend>
          {data.products.map((p) => (
            <label className="checkbox" key={p.id}>
              <input
                type="checkbox"
                checked={value.productIds.includes(p.id)}
                onChange={(e) =>
                  set(
                    "productIds",
                    e.target.checked
                      ? [...value.productIds, p.id]
                      : value.productIds.filter((v) => v !== p.id),
                  )
                }
              />
              {localized(p.draft.title, locale)}
            </label>
          ))}
        </fieldset>
        {error && <ErrorState message={error} />}
        <button className="button">{t("Lưu Coupon", "Save coupon")}</button>
      </form>
    </div>
  );
}
export function SettingsAdmin({
  data,
  reload,
}: {
  data: AdminData;
  reload: () => void;
}) {
  const { t, locale, toast, reloadConfig } = useShop();
  const [value, setValue] = useState<Settings>(data.settings),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const set = <K extends keyof Settings>(key: K, v: Settings[K]) =>
    setValue((current) => ({ ...current, [key]: v }));
  return (
    <form
      className="form-panel"
      onSubmit={(e) => {
        e.preventDefault();
        setBusy(true);
        void put("/admin/settings", value)
          .then(() => {
            reload();
            void reloadConfig();
            toast(t("Đã lưu cấu hình.", "Settings saved."));
          })
          .catch((e) => setError(errorMessage(e, locale)))
          .finally(() => setBusy(false));
      }}
    >
      <BilingualField
        label={t("Tiêu đề Hero", "Hero title")}
        value={value.heroTitle}
        onChange={(v) => set("heroTitle", v)}
      />
      <BilingualField
        multiline
        label={t("Mô tả Hero", "Hero description")}
        value={value.heroDescription}
        onChange={(v) => set("heroDescription", v)}
      />
      <label>
        {t("Sản phẩm trên Hero", "Hero product")}
        <select
          value={value.heroProductId ?? ""}
          onChange={(e) => set("heroProductId", e.target.value || null)}
        >
          <option value="">{t("Chưa chọn", "None selected")}</option>
          {data.products
            .filter((p) => p.status === "active")
            .map((p) => (
              <option value={p.id} key={p.id}>
                {localized(p.draft.title, locale)}
              </option>
            ))}
        </select>
      </label>
      <label>
        {t("Video trên Hero", "Hero preview")}
        <select
          value={value.heroMediaId ?? ""}
          onChange={(e) => set("heroMediaId", e.target.value || null)}
        >
          <option value="">{t("Preview chính", "Main preview")}</option>
          {data.products
            .find((p) => p.id === value.heroProductId)
            ?.published?.media.filter((m) => m.type === "video")
            .map((m) => (
              <option value={m.id} key={m.id}>
                {localized(m.label, locale)}
              </option>
            ))}
        </select>
      </label>
      <div className="form-row">
        <label>
          {t("Watermark toàn website", "Site-wide watermark")}
          <input
            value={value.watermark}
            onChange={(e) => set("watermark", e.target.value)}
          />
        </label>
        <label>
          {t(
            "Tỷ giá hiển thị: VND / 1 USD",
            "Display exchange rate: VND per USD",
          )}
          <input
            type="number"
            min={1}
            value={value.usdRate}
            onChange={(e) => {
              set("usdRate", Number(e.target.value));
              set("usdRateUpdatedAt", new Date().toISOString());
            }}
          />
        </label>
        <label>
          {t("Phiên bản điều khoản", "Terms version")}
          <input
            value={value.termsVersion}
            onChange={(e) => set("termsVersion", e.target.value)}
          />
        </label>
      </div>
      <BilingualField
        multiline
        label={t("Giấy phép & điều khoản", "License & terms")}
        value={value.license}
        onChange={(v) => set("license", v)}
      />
      <BilingualField
        multiline
        label={t("Chính sách hoàn tiền", "Refund policy")}
        value={value.refund}
        onChange={(v) => set("refund", v)}
      />
      <details>
        <summary>FAQ</summary>
        {value.faq.map((f, i) => (
          <div className="nested-field" key={i}>
            <BilingualField
              label={t("Câu hỏi", "Question")}
              value={f.question}
              onChange={(v) =>
                set(
                  "faq",
                  value.faq.map((s, n) =>
                    n === i ? { ...s, question: v } : s,
                  ),
                )
              }
            />
            <BilingualField
              multiline
              label={t("Trả lời", "Answer")}
              value={f.answer}
              onChange={(v) =>
                set(
                  "faq",
                  value.faq.map((s, n) => (n === i ? { ...s, answer: v } : s)),
                )
              }
            />
            <button
              type="button"
              className="text-button"
              onClick={() =>
                set(
                  "faq",
                  value.faq.filter((_, n) => n !== i),
                )
              }
            >
              {t("Xóa FAQ", "Remove FAQ")}
            </button>
          </div>
        ))}
        <button
          type="button"
          className="button secondary"
          onClick={() =>
            set("faq", [
              ...value.faq,
              { question: blankText(), answer: blankText() },
            ])
          }
        >
          {t("Thêm FAQ", "Add FAQ")}
        </button>
      </details>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={value.legalReviewed}
          onChange={(e) => set("legalReviewed", e.target.checked)}
        />
        {t(
          "Đã rà soát điều khoản và nghĩa vụ pháp lý trước mở bán",
          "Terms and applicable legal obligations have been reviewed",
        )}
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={value.checkoutEnabled}
          onChange={(e) => set("checkoutEnabled", e.target.checked)}
        />
        {t("Cho phép tạo đơn thanh toán", "Enable checkout")}
      </label>
      {error && <ErrorState message={error} />}
      <button className="button" disabled={busy}>
        {t("Lưu cấu hình", "Save settings")}
      </button>
    </form>
  );
}
export function CustomersAdmin({
  data,
  reload,
}: {
  data: AdminData;
  reload: () => void;
}) {
  const { t, locale, me, toast } = useShop();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t("Khách hàng", "Customer")}</th>
            <th>{t("Yêu cầu xóa", "Deletion request")}</th>
            <th>{t("Trạng thái", "Status")}</th>
          </tr>
        </thead>
        <tbody>
          {data.accounts.map((a) => (
            <tr key={a.id}>
              <td>
                {a.name}
                <small>{a.email}</small>
              </td>
              <td>
                {a.deletionRequestedAt ? (
                  <>
                    {new Date(a.deletionRequestedAt).toLocaleString(locale)}
                    {a.deletionProcessedAt ? (
                      <small>{t("Đã xử lý xóa", "Deletion processed")}</small>
                    ) : (
                      <button
                        className="text-button danger-text"
                        onClick={() => {
                          const note = window.prompt(
                            t(
                              "Ghi căn cứ và thời hạn lưu chứng từ sau khi xóa Auth (ít nhất 20 ký tự). Thao tác xóa Auth không thể hoàn tác.",
                              "Document the legal basis and retention period (at least 20 characters). Auth deletion cannot be undone.",
                            ),
                          );
                          if (note && note.trim().length >= 20)
                            void post(`/admin/accounts/${a.id}/delete`, {
                              confirm: true,
                              retentionNote: note,
                            })
                              .then(reload)
                              .catch((e) => toast(errorMessage(e, locale)));
                        }}
                      >
                        {t("Xử lý yêu cầu xóa", "Process deletion request")}
                      </button>
                    )}
                  </>
                ) : (
                  t("Không có", "None")
                )}
              </td>
              <td>
                {a.id !== me?.actor.id && (
                  <button
                    className="button secondary"
                    onClick={() =>
                      void patch(`/admin/accounts/${a.id}`, {
                        blocked: !a.blocked,
                      })
                        .then(reload)
                        .catch((e) => toast(errorMessage(e, locale)))
                    }
                  >
                    {a.blocked
                      ? t("Mở khóa", "Unblock")
                      : t("Tạm khóa", "Block")}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
