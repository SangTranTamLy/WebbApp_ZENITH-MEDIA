import { bytes } from "../lib/format";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Heart,
  ArrowUpRight,
  File,
  Play,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import {
  localized,
  ownershipKey,
  type PublicProduct,
  type Quote,
  type Media,
} from "@zenith/shared/browser";
import { useShop } from "../lib/context";
import { useResource } from "../lib/useResource";
import { errorMessage, post } from "../lib/api";
import { ErrorState, Loading, Modal } from "../components/Primitives";
import { Preview } from "../components/Preview";
import { ProductCard } from "../components/ProductCard";

export function ProductPage() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useResource<{
    product: PublicProduct;
    related: PublicProduct[];
  }>(`/products/${slug}`);
  if (loading) return <Loading />;
  if (error || !data)
    return (
      <div className="container">
        <ErrorState message={error} retry={reload} />
      </div>
    );
  return (
    <ProductDetail
      key={data.product.id}
      product={data.product}
      related={data.related}
    />
  );
}
function ProductDetail({
  product: p,
  related,
}: {
  product: PublicProduct;
  related: PublicProduct[];
}) {
  const { t, locale, money, me, addCart, toggleWishlist, toast, settings } =
    useShop();
  const navigate = useNavigate();
  const [offerId, setOfferId] = useState(p.offers[0]?.id),
    [mediaIndex, setMediaIndex] = useState(0),
    [tab, setTab] = useState("description");
  const offer = p.offers.find((o) => o.id === offerId) ?? p.offers[0];
  const media = p.media[mediaIndex];
  const [componentPreview, setComponentPreview] = useState<Media | null>(null);
  const [priceResult, setPriceResult] = useState<{
    key: string;
    quote: Quote | null;
  }>({ key: "", quote: null });
  const introRef = useRef<HTMLDivElement>(null);
  const [showMobileBuy, setShowMobileBuy] = useState(false);
  const owned = me?.entitlements.some(
    (e) => offer && e.line.rights.includes(ownershipKey(offer)),
  );
  const quoteKey = `${me?.actor.id ?? ""}/${offer?.id ?? ""}/${!!owned}`;
  const quote = priceResult.key === quoteKey ? priceResult.quote : null;
  const price = quote?.totalVnd ?? offer?.priceVnd ?? 0;
  const specs = offer?.specs?.length ? offer.specs : p.specs;
  const files = p.files.filter((f) => offer?.includedFileIds.includes(f.id));
  const saved = !!me?.wishlist.includes(p.id);
  useEffect(() => {
    if (!me?.actor.id || !offer || owned) return;
    let live = true;
    void post<Quote>("/quote", { offerIds: [offer.id], coupon: "" })
      .then((q) => {
        if (live) setPriceResult({ key: quoteKey, quote: q });
      })
      .catch(() => {
        if (live) setPriceResult({ key: quoteKey, quote: null });
      });
    return () => {
      live = false;
    };
  }, [me?.actor.id, offer, owned, quoteKey]);
  useEffect(() => {
    const target = introRef.current;
    if (!target) return;
    // Observe the whole introduction, which starts in view. Observing only
    // below-fold buttons misses a fast scroll from below to above the viewport.
    const observer = new IntersectionObserver(
      ([entry]) =>
        setShowMobileBuy(
          !entry.isIntersecting && entry.boundingClientRect.top < 0,
        ),
      { threshold: 0, rootMargin: "-100px 0px 0px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  const buy = () => {
    if (!offer) return;
    addCart(p, offer, true);
    navigate("/checkout");
  };
  const panels = [
    {
      id: "description",
      label: t("Mô tả", "Description"),
      body: (
        <p className="preserve-lines">{localized(p.description, locale)}</p>
      ),
    },
    {
      id: "instructions",
      label: t("Hướng dẫn sử dụng", "Getting started"),
      body: (
        <p className="preserve-lines">{localized(p.instructions, locale)}</p>
      ),
    },
    {
      id: "technical",
      label: t("Thông tin kỹ thuật", "Technical details"),
      body: (
        <>
          <dl className="spec-list">
            {specs.map((s, i) => (
              <div key={i}>
                <dt>{localized(s.label, locale)}</dt>
                <dd>{localized(s.value, locale)}</dd>
              </div>
            ))}
          </dl>
          {p.dependencies.length > 0 && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      {t("Phần mềm / Phụ thuộc", "Software / Dependency")}
                    </th>
                    <th>{t("Phiên bản", "Version")}</th>
                    <th>{t("Yêu cầu", "Required")}</th>
                  </tr>
                </thead>
                <tbody>
                  {p.dependencies.map((d, i) => (
                    <tr key={i}>
                      <td>
                        {d.url ? (
                          <a href={d.url} rel="noreferrer" target="_blank">
                            {d.name}
                          </a>
                        ) : (
                          d.name
                        )}
                        <small>{d.kind}</small>
                      </td>
                      <td>{d.version}</td>
                      <td>
                        {d.required
                          ? t("Bắt buộc", "Required")
                          : t("Tùy chọn", "Optional")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ),
    },
    {
      id: "license",
      label: t("Giấy phép", "License"),
      body: (
        <>
          <p>{settings && localized(settings.license, locale)}</p>
          <Link to="/license">
            {t("Xem đầy đủ điều khoản", "Read the full terms")}
          </Link>
        </>
      ),
    },
  ];
  return (
    <div className="container product-page">
      <nav className="breadcrumbs">
        <Link to="/shop">{t("Tài nguyên", "Assets")}</Link>
        <span>/</span>
        <span>{localized(p.title, locale)}</span>
      </nav>
      <div className="product-detail" ref={introRef}>
        <div className="product-gallery">
          <div className="large-preview">
            <Preview
              key={media?.id}
              url={media?.type === "video" ? media.url : undefined}
              poster={media?.type === "image" ? media.url : p.cover}
              label={localized(p.title, locale)}
            />
          </div>
          {p.media.length > 1 && (
            <div className="thumbnails">
              <button
                className="icon-button"
                aria-label={t("Preview trước", "Previous preview")}
                onClick={() =>
                  setMediaIndex(
                    (mediaIndex - 1 + p.media.length) % p.media.length,
                  )
                }
              >
                <ChevronLeft />
              </button>
              {p.media.map((m, i) => (
                <button
                  className={mediaIndex === i ? "selected" : ""}
                  key={m.id}
                  onClick={() => setMediaIndex(i)}
                  aria-label={localized(m.label, locale)}
                >
                  <img
                    src={m.type === "image" ? m.url : m.poster || p.cover}
                    alt=""
                  />
                </button>
              ))}
              <button
                className="icon-button"
                aria-label={t("Preview tiếp theo", "Next preview")}
                onClick={() => setMediaIndex((mediaIndex + 1) % p.media.length)}
              >
                <ChevronRight />
              </button>
            </div>
          )}
          <div className="preview-caption">
            <span>
              {t(
                "Preview có watermark. File tải giữ chất lượng gốc.",
                "Watermarked preview. Downloads retain original quality.",
              )}
            </span>
          </div>
          <dl className="spec-highlights">
            {specs.slice(0, 3).map((s, i) => (
              <div key={i}>
                <dt>{localized(s.label, locale)}</dt>
                <dd>{localized(s.value, locale)}</dd>
              </div>
            ))}
            <div>
              <dt>{t("Dung lượng tải", "Download size")}</dt>
              <dd>{bytes(files.reduce((sum, f) => sum + f.size, 0))}</dd>
            </div>
          </dl>
        </div>
        <aside className="purchase-panel">
          <span className="product-kind">{p.tags.join(" / ")}</span>
          <h1>{localized(p.title, locale)}</h1>
          <p className="purchase-description">
            {localized(p.description, locale)}
          </p>
          {p.offers.length > 1 && (
            <fieldset>
              <legend>{t("Lựa chọn sản phẩm", "Choose your option")}</legend>
              <div className="offer-options">
                {p.offers.map((o) => (
                  <button
                    type="button"
                    aria-pressed={o.id === offerId}
                    key={o.id}
                    className={o.id === offerId ? "selected" : ""}
                    onClick={() => setOfferId(o.id)}
                  >
                    {localized(o.label, locale)}
                    {o.release && <small>{o.release}</small>}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <div className="price-large">
            {quote && quote.totalVnd < offer.priceVnd && (
              <del>{money(offer.priceVnd)}</del>
            )}
            {money(price)}
            <small>{offer && localized(offer.label, locale)}</small>
          </div>
          {quote && quote.totalVnd < offer.priceVnd && (
            <p className="ownership-savings">
              {t("Ưu đãi theo quyền sở hữu của bạn", "Your ownership savings")}:{" "}
              {money(offer.priceVnd - price)}
            </p>
          )}
          <div className="purchase-actions">
            {owned ? (
              <Link className="button full" to="/library">
                <Download size={18} />
                {t("Mở trong Thư viện", "Open in My Library")}
              </Link>
            ) : p.status === "active" ? (
              <>
                <button className="button full" onClick={buy}>
                  {t("Mua ngay", "Buy now")}
                </button>
                <button
                  className="button secondary full"
                  onClick={() => addCart(p, offer)}
                >
                  <ShoppingBag size={17} />
                  {t("Thêm vào giỏ hàng", "Add to cart")}
                </button>
              </>
            ) : (
              <p className="notice-box">
                {t(
                  "Sản phẩm đã ngừng bán. Khách đã mua vẫn tải trong Thư viện.",
                  "No longer for sale. Existing owners can download from My Library.",
                )}
              </p>
            )}
          </div>
          <button
            className="text-button wishlist-action"
            aria-pressed={saved}
            onClick={() => {
              void toggleWishlist(p.id).catch((e) =>
                toast(errorMessage(e, locale)),
              );
            }}
          >
            <Heart size={16} fill={saved ? "currentColor" : "none"} />
            {saved
              ? t("Đã lưu vào yêu thích", "Saved to wishlist")
              : t("Lưu vào yêu thích", "Save to wishlist")}
          </button>
          <p className="license-note">
            <ShieldCheck size={16} />
            {t(
              "Sử dụng cá nhân & sản phẩm đầu ra thương mại",
              "Personal & commercial end products",
            )}
          </p>
        </aside>
      </div>
      <section className="product-information">
        <div
          className="desktop-tabs"
          role="tablist"
          aria-label={t("Thông tin sản phẩm", "Product information")}
          onKeyDown={(e) => {
            if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key))
              return;
            e.preventDefault();
            const current = panels.findIndex((p) => p.id === tab);
            const next =
              e.key === "Home"
                ? 0
                : e.key === "End"
                  ? panels.length - 1
                  : (current +
                      (e.key === "ArrowRight" ? 1 : -1) +
                      panels.length) %
                    panels.length;
            setTab(panels[next].id);
            const tabs =
              e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]");
            tabs[next]?.focus();
          }}
        >
          {panels.map((panel) => (
            <button
              role="tab"
              aria-selected={tab === panel.id}
              tabIndex={tab === panel.id ? 0 : -1}
              aria-controls={`panel-${panel.id}`}
              id={`tab-${panel.id}`}
              key={panel.id}
              onClick={() => setTab(panel.id)}
            >
              {panel.label}
            </button>
          ))}
        </div>
        {panels.map((panel) => (
          <div
            className="desktop-panel"
            role="tabpanel"
            id={`panel-${panel.id}`}
            aria-labelledby={`tab-${panel.id}`}
            key={panel.id}
            hidden={tab !== panel.id}
          >
            {panel.body}
          </div>
        ))}
        <div className="mobile-accordions">
          {panels.map((panel) => (
            <details key={panel.id}>
              <summary>{panel.label}</summary>
              {panel.body}
            </details>
          ))}
        </div>
      </section>
      <section className="file-section">
        <h2>
          {p.kind === "bundle"
            ? t("Trong bộ sưu tập này", "Inside this collection")
            : t("File đi kèm", "Included files")}
        </h2>
        {!!offer?.items.length && (
          <div className="bundle-members">
            {offer.components.map((item, i) => (
              <article className="bundle-member" key={i}>
                <div className="bundle-member-info">
                  <strong>{localized(item.title, locale)}</strong>
                  <small>
                    {item.offerId
                      ? item.quality ||
                        t("Tài nguyên thành phần", "Included asset")
                      : t("Độc quyền trong Bundle", "Bundle exclusive")}
                  </small>
                </div>
                {item.preview && (
                  <button
                    className="button secondary"
                    onClick={() => setComponentPreview(item.preview)}
                    aria-label={`${t("Xem thử", "Preview")} ${localized(item.title, locale)}`}
                  >
                    <Play size={15} />
                    {t("Xem thử", "Preview")}
                  </button>
                )}
                {item.slug && (
                  <Link
                    className="icon-button"
                    to={`/products/${item.slug}`}
                    aria-label={`${t("Chi tiết", "Details")} ${localized(item.title, locale)}`}
                  >
                    <ArrowUpRight size={18} />
                  </Link>
                )}
              </article>
            ))}
          </div>
        )}
        <div className="file-list">
          {files.map((file) => (
            <div key={file.id}>
              <File size={17} />
              <span>{file.name}</span>
              <small>{bytes(file.size)}</small>
            </div>
          ))}
        </div>
      </section>
      {related.length > 0 && (
        <section className="collection-section">
          <div className="section-head">
            <h2>{t("Cùng mạch sáng tạo", "Keep the ideas flowing")}</h2>
          </div>
          <div className="product-grid related-grid">
            {related.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
      {!owned && p.status === "active" && showMobileBuy && (
        <div className="mobile-buy">
          <strong>{money(price)}</strong>
          <button className="button" onClick={buy}>
            {t("Mua ngay", "Buy now")}
          </button>
        </div>
      )}
      <Modal
        open={!!componentPreview}
        onClose={() => setComponentPreview(null)}
        title={
          componentPreview
            ? localized(componentPreview.label, locale)
            : t("Xem thử", "Preview")
        }
      >
        {componentPreview && (
          <Preview
            url={
              componentPreview.type === "video"
                ? componentPreview.url
                : undefined
            }
            poster={
              componentPreview.type === "image"
                ? componentPreview.url
                : componentPreview.poster
            }
            label={localized(componentPreview.label, locale)}
            playOnMount
          />
        )}
      </Modal>
    </div>
  );
}
