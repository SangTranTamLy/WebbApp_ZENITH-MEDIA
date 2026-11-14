import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Film,
  Layers,
  Package,
  Play,
  Plus,
} from "lucide-react";
import {
  localized,
  type PublicProduct,
  type Media,
  type Settings,
} from "@zenith/shared/browser";
import { useShop } from "../lib/context";
import { useResource } from "../lib/useResource";
import { ProductCard } from "../components/ProductCard";
import { Empty, ErrorState, Loading, Modal } from "../components/Primitives";
import { LazyImage, Preview } from "../components/Preview";

type Collection = { products: PublicProduct[]; total: number };
interface HomeData {
  products: PublicProduct[];
  settings: Settings;
  featuredIds: string[];
  latestIds: string[];
  heroProductId: string | null;
  bundleId: string | null;
}

export function Home() {
  const { t, locale, settings: globalSettings, categories, money } = useShop();
  const [category, setCategory] = useState("");
  const [watch, setWatch] = useState<Media | null>(null);
  const home = useResource<HomeData>("/storefront");
  const filtered = useResource<Collection>(
    category
      ? `/catalog?limit=6&category=${encodeURIComponent(category)}`
      : null,
  );
  const resolve = (ids: string[] = []) =>
    ids.flatMap((id) => home.data?.products.filter((p) => p.id === id) ?? []);
  const featured = category
    ? filtered
    : {
        ...home,
        data: home.data
          ? {
              products: resolve(home.data.featuredIds),
              total: home.data.featuredIds.length,
            }
          : null,
      };
  const settings = home.data?.settings ?? globalSettings;
  const newest = resolve(home.data?.latestIds);
  const product = home.data?.products.find(
    (p) => p.id === home.data?.heroProductId,
  );
  const heroMedia =
    product?.media.find((m) => m.id === settings?.heroMediaId) ??
    product?.media[0];
  const heroPoster =
    heroMedia?.type === "image"
      ? heroMedia.url
      : heroMedia?.poster || product?.cover;
  const bundle = home.data?.products.find((p) => p.id === home.data?.bundleId);
  const roots = categories.filter((c) => !c.parentId);

  return (
    <div className="storefront">
      <section className="studio-hero container">
        <div className="studio-hero-copy">
          <span className="eyebrow">
            {t("TÀI NGUYÊN CHO NGƯỜI SÁNG TẠO", "ASSETS FOR THE CREATIVE MIND")}
          </span>
          <h1>
            {settings
              ? localized(settings.heroTitle, locale)
              : t(
                  "Từng khung hình.\nMột dấu ấn riêng.",
                  "Every frame.\nMake it yours.",
                )}
          </h1>
          <p>
            {settings
              ? localized(settings.heroDescription, locale)
              : t(
                  "Video, overlay và After Effects assets cho ý tưởng tiếp theo của bạn.",
                  "Videos, overlays and After Effects assets for your next idea.",
                )}
          </p>
          <Link to="/shop" className="button">
            {t("Khám phá tài nguyên", "Explore the collection")}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="studio-hero-media">
          {home.loading ? (
            <div className="hero-loading">
              <Loading />
            </div>
          ) : home.error ? (
            <ErrorState message={home.error} retry={home.reload} />
          ) : product ? (
            <>
              <div className="hero-frame">
                <img
                  fetchPriority="high"
                  src={heroPoster}
                  alt={localized(product.title, locale)}
                />
                {heroMedia?.type === "video" && (
                  <button
                    className="watch-feature"
                    onClick={() => setWatch(heroMedia)}
                    aria-label={t(
                      "Xem preview nổi bật",
                      "Watch featured preview",
                    )}
                  >
                    <Play size={23} fill="currentColor" />
                    <span>{t("Xem preview", "Watch preview")}</span>
                  </button>
                )}
              </div>
              <Link
                className="featured-caption"
                to={`/products/${product.slug}`}
              >
                <div>
                  <span>{t("STUDIO PICK", "STUDIO PICK")}</span>
                  <strong>{localized(product.title, locale)}</strong>
                </div>
                <ArrowUpRight size={22} />
              </Link>
            </>
          ) : (
            <div className="hero-empty">
              <Film size={40} />
              <p>
                {t(
                  "Bộ sưu tập đang được chuẩn bị.",
                  "The collection is taking shape.",
                )}
              </p>
            </div>
          )}
        </div>
      </section>

      <nav
        className="asset-categories container"
        aria-label={t("Nhóm sản phẩm", "Asset categories")}
      >
        {roots.map((c) => {
          const Icon =
            c.id === "ae" ? Layers : c.id === "bundle" ? Package : Film;
          return (
            <Link to={`/shop?category=${c.id}`} key={c.id}>
              <span className="category-symbol">
                <Icon size={23} strokeWidth={1.6} />
              </span>
              <div>
                <strong>{localized(c.name, locale)}</strong>
                <span>
                  {c.id === "video"
                    ? "Flowframes / Twixtor / Overlay"
                    : c.id === "ae"
                      ? "Presets / Templates / Projects"
                      : t(
                          "Bộ sưu tập trọn vẹn",
                          "Complete creative collections",
                        )}
                </span>
              </div>
              <ArrowUpRight size={18} />
            </Link>
          );
        })}
      </nav>

      <section
        className="collection-section container"
        aria-labelledby="featured-heading"
      >
        <div className="section-head">
          <div>
            <h2 id="featured-heading">
              {t("Chọn cho khung hình tiếp theo", "For your next frame")}
            </h2>
            <p>
              {t(
                "Những tài nguyên được Studio lựa chọn.",
                "A selection from the studio, ready for your timeline.",
              )}
            </p>
          </div>
          <Link to="/shop">
            {t("Xem tất cả", "View all")}
            <ArrowRight size={17} />
          </Link>
        </div>
        <div
          className="category-pills"
          aria-label={t("Lọc tài nguyên nổi bật", "Filter featured assets")}
        >
          <button
            aria-pressed={!category}
            className={!category ? "active" : ""}
            onClick={() => setCategory("")}
          >
            {t("Tất cả tài nguyên", "All assets")}
          </button>
          {categories
            .filter((c) => c.parentId || c.id !== "video")
            .map((c) => (
              <button
                key={c.id}
                aria-pressed={category === c.id}
                className={category === c.id ? "active" : ""}
                onClick={() => setCategory(c.id)}
              >
                {localized(c.name, locale)}
              </button>
            ))}
        </div>
        {featured.loading ? (
          <div
            className="product-skeletons"
            aria-label={t("Đang tải sản phẩm", "Loading assets")}
            role="status"
          >
            {[0, 1, 2].map((n) => (
              <div key={n} />
            ))}
          </div>
        ) : featured.error ? (
          <ErrorState message={featured.error} retry={featured.reload} />
        ) : featured.data?.products.length ? (
          <div className="product-grid">
            {featured.data.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <Empty
            title={t(
              "Bộ sưu tập đang được chuẩn bị",
              "This collection is taking shape",
            )}
            body={t(
              "Hãy thử một danh mục khác.",
              "Explore another category in the meantime.",
            )}
          />
        )}
      </section>

      {bundle && (
        <section className="bundle-feature container">
          <Link
            className="bundle-art"
            to={`/products/${bundle.slug}`}
            tabIndex={-1}
            aria-hidden="true"
          >
            <LazyImage src={bundle.cover} alt="" />
          </Link>
          <div className="bundle-copy">
            <span className="product-kind">
              {t("BỘ SƯU TẬP", "THE COLLECTION")}
            </span>
            <h2>{localized(bundle.title, locale)}</h2>
            <p>
              {t(
                "Một bộ sưu tập, nhiều chất liệu. Tải trọn bộ hoặc chọn từng file cho dự án của bạn.",
                "One collection. More possibilities. Download the complete pack or choose individual files for your project.",
              )}
            </p>
            <div className="bundle-contents-summary">
              {bundle.offers[0]?.components.slice(0, 3).map((item, i) => (
                <span key={i}>
                  <Plus size={14} />
                  {localized(item.title, locale)}
                </span>
              ))}
            </div>
            <div className="bundle-feature-action">
              <Link className="button" to={`/products/${bundle.slug}`}>
                {t("Khám phá Bundle", "Explore the bundle")}
                <ArrowUpRight size={18} />
              </Link>
              <strong>
                {money(Math.min(...bundle.offers.map((o) => o.priceVnd)))}
              </strong>
            </div>
            <p className="bundle-credit-note">
              {t(
                "Đã sở hữu video thành phần? Ưu đãi được tính theo chính sách của Bundle tại thanh toán.",
                "Already own a clip? Eligible ownership credits are applied at checkout.",
              )}
            </p>
          </div>
        </section>
      )}

      <section
        className="latest-section container"
        aria-labelledby="latest-heading"
      >
        <div className="section-head">
          <h2 id="latest-heading">
            {t("Mới từ Studio", "Fresh from the studio")}
          </h2>
          <Link to="/shop?sort=newest">
            {t("Xem sản phẩm mới", "See new releases")}
            <ArrowRight size={17} />
          </Link>
        </div>
        {home.error ? (
          <ErrorState message={home.error} retry={home.reload} />
        ) : home.loading ? (
          <Loading />
        ) : (
          <div className="latest-list">
            {newest.map((p) => (
              <Link
                key={p.id}
                to={`/products/${p.slug}`}
                className="latest-item"
              >
                <LazyImage src={p.cover} alt="" />
                <div>
                  <span>{p.tags[0] ?? p.kind}</span>
                  <h3>{localized(p.title, locale)}</h3>
                  <strong>
                    {money(Math.min(...p.offers.map((o) => o.priceVnd)))}
                  </strong>
                </div>
                <ArrowUpRight size={19} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {!!settings?.faq.length && (
        <section className="store-faq container">
          <h2>{t("Trước khi bạn bắt đầu", "Before you get started")}</h2>
          <div>
            {settings.faq.slice(0, 3).map((f, i) => (
              <details key={i}>
                <summary>
                  {localized(f.question, locale)}
                  <Plus size={18} />
                </summary>
                <p>{localized(f.answer, locale)}</p>
              </details>
            ))}
            <Link className="text-link" to="/faq">
              {t("Xem tất cả câu hỏi", "All frequently asked questions")}
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}
      <Modal
        open={!!watch}
        onClose={() => setWatch(null)}
        title={t("Preview nổi bật", "Featured preview")}
      >
        {watch && (
          <Preview
            url={watch.url}
            poster={watch.poster || product?.cover || ""}
            label={localized(watch.label, locale)}
            playOnMount
          />
        )}
      </Modal>
    </div>
  );
}
