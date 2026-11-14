import type { Localized, Locale, Offer } from "./index.js";
export type * from "./index.js";

// Browser entry contains only display/identity helpers; server Zod contracts stay out of storefront bundles.
export const localized = (value: Localized, locale: Locale) =>
  value[locale] || value.vi || value.en;

// Pricing edits never create a new purchasable right for the same release and quality.
export const ownershipKey = (
  offer: Pick<Offer, "productId" | "release" | "quality">,
): string =>
  JSON.stringify([
    offer.productId,
    offer.release.normalize("NFKC").trim().toLowerCase(),
    offer.quality.normalize("NFKC").trim().toLowerCase(),
  ]);
