import {
  ownershipKey,
  type Actor,
  type Coupon,
  type Entitlement,
  type Offer,
  type Order,
  type OrderLine,
  type Product,
  type Quote,
} from "@zenith/shared";
import { requireCondition } from "./errors.js";

export function rightsFor(offer: Offer, offers: Offer[]): string[] {
  return [
    ...new Set([
      ownershipKey(offer),
      ...offer.items.flatMap((i) => {
        const member = offers.find((o) => o.id === i.offerId);
        return member ? [ownershipKey(member)] : [];
      }),
    ]),
  ];
}
export function filesFor(offer: Offer, offers: Offer[]): string[] {
  return [
    ...new Set([
      ...offer.fileIds,
      ...(offer.readmeFileId ? [offer.readmeFileId] : []),
      ...offer.items.flatMap((item) => {
        if (!item.offerId) return item.fileIds;
        const member = offers.find((option) => option.id === item.offerId);
        return member
          ? [
              ...member.fileIds,
              ...(member.readmeFileId ? [member.readmeFileId] : []),
            ]
          : [];
      }),
    ]),
  ];
}
export function quoteCart(input: {
  offerIds: string[];
  coupon: string;
  actor: Actor;
  products: Product[];
  offers: Offer[];
  entitlements: Entitlement[];
  coupons: Coupon[];
  orders: Order[];
  now: Date;
}): Quote {
  const {
    offerIds,
    actor,
    products,
    offers,
    entitlements,
    coupons,
    orders,
    now,
  } = input;
  requireCondition(
    offerIds.length > 0 && offerIds.length <= 30,
    "EMPTY_CART",
    "Giỏ hàng cần có từ 1 đến 30 sản phẩm.",
  );
  requireCondition(
    new Set(offerIds).size === offerIds.length,
    "DUPLICATE_CART",
    "Một lựa chọn xuất hiện hai lần trong giỏ.",
  );
  const owned = new Set(
    entitlements
      .filter((e) => e.userId === actor.id)
      .flatMap((e) => e.line.rights),
  );
  const selected = offerIds.map((id) => {
    const offer = offers.find((o) => o.id === id);
    requireCondition(
      offer,
      "OFFER_UNAVAILABLE",
      "Lựa chọn này không còn được bán.",
      409,
    );
    const product = products.find((p) => p.id === offer.productId);
    requireCondition(
      product?.status === "active" && product.published?.offerIds.includes(id),
      "PRODUCT_UNAVAILABLE",
      "Sản phẩm không còn được bán.",
      409,
    );
    requireCondition(
      !owned.has(ownershipKey(offer)),
      "ALREADY_OWNED",
      "Bạn đã sở hữu lựa chọn này. Mở Thư viện để tải xuống.",
      409,
      { offerId: id },
    );
    return { offer, product, content: product.published! };
  });
  for (let i = 0; i < selected.length; i++)
    for (let j = i + 1; j < selected.length; j++) {
      const left = rightsFor(selected[i].offer, offers),
        right = rightsFor(selected[j].offer, offers);
      requireCondition(
        !left.some((id) => right.includes(id)),
        "CART_OVERLAP",
        "Có nội dung trùng giữa các sản phẩm. Hãy chọn giữ một sản phẩm trước khi thanh toán.",
        409,
        { offerIds: [selected[i].offer.id, selected[j].offer.id] },
      );
    }
  const lines: OrderLine[] = selected.map(({ offer, product, content }) => {
    const ownsOffer = (id: string) => {
      const target = offers.find((o) => o.id === id);
      return !!target && owned.has(ownershipKey(target));
    };
    const upgradePrice = Math.min(
      offer.priceVnd,
      ...offer.upgrades
        .filter((u) => ownsOffer(u.fromOfferId))
        .map((u) => u.priceVnd),
    );
    const ownershipDiscountVnd = Math.min(
      upgradePrice,
      offer.items.reduce(
        (sum, i) => sum + (i.offerId && ownsOffer(i.offerId) ? i.creditVnd : 0),
        0,
      ),
    );
    return {
      offerId: offer.id,
      productId: product.id,
      title: content.title,
      label: offer.label,
      kind: content.kind,
      cover: content.cover,
      release: offer.release,
      quality: offer.quality,
      changelog: offer.changelog,
      fileIds: filesFor(offer, offers),
      rights: rightsFor(offer, offers),
      priceVnd: offer.priceVnd,
      upgradeDiscountVnd: offer.priceVnd - upgradePrice,
      ownershipDiscountVnd,
      couponDiscountVnd: 0,
      totalVnd: upgradePrice - ownershipDiscountVnd,
    };
  });
  const code = input.coupon.trim().toUpperCase();
  let coupon: Coupon | undefined;
  if (code) {
    coupon = coupons.find((c) => c.code === code);
    requireCondition(
      coupon?.active &&
        new Date(coupon.startsAt) <= now &&
        now < new Date(coupon.endsAt),
      "INVALID_COUPON",
      "Coupon không hợp lệ hoặc đã hết hạn.",
    );
    const used = orders.filter(
      (o) =>
        o.couponId === coupon!.id &&
        (["paid", "reported", "support"].includes(o.status) ||
          (o.status === "pending" && new Date(o.expiresAt) > now)),
    );
    requireCondition(
      used.length < coupon.maxUses &&
        used.filter((o) => o.userId === actor.id).length < coupon.perUser,
      "COUPON_LIMIT",
      "Coupon đã hết lượt sử dụng.",
    );
    const eligible = lines.filter(
      (l) =>
        !coupon!.productIds.length || coupon!.productIds.includes(l.productId),
    );
    const base = eligible.reduce((sum, l) => sum + l.totalVnd, 0);
    requireCondition(
      eligible.length > 0 && base >= coupon.minVnd,
      "COUPON_CONDITIONS",
      "Giỏ hàng không đủ điều kiện của Coupon.",
    );
    requireCondition(
      coupon.stackOwnership ||
        !eligible.some((l) => l.ownershipDiscountVnd > 0),
      "COUPON_STACKING",
      "Coupon này không kết hợp với giảm giá nội dung đã sở hữu.",
    );
    let remaining =
      coupon.kind === "percent"
        ? Math.floor((base * coupon.value) / 100)
        : Math.min(base, coupon.value);
    const discount = remaining;
    eligible.forEach((line, index) => {
      const share =
        index === eligible.length - 1
          ? remaining
          : Math.floor((discount * line.totalVnd) / base) || 0;
      line.couponDiscountVnd = share;
      line.totalVnd -= share;
      remaining -= share;
    });
  }
  const sum = (
    key:
      | "priceVnd"
      | "upgradeDiscountVnd"
      | "ownershipDiscountVnd"
      | "couponDiscountVnd"
      | "totalVnd",
  ) => lines.reduce((a, l) => a + l[key], 0);
  return {
    lines,
    subtotalVnd: sum("priceVnd"),
    upgradeDiscountVnd: sum("upgradeDiscountVnd"),
    ownershipDiscountVnd: sum("ownershipDiscountVnd"),
    couponDiscountVnd: sum("couponDiscountVnd"),
    totalVnd: sum("totalVnd"),
    couponId: coupon?.id ?? null,
    couponCode: coupon?.code ?? null,
  };
}
