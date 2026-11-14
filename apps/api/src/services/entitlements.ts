import { randomUUID } from "node:crypto";
import { ownershipKey, type Offer } from "@zenith/shared";
import type { Repository } from "../db/repository.js";
import { filesFor, rightsFor } from "../domain/pricing.js";
import { nowIso } from "./events.js";

// Also runs when an old pending order is paid after a free update was published.
export async function grantPublishedFreeUpdates(
  repo: Repository,
  userId: string,
) {
  const owned = await repo.list("entitlements", "userId", userId);
  const offers = await repo.list("offers");
  const products = await repo.list("products");
  const eligible = offers.filter((o) =>
    products.some((p) => p.published?.offerIds.includes(o.id)),
  );
  const candidate = (id: string) => offers.find((o) => o.id === id);
  for (let pass = 0; pass < eligible.length; pass++) {
    let granted = false;
    for (const offer of eligible) {
      if (
        !offer.freeFromOfferIds.length ||
        owned.some((e) => e.line.rights.includes(ownershipKey(offer)))
      )
        continue;
      const previous = owned.find((e) =>
        offer.freeFromOfferIds.some((id) => {
          const from = candidate(id);
          return from && e.line.rights.includes(ownershipKey(from));
        }),
      );
      if (!previous) continue;
      const fileIds = filesFor(offer, offers);
      const available = await Promise.all(
        fileIds.map((id) => repo.get("files", id)),
      );
      if (!available.every((f) => f?.status === "ready")) continue;
      const grant = {
        id: randomUUID(),
        userId,
        orderId: previous.orderId,
        offerId: offer.id,
        productId: offer.productId,
        createdAt: nowIso(),
        source: "free-update" as const,
        line: {
          ...previous.line,
          title: products.find((p) => p.id === offer.productId)!.published!
            .title,
          kind: products.find((p) => p.id === offer.productId)!.published!.kind,
          cover: products.find((p) => p.id === offer.productId)!.published!
            .cover,
          productId: offer.productId,
          offerId: offer.id,
          label: offer.label,
          release: offer.release,
          quality: offer.quality,
          changelog: offer.changelog,
          fileIds,
          rights: rightsFor(offer, offers),
          priceVnd: 0,
          upgradeDiscountVnd: 0,
          ownershipDiscountVnd: 0,
          couponDiscountVnd: 0,
          totalVnd: 0,
        },
      };
      await repo.put("entitlements", grant);
      owned.push(grant);
      granted = true;
    }
    if (!granted) break;
  }
}
