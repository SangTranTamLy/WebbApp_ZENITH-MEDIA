import { bytes } from "../lib/format";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Grid2X2, List, Search } from "lucide-react";
import {
  localized,
  type AssetFile,
  type Download as DownloadRecord,
  type Entitlement,
  type PublicProduct,
} from "@zenith/shared/browser";
import { useShop } from "../lib/context";
import { useResource } from "../lib/useResource";
import { errorMessage, post, put } from "../lib/api";
import { AccountNav } from "../components/Layout";
import {
  Empty,
  ErrorState,
  Loading,
  PageHead,
  Status,
} from "../components/Primitives";
import { ProductCard } from "../components/ProductCard";

type LibraryData = {
  entitlements: Entitlement[];
  files: Pick<AssetFile, "id" | "name" | "size" | "type" | "status">[];
  downloads: DownloadRecord[];
};
export function Library() {
  const { t, locale } = useShop();
  const { data, error, loading, reload } = useResource<LibraryData>("/library");
  const [view, setView] = useState<"grid" | "list">("grid"),
    [query, setQuery] = useState(""),
    [kind, setKind] = useState("");
  const groups = (data?.entitlements ?? []).reduce<
    Record<string, Entitlement[]>
  >((result, e) => {
    (result[e.productId] ??= []).push(e);
    return result;
  }, {});
  const filtered = Object.values(groups)
    .filter((group): group is Entitlement[] => !!group)
    .filter(
      (group) =>
        localized(group[0].line.title, locale)
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (!kind || group[0].line.kind === kind),
    );
  return (
    <div className="container account-page">
      <AccountNav />
      <PageHead
        title={t("Thư viện của bạn", "Your creative library")}
        description={t(
          "Tất cả tài nguyên đã sở hữu, luôn ở đây khi bạn cần.",
          "All your owned assets, here when you need them.",
        )}
      />
      <div className="library-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label={t("Tìm trong thư viện", "Search library")}
            placeholder={t("Tìm trong thư viện…", "Search your library…")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label={t("Loại tài nguyên", "Asset type")}
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          <option value="">{t("Tất cả tài nguyên", "All assets")}</option>
          <option value="video">Video & Overlay</option>
          <option value="ae">After Effects</option>
          <option value="bundle">Bundle</option>
        </select>
        <div className="view-toggle">
          <button
            className="icon-button"
            aria-pressed={view === "grid"}
            aria-label={t("Dạng lưới", "Grid view")}
            onClick={() => setView("grid")}
          >
            <Grid2X2 size={19} />
          </button>
          <button
            className="icon-button"
            aria-pressed={view === "list"}
            aria-label={t("Dạng danh sách", "List view")}
            onClick={() => setView("list")}
          >
            <List size={19} />
          </button>
        </div>
      </div>
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : filtered.length ? (
        <div className={`library-items ${view}`}>
          {filtered.map((group) => (
            <LibraryItem
              key={group[0].productId}
              group={group}
              data={data!}
              reload={reload}
            />
          ))}
        </div>
      ) : (
        <Empty
          title={t("Không có tài nguyên phù hợp", "No matching assets")}
          body={t(
            "Sản phẩm xuất hiện sau khi thanh toán được xác nhận.",
            "Your assets appear after payment is confirmed.",
          )}
          href="/shop"
          label={t("Khám phá cửa hàng", "Explore the store")}
        />
      )}
    </div>
  );
}
function LibraryItem({
  group,
  data,
  reload,
}: {
  group: Entitlement[];
  data: LibraryData;
  reload: () => void;
}) {
  const { t, locale, me, toast, refreshMe } = useShop();
  const [chosen, setChosen] = useState(
      me?.account.lastReleases[group[0].productId] ??
        group[group.length - 1].offerId,
    ),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState("");
  const entitlement = group.find((e) => e.offerId === chosen) ?? group[0];
  const line = entitlement.line;
  const files = data.files.filter((f) => line.fileIds.includes(f.id));
  async function select(id: string) {
    setChosen(id);
    try {
      await put("/account", {
        name: me?.account.name || me?.actor.name || "Customer",
        lastReleases: { ...me?.account.lastReleases, [line.productId]: id },
      });
      await refreshMe();
    } catch (e) {
      toast(errorMessage(e, locale));
    }
  }
  async function download(id: string) {
    setBusy(id);
    try {
      const result = await post<{ url: string }>(`/downloads/${id}`);
      const a = document.createElement("a");
      a.href = result.url;
      a.rel = "noreferrer";
      a.click();
      toast(
        t(
          "Đã khởi tạo tải. Trình duyệt sẽ quản lý tiến trình.",
          "Download requested. Your browser manages progress.",
        ),
      );
      reload();
    } catch (e) {
      toast(errorMessage(e, locale));
    } finally {
      setBusy("");
    }
  }
  return (
    <article className="library-card">
      <img className="library-cover" src={line.cover} alt="" />
      <div className="library-card-body">
        <span className="product-kind">
          {line.kind === "bundle"
            ? "Bundle"
            : line.kind === "ae"
              ? "After Effects"
              : "Video"}
        </span>
        <h2>{localized(line.title, locale)}</h2>
        {entitlement.source === "free-update" && (
          <span className="status">
            {t("Bản cập nhật", "Update available")}
          </span>
        )}
        {group.length > 1 ? (
          <label>
            {t("Phiên bản đã sở hữu", "Owned versions")}
            <select
              value={entitlement.offerId}
              onChange={(e) => void select(e.target.value)}
            >
              {group.map((e) => (
                <option key={e.id} value={e.offerId}>
                  {localized(e.line.label, locale)} {e.line.release}{" "}
                  {e.line.quality}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="muted">
            {localized(line.label, locale)} {line.release}
          </p>
        )}
        <button
          className="button secondary full"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
        >
          <Download size={17} />
          {t("Xem & tải file", "View & download files")}
        </button>
        {open && (
          <div className="library-files">
            {files.map((f) => (
              <div className="library-file" key={f.id}>
                <div>
                  <strong>{f.name}</strong>
                  <small>
                    {bytes(f.size)} <Status value={f.status} />
                  </small>
                </div>
                <button
                  className="icon-button"
                  disabled={!!busy || f.status !== "ready"}
                  aria-label={`${t("Tải", "Download")} ${f.name}`}
                  onClick={() => void download(f.id)}
                >
                  <Download size={18} />
                </button>
              </div>
            ))}
            <details>
              <summary>
                {t("Lịch sử phiên bản & thay đổi", "Versions & changelog")}
              </summary>
              {group.map((e) => (
                <div className="changelog" key={e.id}>
                  <strong>
                    {localized(e.line.label, locale)} {e.line.release}
                  </strong>
                  <p>{localized(e.line.changelog, locale)}</p>
                </div>
              ))}
            </details>
            <details>
              <summary>
                {t("Lịch sử yêu cầu tải", "Download request history")}
              </summary>
              {data.downloads
                .filter((d) => d.entitlementId === entitlement.id)
                .map((d) => (
                  <p className="small" key={d.id}>
                    {d.name}
                    <br />
                    {new Date(d.createdAt).toLocaleString(locale)}
                  </p>
                ))}
            </details>
            <Link
              className="text-link"
              to={`/support/new?order=${entitlement.orderId}`}
            >
              {t("Nhận hỗ trợ", "Get support")}
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
export function DownloadHistory() {
  const { t, locale } = useShop();
  const { data, error, loading, reload } =
    useResource<DownloadRecord[]>("/downloads");
  return (
    <div className="container account-page">
      <AccountNav />
      <PageHead
        title={t("Lịch sử tải xuống", "Download history")}
        description={t(
          "Ghi nhận yêu cầu tải được cấp phép. Trạng thái lưu file do trình duyệt quản lý.",
          "A record of authorized download requests. Your browser tracks file completion.",
        )}
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : data?.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>{t("Thời gian yêu cầu", "Requested at")}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{new Date(d.createdAt).toLocaleString(locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          title={t("Chưa có lượt tải", "No downloads yet")}
          body={t(
            "Mở Thư viện để tải tài nguyên đã sở hữu.",
            "Open My Library to download your assets.",
          )}
          href="/library"
          label={t("Mở Thư viện", "Open My Library")}
        />
      )}
    </div>
  );
}
export function Wishlist() {
  const { t, me } = useShop();
  const { data, error, loading, reload } = useResource<{
    products: PublicProduct[];
  }>("/cart/details");
  const products = data?.products.filter((p) => me?.wishlist.includes(p.id));
  return (
    <div className="container account-page">
      <PageHead
        title={t("Danh sách yêu thích", "Your wishlist")}
        description={t(
          "Những ý tưởng bạn muốn quay lại.",
          "Ideas worth coming back to.",
        )}
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState message={error} retry={reload} />
      ) : products?.length ? (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <Empty
          title={t("Lưu lại cảm hứng của bạn", "Save your inspiration")}
          body={t(
            "Chạm vào biểu tượng trái tim để lưu sản phẩm tại đây.",
            "Use the heart on an asset to save it here.",
          )}
          href="/shop"
          label={t("Khám phá", "Explore")}
        />
      )}
    </div>
  );
}
