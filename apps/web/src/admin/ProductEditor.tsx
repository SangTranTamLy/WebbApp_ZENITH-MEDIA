import { blankText } from "../lib/format";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Save, Send, Trash2 } from "lucide-react";
import {
  localized,
  type Offer,
  type Product,
  type ProductContent,
} from "@zenith/shared/browser";
import type { AdminData } from "./types";
import { useShop } from "../lib/context";
import { errorMessage, post, put } from "../lib/api";
import { ErrorState, Status } from "../components/Primitives";
import { UploadPicker } from "../components/UploadPicker";
import { BilingualField } from "./Fields";

const initialContent = (categoryId: string): ProductContent => ({
  slug: "new-asset",
  title: blankText(),
  description: blankText(),
  instructions: blankText(),
  kind: "video",
  categoryId,
  tags: [],
  priority: 0,
  cover: "",
  media: [],
  mainPreviewJobId: null,
  offerIds: [],
  relatedIds: [],
  specs: [],
  dependencies: [],
});
export function ProductEditor({
  product,
  data,
  reload,
}: {
  product?: Product;
  data: AdminData;
  reload: () => void;
}) {
  const { t, locale, toast } = useShop();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ProductContent>(
      product?.draft ?? initialContent(data.categories[0]?.id ?? "video"),
    ),
    [revision, setRevision] = useState(product?.revision ?? 0),
    [id] = useState(product?.id ?? crypto.randomUUID()),
    [exists, setExists] = useState(!!product),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [ack, setAck] = useState(false);
  const set = <K extends keyof ProductContent>(
    key: K,
    value: ProductContent[K],
  ) => setDraft((current) => ({ ...current, [key]: value }));
  async function save(publish = false) {
    setBusy(true);
    setError("");
    try {
      const saved = await put<Product>(`/admin/products/${id}/draft`, {
        content: draft,
        revision,
      });
      setRevision(saved.revision);
      setExists(true);
      if (publish) {
        const published = await post<Product>(`/admin/products/${id}/publish`, {
          revision: saved.revision,
          acknowledgeWarnings: ack,
        });
        setRevision(published.revision);
      }
      toast(
        publish
          ? t("Đã công bố sản phẩm.", "Product published.")
          : t("Đã lưu bản nháp.", "Draft saved."),
      );
      reload();
      if (!exists) navigate(`/admin/products/${id}`);
    } catch (e) {
      setError(errorMessage(e, locale));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-editor">
      <div className="editor-toolbar">
        <div>
          <h2>
            {product
              ? t("Chỉnh sửa bản nháp", "Edit product draft")
              : t("Sản phẩm mới", "New product")}
          </h2>
          <p>
            {t(
              "Bản đang bán chỉ thay đổi sau khi bạn xác nhận công bố.",
              "Live content changes only after you publish the draft.",
            )}
          </p>
        </div>
        {product && <Status value={product.status} />}
      </div>
      <div className="form-panel">
        <BilingualField
          label={t("Tên sản phẩm", "Product title")}
          value={draft.title}
          onChange={(v) => set("title", v)}
        />
        <div className="form-row">
          <label>
            Slug
            <input
              value={draft.slug}
              onChange={(e) => set("slug", e.target.value)}
            />
          </label>
          <label>
            {t("Loại sản phẩm", "Product type")}
            <select
              value={draft.kind}
              onChange={(e) =>
                set("kind", e.target.value as ProductContent["kind"])
              }
            >
              <option value="video">Video & Overlay</option>
              <option value="ae">After Effects</option>
              <option value="bundle">Bundle</option>
            </select>
          </label>
          <label>
            {t("Danh mục", "Category")}
            <select
              value={draft.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
            >
              {data.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {localized(c.name, locale)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <BilingualField
          label={t("Mô tả", "Description")}
          multiline
          value={draft.description}
          onChange={(v) => set("description", v)}
        />
        <BilingualField
          label={t("Hướng dẫn sử dụng", "Instructions")}
          multiline
          value={draft.instructions}
          onChange={(v) => set("instructions", v)}
        />
        <div className="form-row">
          <label>
            {t("Ảnh bìa (URL công khai)", "Cover (public URL)")}
            <input
              value={draft.cover}
              onChange={(e) => set("cover", e.target.value)}
              placeholder="https://…"
            />
          </label>
          <label>
            {t("Tag, cách nhau bằng dấu phẩy", "Tags, separated by commas")}
            <input
              value={draft.tags.join(", ")}
              onChange={(e) =>
                set(
                  "tags",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          </label>
          <label>
            {t("Ưu tiên hiển thị", "Display priority")}
            <input
              type="number"
              min={0}
              max={9999}
              value={draft.priority}
              onChange={(e) => set("priority", Number(e.target.value))}
            />
          </label>
        </div>
        <label>
          {t("Preview chính đã xử lý", "Processed main preview")}
          <select
            value={draft.mainPreviewJobId ?? ""}
            onChange={(e) => set("mainPreviewJobId", e.target.value || null)}
          >
            <option value="">
              {t("Chọn tác vụ preview", "Select a preview job")}
            </option>
            {data.jobs
              .filter((j) => j.type === "preview")
              .map((j) => (
                <option key={j.id} value={j.id} disabled={j.status !== "done"}>
                  {data.files.find((f) => f.id === j.fileId)?.name ?? j.fileId}{" "}
                  / {j.start}s / {j.duration}s / {j.status}
                </option>
              ))}
          </select>
        </label>
        <fieldset>
          <legend>{t("Lựa chọn đang bán", "Options to publish")}</legend>
          {data.offers
            .filter((o) => o.productId === id)
            .map((o) => (
              <label className="checkbox" key={o.id}>
                <input
                  type="checkbox"
                  checked={draft.offerIds.includes(o.id)}
                  onChange={(e) =>
                    set(
                      "offerIds",
                      e.target.checked
                        ? [...draft.offerIds, o.id]
                        : draft.offerIds.filter((v) => v !== o.id),
                    )
                  }
                />
                {localized(o.label, locale)} {o.release} /{" "}
                {o.priceVnd.toLocaleString()} VND
              </label>
            ))}
          {!exists && (
            <p className="notice-box">
              {t(
                "Lưu bản nháp để thêm lựa chọn mua và file.",
                "Save the draft before adding purchase options and files.",
              )}
            </p>
          )}
        </fieldset>
        <fieldset>
          <legend>{t("Sản phẩm liên quan", "Related products")}</legend>
          {data.products
            .filter((p) => p.id !== id)
            .map((p) => (
              <label className="checkbox" key={p.id}>
                <input
                  type="checkbox"
                  checked={draft.relatedIds.includes(p.id)}
                  onChange={(e) =>
                    set(
                      "relatedIds",
                      e.target.checked
                        ? [...draft.relatedIds, p.id]
                        : draft.relatedIds.filter((v) => v !== p.id),
                    )
                  }
                />
                {localized(p.draft.title, locale)}
              </label>
            ))}
        </fieldset>
        <details>
          <summary>
            {t(
              "Thông số kỹ thuật & dependencies",
              "Specifications & dependencies",
            )}
          </summary>
          {draft.specs.map((spec, i) => (
            <div className="nested-field" key={i}>
              <BilingualField
                label={t("Tên thông số", "Specification")}
                value={spec.label}
                onChange={(v) =>
                  set(
                    "specs",
                    draft.specs.map((s, n) =>
                      n === i ? { ...s, label: v } : s,
                    ),
                  )
                }
              />
              <BilingualField
                label={t("Giá trị", "Value")}
                value={spec.value}
                onChange={(v) =>
                  set(
                    "specs",
                    draft.specs.map((s, n) =>
                      n === i ? { ...s, value: v } : s,
                    ),
                  )
                }
              />
              <button
                className="text-button"
                onClick={() =>
                  set(
                    "specs",
                    draft.specs.filter((_, n) => n !== i),
                  )
                }
              >
                {t("Xóa thông số", "Remove specification")}
              </button>
            </div>
          ))}
          <button
            className="button secondary"
            onClick={() =>
              set("specs", [
                ...draft.specs,
                { label: blankText(), value: blankText() },
              ])
            }
          >
            <Plus size={16} />
            {t("Thêm thông số", "Add specification")}
          </button>
          {draft.dependencies.map((d, i) => (
            <div className="form-row nested-field" key={i}>
              <label>
                {t("Loại", "Type")}
                <select
                  value={d.kind}
                  onChange={(e) =>
                    set(
                      "dependencies",
                      draft.dependencies.map((s, n) =>
                        n === i
                          ? { ...s, kind: e.target.value as typeof d.kind }
                          : s,
                      ),
                    )
                  }
                >
                  {["software", "plugin", "font", "other"].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
              {(["name", "version", "url"] as const).map((key) => (
                <label key={key}>
                  {key}
                  <input
                    value={d[key]}
                    onChange={(e) =>
                      set(
                        "dependencies",
                        draft.dependencies.map((s, n) =>
                          n === i ? { ...s, [key]: e.target.value } : s,
                        ),
                      )
                    }
                  />
                </label>
              ))}
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={d.required}
                  onChange={(e) =>
                    set(
                      "dependencies",
                      draft.dependencies.map((s, n) =>
                        n === i ? { ...s, required: e.target.checked } : s,
                      ),
                    )
                  }
                />
                {t("Bắt buộc", "Required")}
              </label>
              <button
                className="icon-button"
                aria-label={t("Xóa dependency", "Remove dependency")}
                onClick={() =>
                  set(
                    "dependencies",
                    draft.dependencies.filter((_, n) => n !== i),
                  )
                }
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          <button
            className="button secondary"
            onClick={() =>
              set("dependencies", [
                ...draft.dependencies,
                {
                  kind: "software",
                  name: "Adobe After Effects",
                  version: "",
                  required: true,
                  url: "",
                },
              ])
            }
          >
            <Plus size={16} />
            {t("Thêm dependency", "Add dependency")}
          </button>
        </details>
        <details>
          <summary>
            {t("Gallery preview phụ", "Additional gallery previews")}
          </summary>
          {draft.media.map((m, i) => (
            <div className="form-row nested-field" key={m.id}>
              <label>
                {t("Loại", "Type")}
                <select
                  value={m.type}
                  onChange={(e) =>
                    set(
                      "media",
                      draft.media.map((v, n) =>
                        n === i
                          ? { ...v, type: e.target.value as "video" | "image" }
                          : v,
                      ),
                    )
                  }
                >
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                </select>
              </label>
              <label>
                URL
                {m.type === "video" ? (
                  <select
                    value={m.url}
                    onChange={(e) =>
                      set(
                        "media",
                        draft.media.map((v, n) =>
                          n === i ? { ...v, url: e.target.value } : v,
                        ),
                      )
                    }
                  >
                    <option value="">
                      {t("Chọn preview đã xử lý", "Select a processed preview")}
                    </option>
                    {data.jobs
                      .filter(
                        (j) =>
                          j.type === "preview" &&
                          j.status === "done" &&
                          j.outputUrl,
                      )
                      .map((j) => (
                        <option key={j.id} value={j.outputUrl!}>
                          {data.files.find((f) => f.id === j.fileId)?.name ??
                            j.id}{" "}
                          / {j.start}s / {j.duration}s
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    value={m.url}
                    onChange={(e) =>
                      set(
                        "media",
                        draft.media.map((v, n) =>
                          n === i ? { ...v, url: e.target.value } : v,
                        ),
                      )
                    }
                  />
                )}
              </label>
              <label>
                Poster
                <input
                  value={m.poster}
                  onChange={(e) =>
                    set(
                      "media",
                      draft.media.map((v, n) =>
                        n === i ? { ...v, poster: e.target.value } : v,
                      ),
                    )
                  }
                />
              </label>
              <button
                className="icon-button"
                aria-label={t("Xóa preview", "Remove preview")}
                onClick={() =>
                  set(
                    "media",
                    draft.media.filter((_, n) => n !== i),
                  )
                }
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          <button
            className="button secondary"
            onClick={() =>
              set("media", [
                ...draft.media,
                {
                  id: crypto.randomUUID(),
                  url: "",
                  poster: "",
                  type: "video",
                  label: { vi: "Xem thử", en: "Preview" },
                },
              ])
            }
          >
            {t("Thêm preview", "Add preview")}
          </button>
        </details>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
          />
          {t(
            "Tôi đã kiểm tra và chấp nhận các cảnh báo ZIP nhẹ (được ghi audit).",
            "I reviewed and accept minor ZIP warnings (recorded in the audit log).",
          )}
        </label>
        {error && <ErrorState message={error} />}
        <div className="form-actions">
          <button
            className="button secondary"
            disabled={busy}
            onClick={() => void save()}
          >
            <Save size={17} />
            {t("Lưu bản nháp", "Save draft")}
          </button>
          <button
            className="button"
            disabled={busy}
            onClick={() => void save(true)}
          >
            <Send size={17} />
            {t("Xác nhận công bố", "Confirm publication")}
          </button>
          {product?.published && (
            <Link
              className="text-link"
              target="_blank"
              to={`/products/${product.published.slug}`}
            >
              {t("Xem bản đang bán", "View live page")}
            </Link>
          )}
        </div>
      </div>
      {exists && (
        <OfferEditor
          key={`${id}-${data.offers.length}`}
          productId={id}
          data={data}
          reload={reload}
          onAdded={(offer) => set("offerIds", [...draft.offerIds, offer.id])}
        />
      )}
      <details className="form-panel">
        <summary>
          {t("Upload ngay tại sản phẩm", "Upload within this product")}
        </summary>
        <UploadPicker purpose="product" />
        <Link className="text-link" to="/admin/uploads">
          {t("Mở quản lý file & preview", "Open files & previews")}
        </Link>
      </details>
    </div>
  );
}
function OfferEditor({
  productId,
  data,
  reload,
  onAdded,
}: {
  productId: string;
  data: AdminData;
  reload: () => void;
  onAdded: (offer: Offer) => void;
}) {
  const { t, locale } = useShop();
  const [offer, setOffer] = useState<Offer>({
      id: crypto.randomUUID(),
      productId,
      label: blankText(),
      release: "",
      quality: "",
      priceVnd: 0,
      fileIds: [],
      readmeFileId: null,
      changelog: blankText(),
      items: [],
      upgrades: [],
      freeFromOfferIds: [],
    }),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const set = <K extends keyof Offer>(key: K, value: Offer[K]) =>
    setOffer((current) => ({ ...current, [key]: value }));
  const own = data.offers.filter((o) => o.productId === productId);
  const standalone = data.offers.filter(
    (o) => o.productId !== productId && !o.items.length,
  );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const result = await post<Offer>("/admin/offers", offer);
      onAdded(result);
      reload();
    } catch (e) {
      setError(errorMessage(e, locale));
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="form-panel">
      <summary>
        {t(
          "Thêm chất lượng / bản phát hành mới",
          "Add a quality option / release",
        )}
      </summary>
      <p className="muted">
        {t(
          "Mỗi lựa chọn đã lưu là bất biến. Tạo lựa chọn mới khi thay đổi file hoặc chính sách, rồi chọn trên bản nháp.",
          "Saved options are immutable. Create a new option to change files or policy, then select it in the draft.",
        )}
      </p>
      <form onSubmit={(e) => void submit(e)}>
        <BilingualField
          label={t("Nhãn lựa chọn", "Option label")}
          value={offer.label}
          onChange={(v) => set("label", v)}
        />
        <div className="form-row">
          <label>
            {t("Giá gốc VND", "Base price VND")}
            <input
              type="number"
              min={0}
              max={1000000000}
              required
              value={offer.priceVnd}
              onChange={(e) => set("priceVnd", Number(e.target.value))}
            />
          </label>
          <label>
            {t("Chất lượng (video)", "Quality (video)")}
            <input
              value={offer.quality}
              onChange={(e) => set("quality", e.target.value)}
              placeholder="1080p / 2K / 4K"
            />
          </label>
          <label>
            {t("Release (AE / Bundle)", "Release (AE / Bundle)")}
            <input
              value={offer.release}
              onChange={(e) => set("release", e.target.value)}
            />
          </label>
        </div>
        <fieldset className="file-selection">
          <legend>
            {t("File hoặc ZIP được bán", "Files or ZIP included")}
          </legend>
          {data.files
            .filter((f) => f.purpose === "product" && f.status === "ready")
            .map((f) => (
              <label className="checkbox" key={f.id}>
                <input
                  type="checkbox"
                  checked={offer.fileIds.includes(f.id)}
                  onChange={(e) =>
                    set(
                      "fileIds",
                      e.target.checked
                        ? [...offer.fileIds, f.id]
                        : offer.fileIds.filter((v) => v !== f.id),
                    )
                  }
                />
                {f.name}
              </label>
            ))}
        </fieldset>
        <label>
          {t("README kèm sản phẩm", "Included README")}
          <select
            value={offer.readmeFileId ?? ""}
            onChange={(e) => set("readmeFileId", e.target.value || null)}
          >
            <option value="">{t("Chưa chọn", "None selected")}</option>
            {data.files
              .filter((f) => f.purpose === "product" && /readme/i.test(f.name))
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </select>
        </label>
        <BilingualField
          multiline
          label="Changelog"
          value={offer.changelog}
          onChange={(v) => set("changelog", v)}
        />
        <fieldset>
          <legend>
            {t("Thông số riêng của lựa chọn", "Option specifications")}
          </legend>
          <p className="muted">
            {t(
              "Ví dụ: độ phân giải, FPS, thời lượng. Nếu để trống, dùng thông số chung của sản phẩm.",
              "For example: resolution, FPS, duration. Leave empty to use the product specifications.",
            )}
          </p>
          {(offer.specs ?? []).map((spec, i) => (
            <div className="nested-field" key={i}>
              <BilingualField
                label={t("Tên thông số", "Specification")}
                value={spec.label}
                onChange={(v) =>
                  set(
                    "specs",
                    (offer.specs ?? []).map((s, n) =>
                      n === i ? { ...s, label: v } : s,
                    ),
                  )
                }
              />
              <BilingualField
                label={t("Giá trị", "Value")}
                value={spec.value}
                onChange={(v) =>
                  set(
                    "specs",
                    (offer.specs ?? []).map((s, n) =>
                      n === i ? { ...s, value: v } : s,
                    ),
                  )
                }
              />
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  set(
                    "specs",
                    offer.specs?.filter((_, n) => n !== i),
                  )
                }
              >
                {t("Bỏ thông số", "Remove specification")}
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button secondary"
            onClick={() =>
              set("specs", [
                ...(offer.specs ?? []),
                { label: blankText(), value: blankText() },
              ])
            }
          >
            {t("Thêm thông số lựa chọn", "Add option specification")}
          </button>
        </fieldset>
        <fieldset>
          <legend>
            {t(
              "Thành phần Bundle & giảm giá đã sở hữu",
              "Bundle contents & ownership credits",
            )}
          </legend>
          {offer.items.map((item, i) => (
            <div className="nested-field" key={i}>
              <label>
                {t(
                  "Sản phẩm bán riêng hoặc file độc quyền",
                  "Standalone option or exclusive files",
                )}
                <select
                  value={item.offerId ?? ""}
                  onChange={(e) => {
                    const o = standalone.find((o) => o.id === e.target.value);
                    set(
                      "items",
                      offer.items.map((s, n) =>
                        n === i
                          ? {
                              ...s,
                              offerId: o?.id ?? null,
                              title: o
                                ? data.products.find(
                                    (p) => p.id === o.productId,
                                  )!.draft.title
                                : blankText(),
                            }
                          : s,
                      ),
                    );
                  }}
                >
                  <option value="">
                    {t("Nội dung độc quyền", "Exclusive content")}
                  </option>
                  {standalone.map((o) => (
                    <option value={o.id} key={o.id}>
                      {localized(
                        data.products.find((p) => p.id === o.productId)!.draft
                          .title,
                        locale,
                      )}{" "}
                      / {localized(o.label, locale)}
                    </option>
                  ))}
                </select>
              </label>
              {!item.offerId && (
                <>
                  <BilingualField
                    label={t("Tên nội dung", "Content title")}
                    value={item.title}
                    onChange={(v) =>
                      set(
                        "items",
                        offer.items.map((s, n) =>
                          n === i ? { ...s, title: v } : s,
                        ),
                      )
                    }
                  />
                  {data.files
                    .filter(
                      (f) => f.purpose === "product" && f.status === "ready",
                    )
                    .map((f) => (
                      <label className="checkbox" key={f.id}>
                        <input
                          type="checkbox"
                          checked={item.fileIds.includes(f.id)}
                          onChange={(e) =>
                            set(
                              "items",
                              offer.items.map((s, n) =>
                                n === i
                                  ? {
                                      ...s,
                                      fileIds: e.target.checked
                                        ? [...s.fileIds, f.id]
                                        : s.fileIds.filter((v) => v !== f.id),
                                    }
                                  : s,
                              ),
                            )
                          }
                        />
                        {f.name}
                      </label>
                    ))}
                </>
              )}
              <label>
                {t("Giảm giá khi đã sở hữu (VND)", "Ownership credit (VND)")}
                <input
                  type="number"
                  min={0}
                  value={item.creditVnd}
                  onChange={(e) =>
                    set(
                      "items",
                      offer.items.map((s, n) =>
                        n === i
                          ? { ...s, creditVnd: Number(e.target.value) }
                          : s,
                      ),
                    )
                  }
                />
              </label>
              <label>
                {t(
                  "Preview thành phần (tùy chọn)",
                  "Component preview (optional)",
                )}
                <select
                  value={item.preview?.id ?? ""}
                  onChange={(e) => {
                    const job = data.jobs.find((j) => j.id === e.target.value);
                    set(
                      "items",
                      offer.items.map((s, n) =>
                        n === i
                          ? {
                              ...s,
                              preview: job?.outputUrl
                                ? {
                                    id: job.id,
                                    type: "video" as const,
                                    url: job.outputUrl,
                                    poster: "",
                                    label: item.title,
                                  }
                                : undefined,
                            }
                          : s,
                      ),
                    );
                  }}
                >
                  <option value="">
                    {t(
                      "Dùng preview của sản phẩm thành phần",
                      "Use the component product preview",
                    )}
                  </option>
                  {data.jobs
                    .filter(
                      (j) =>
                        j.type === "preview" &&
                        j.status === "done" &&
                        j.outputUrl,
                    )
                    .map((j) => (
                      <option key={j.id} value={j.id}>
                        {data.files.find((f) => f.id === j.fileId)?.name ??
                          j.id}{" "}
                        / {j.start}s / {j.duration}s
                      </option>
                    ))}
                </select>
              </label>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  set(
                    "items",
                    offer.items.filter((_, n) => n !== i),
                  )
                }
              >
                {t("Bỏ thành phần", "Remove component")}
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button secondary"
            onClick={() =>
              set("items", [
                ...offer.items,
                {
                  offerId: null,
                  title: blankText(),
                  fileIds: [],
                  creditVnd: 0,
                },
              ])
            }
          >
            <Plus size={16} />
            {t("Thêm thành phần", "Add component")}
          </button>
        </fieldset>
        {own.length > 0 && (
          <fieldset>
            <legend>{t("Chính sách nâng cấp", "Upgrade policies")}</legend>
            {own.map((previous) => (
              <div className="nested-field" key={previous.id}>
                <strong>
                  {localized(previous.label, locale)} {previous.release}
                </strong>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={offer.freeFromOfferIds.includes(previous.id)}
                    onChange={(e) =>
                      set(
                        "freeFromOfferIds",
                        e.target.checked
                          ? [...offer.freeFromOfferIds, previous.id]
                          : offer.freeFromOfferIds.filter(
                              (v) => v !== previous.id,
                            ),
                      )
                    }
                  />
                  {t(
                    "Cấp bản mới miễn phí khi công bố",
                    "Grant this release for free on publication",
                  )}
                </label>
                <label>
                  {t(
                    "Giá nâng cấp VND (để trống = giá gốc)",
                    "Upgrade VND price (blank = base price)",
                  )}
                  <input
                    type="number"
                    min={0}
                    value={
                      offer.upgrades.find((u) => u.fromOfferId === previous.id)
                        ?.priceVnd ?? ""
                    }
                    onChange={(e) =>
                      set("upgrades", [
                        ...offer.upgrades.filter(
                          (u) => u.fromOfferId !== previous.id,
                        ),
                        ...(e.target.value !== ""
                          ? [
                              {
                                fromOfferId: previous.id,
                                priceVnd: Number(e.target.value),
                              },
                            ]
                          : []),
                      ])
                    }
                  />
                </label>
              </div>
            ))}
          </fieldset>
        )}
        {error && <ErrorState message={error} />}
        <button className="button" disabled={busy || !offer.fileIds.length}>
          {t("Lưu lựa chọn mới", "Save new option")}
        </button>
      </form>
    </details>
  );
}
