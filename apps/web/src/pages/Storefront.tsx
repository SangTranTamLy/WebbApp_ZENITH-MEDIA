import { api, errorMessage } from "../lib/api";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import {
  localized,
  type PublicProduct,
  type Settings,
  type Category,
} from "@zenith/shared/browser";
import { useShop } from "../lib/context";
import { useResource } from "../lib/useResource";
import { ProductCard } from "../components/ProductCard";
import { Empty, ErrorState, Loading, PageHead } from "../components/Primitives";

interface Catalog {
  products: PublicProduct[];
  total: number;
  settings: Settings;
  categories: Category[];
}
export { Home } from "./Home";
export function Shop() {
  const { t, locale, categories } = useShop();
  const [params, setParams] = useSearchParams();
  const [extra, setExtra] = useState<{
    key: string;
    products: PublicProduct[];
  }>({ key: "", products: [] });
  const [moreBusy, setMoreBusy] = useState(false);
  const [moreError, setMoreError] = useState("");
  const q = params.get("q") ?? "",
    category = params.get("category") ?? "",
    sort = params.get("sort") ?? "featured";
  const queryKey = JSON.stringify([q, category, sort]);
  const { data, error, loading, reload } = useResource<Catalog>(
    `/catalog?${new URLSearchParams({ q, category, sort, limit: "12" })}`,
  );
  const shown = [
    ...(data?.products ?? []),
    ...(extra.key === queryKey ? extra.products : []),
  ];
  async function more() {
    setMoreBusy(true);
    setMoreError("");
    try {
      const next = await api<Catalog>(
        `/catalog?${new URLSearchParams({ q, category, sort, limit: "12", offset: String(shown.length) })}`,
      );
      setExtra((current) => ({
        key: queryKey,
        products: [
          ...(current.key === queryKey ? current.products : []),
          ...next.products,
        ],
      }));
    } catch (e) {
      setMoreError(errorMessage(e, locale));
    } finally {
      setMoreBusy(false);
    }
  }
  const change = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
    setMoreError("");
  };
  return (
    <div className="container shop-page">
      <PageHead
        title={
          category
            ? localized(
                categories.find((c) => c.id === category)?.name ?? {
                  vi: "Bộ sưu tập",
                  en: "Collection",
                },
                locale,
              )
            : t("Tài nguyên cho mọi ý tưởng", "Assets for every idea")
        }
        description={t(
          "Xem trước. Chọn chất liệu. Bắt đầu sáng tạo.",
          "Preview. Find your material. Start creating.",
        )}
      />
      <div className="shop-toolbar">
        <form
          className="search-field"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            change("q", String(form.get("q") ?? ""));
          }}
        >
          <Search size={19} />
          <input
            key={q}
            name="q"
            defaultValue={q}
            aria-label={t("Tìm sản phẩm", "Search assets")}
            placeholder={t(
              "Tìm video, overlay, preset…",
              "Search videos, overlays, presets…",
            )}
          />
          <button type="submit">{t("Tìm", "Search")}</button>
        </form>
        <select
          aria-label={t("Sắp xếp sản phẩm", "Sort products")}
          value={sort}
          onChange={(e) => change("sort", e.target.value)}
        >
          <option value="featured">
            {t("Đề xuất của Studio", "Studio picks")}
          </option>
          <option value="newest">{t("Mới nhất", "Newest")}</option>
          <option value="price-asc">
            {t("Giá: thấp đến cao", "Price: low to high")}
          </option>
          <option value="price-desc">
            {t("Giá: cao đến thấp", "Price: high to low")}
          </option>
        </select>
      </div>
      <div className="category-pills">
        <button
          className={!category ? "active" : ""}
          onClick={() => change("category", "")}
        >
          {t("Tất cả", "All assets")}
        </button>
        {categories.map((c) => (
          <button
            className={category === c.id ? "active" : ""}
            key={c.id}
            onClick={() => change("category", c.id)}
          >
            {localized(c.name, locale)}
          </button>
        ))}
      </div>
      <p className="result-count">
        {data?.total ?? 0} {t("tài nguyên", "assets")}
      </p>
      {error ? (
        <ErrorState message={error} retry={reload} />
      ) : loading && !data ? (
        <Loading />
      ) : data?.products.length ? (
        <>
          <div className="product-grid">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {moreError && <ErrorState message={moreError} />}{" "}
          {shown.length < data.total && (
            <button
              disabled={moreBusy}
              className="button secondary load-more"
              onClick={() => void more()}
            >
              {t("Xem thêm sản phẩm", "Load more assets")}
            </button>
          )}
        </>
      ) : (
        <Empty
          title={t("Chưa tìm thấy sản phẩm", "No assets found")}
          body={t(
            "Thử từ khóa hoặc danh mục khác.",
            "Try another search or category.",
          )}
        />
      )}
    </div>
  );
}
