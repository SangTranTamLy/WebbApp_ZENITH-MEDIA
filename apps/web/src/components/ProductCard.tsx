import { ArrowUpRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import {
  localized,
  ownershipKey,
  type PublicProduct,
} from "@zenith/shared/browser";
import { useShop } from "../lib/context";
import { Preview } from "./Preview";
import { errorMessage } from "../lib/api";

export function ProductCard({ product }: { product: PublicProduct }) {
  const { locale, t, money, me, toggleWishlist, toast } = useShop();
  const rights = new Set(me?.entitlements.flatMap((e) => e.line.rights) ?? []);
  const remaining = product.offers.filter((o) => !rights.has(ownershipKey(o)));
  const owned = remaining.length === 0 && product.offers.length > 0;
  const partial = !owned && remaining.length < product.offers.length;
  const saved = me?.wishlist.includes(product.id);
  return (
    <article className="product-card">
      <Link
        to={`/products/${product.slug}`}
        className="product-image"
        aria-label={localized(product.title, locale)}
      >
        <Preview
          url={product.media.find((m) => m.type === "video")?.url}
          poster={product.cover}
          auto
          label={localized(product.title, locale)}
        />
      </Link>
      <div className="product-meta">
        <span>
          {product.kind === "bundle"
            ? "Bundle"
            : product.kind === "ae"
              ? "After Effects"
              : (product.tags[0] ?? "Video")}
        </span>
        <button
          className={`icon-button favorite ${saved ? "selected" : ""}`}
          aria-label={
            saved
              ? t("Bỏ yêu thích", "Remove from wishlist")
              : t("Yêu thích", "Add to wishlist")
          }
          aria-pressed={!!saved}
          onClick={() => {
            void toggleWishlist(product.id).catch((e) =>
              toast(errorMessage(e, locale)),
            );
          }}
        >
          <Heart size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <Link className="product-title" to={`/products/${product.slug}`}>
        {localized(product.title, locale)}
        <ArrowUpRight size={17} />
      </Link>
      <div className="product-bottom">
        <span>
          {owned
            ? t("Đã sở hữu", "In your library")
            : partial
              ? t("Một lựa chọn đã sở hữu", "One option owned")
              : product.offers.length > 1
                ? t("Giá từ", "From")
                : t(
                    product.offers[0]?.quality || "Tài nguyên số",
                    product.offers[0]?.quality || "Digital download",
                  )}
        </span>
        <strong>
          {owned ? (
            <Link to="/library">{t("Mở Thư viện", "Open library")}</Link>
          ) : (
            money(Math.min(...remaining.map((o) => o.priceVnd)))
          )}
        </strong>
      </div>
    </article>
  );
}
