import { grantPublishedFreeUpdates } from "./entitlements.js";
import {
  ownershipKey,
  type Actor,
  type Offer,
  type Product,
  type ProductContent,
  type PublicProduct,
} from "@zenith/shared";
import type { Repository } from "../db/repository.js";
import { requireCondition } from "../domain/errors.js";
import { filesFor, rightsFor } from "../domain/pricing.js";
import { categoryIsVisible } from "../domain/categories.js";
import { audit, bilingual, enqueue, notify, nowIso } from "./events.js";

export async function publicCatalog(
  repo: Repository,
): Promise<PublicProduct[]> {
  const [products, offers, files, categories] = await Promise.all([
    repo.list("products"),
    repo.list("offers"),
    repo.list("files"),
    repo.list("categories"),
  ]);
  return products
    .filter(
      (p) =>
        p.published &&
        ["active", "retired"].includes(p.status) &&
        categoryIsVisible(p.published!.categoryId, categories),
    )
    .map((p) => {
      const selected = p
        .published!.offerIds.map((id) => offers.find((o) => o.id === id))
        .filter((o): o is Offer => !!o);
      const ids = new Set(selected.flatMap((o) => filesFor(o, offers)));
      // Never expose object keys, checksums or private storage locations in catalog responses.
      return {
        ...p.published!,
        mainPreviewJobId: null,
        id: p.id,
        status: p.status,
        publishedAt: p.publishedAt,
        offers: selected.map((offer) => ({
          ...offer,
          includedFileIds: filesFor(offer, offers),
          grantedRights: rightsFor(offer, offers),
          components: offer.items.map((item) => {
            const member = offers.find((o) => o.id === item.offerId);
            const parent =
              member && products.find((p) => p.id === member.productId);
            const visible =
              parent?.published &&
              ["active", "retired"].includes(parent.status) &&
              categoryIsVisible(parent.published.categoryId, categories);
            const content = visible ? parent.published! : null;
            return {
              title: item.title,
              offerId: item.offerId,
              slug: content?.slug ?? null,
              quality: member?.quality ?? "",
              preview:
                item.preview ??
                content?.media.find((m) => m.type === "video") ??
                null,
            };
          }),
        })),
        files: files
          .filter((f) => ids.has(f.id))
          .map(({ id, name, size, type }) => ({ id, name, size, type })),
      };
    });
}
export async function saveDraft(
  repo: Repository,
  actor: Actor,
  id: string,
  content: ProductContent,
  revision: number,
) {
  return repo.transaction(async (tx) => {
    const current = await tx.get("products", id);
    requireCondition(
      !current || current.revision === revision,
      "DRAFT_CONFLICT",
      "Bản nháp đã được thay đổi. Tải lại trước khi lưu.",
      409,
    );
    requireCondition(
      await tx.get("categories", content.categoryId),
      "INVALID_CATEGORY",
      "Danh mục không tồn tại.",
    );
    const product: Product = current
      ? { ...current, draft: content, revision: current.revision + 1 }
      : {
          id,
          status: "draft",
          draft: content,
          published: null,
          revision: 1,
          createdAt: nowIso(),
          publishedAt: null,
        };
    await tx.put("products", product);
    await audit(tx, actor.id, "draft-saved", id, {
      revision: product.revision,
    });
    return product;
  });
}
export async function addOffer(repo: Repository, actor: Actor, offer: Offer) {
  return repo.transaction(async (tx) => {
    requireCondition(
      await tx.get("products", offer.productId),
      "NOT_FOUND",
      "Tạo bản nháp sản phẩm trước.",
      404,
    );
    requireCondition(
      !(await tx.get("offers", offer.id)),
      "IMMUTABLE_OFFER",
      "Lựa chọn đã được lưu. Tạo ID mới để bảo toàn bản cũ.",
      409,
    );
    requireCondition(
      new Set(offer.items.filter((i) => i.offerId).map((i) => i.offerId))
        .size === offer.items.filter((i) => i.offerId).length,
      "DUPLICATE_COMPONENT",
      "Bundle có nội dung trùng.",
    );
    const memberRights = new Set<string>();
    for (const item of offer.items) {
      if (item.preview?.type === "video") {
        const jobs = await tx.list("jobs");
        requireCondition(
          jobs.some(
            (j) =>
              j.type === "preview" &&
              j.status === "done" &&
              j.outputUrl === item.preview!.url,
          ),
          "PREVIEW_NOT_READY",
          "Preview thành phần cần được xử lý watermark trước.",
          409,
        );
      }
    }
    for (const item of offer.items)
      if (item.offerId) {
        const member = await tx.get("offers", item.offerId);
        requireCondition(
          member &&
            !member.items.length &&
            member.productId !== offer.productId,
          "INVALID_COMPONENT",
          "Thành phần Bundle phải là một lựa chọn độc lập.",
        );
        const right = ownershipKey(member);
        requireCondition(
          !memberRights.has(right),
          "DUPLICATE_COMPONENT",
          "Bundle có nội dung trùng quyền sở hữu.",
        );
        memberRights.add(right);
      }
    for (const rule of [
      ...offer.upgrades.map((u) => u.fromOfferId),
      ...offer.freeFromOfferIds,
    ]) {
      const previous = await tx.get("offers", rule);
      requireCondition(
        previous?.productId === offer.productId,
        "INVALID_UPGRADE",
        "Nâng cấp chỉ áp dụng giữa các lựa chọn của cùng sản phẩm.",
      );
    }
    const all = await tx.list("offers");
    for (const id of filesFor(offer, all)) {
      const file = await tx.get("files", id);
      requireCondition(
        file?.purpose === "product" && file.status === "ready",
        "INVALID_FILE",
        "File sản phẩm không tồn tại hoặc sai mục đích.",
      );
    }
    await tx.put("offers", offer);
    await audit(tx, actor.id, "offer-created", offer.id);
    return offer;
  });
}
export async function publishProduct(
  repo: Repository,
  actor: Actor,
  id: string,
  revision: number,
  acknowledgeWarnings: boolean,
) {
  return repo.transaction(async (tx) => {
    const product = await tx.get("products", id);
    requireCondition(product, "NOT_FOUND", "Không tìm thấy sản phẩm.", 404);
    requireCondition(
      product.revision === revision,
      "DRAFT_CONFLICT",
      "Bản nháp đã thay đổi. Hãy kiểm tra lại.",
      409,
    );
    const content = structuredClone(product.draft);
    const categories = await tx.list("categories");
    requireCondition(
      categoryIsVisible(content.categoryId, categories),
      "CATEGORY_HIDDEN",
      "Danh mục chưa hoạt động.",
    );
    requireCondition(
      content.title.vi.trim() &&
        content.title.en.trim() &&
        content.description.vi.trim() &&
        content.description.en.trim(),
      "CONTENT_REQUIRED",
      "Cần nội dung tiếng Việt và tiếng Anh.",
    );
    const job = content.mainPreviewJobId
      ? await tx.get("jobs", content.mainPreviewJobId)
      : undefined;
    requireCondition(
      job?.type === "preview" && job.status === "done" && job.outputUrl,
      "PREVIEW_NOT_READY",
      "Preview chính phải xử lý xong trước khi đăng bán.",
      409,
    );
    const previewJobs = await tx.list("jobs");
    requireCondition(
      content.media
        .filter((m) => m.type === "video")
        .every((m) =>
          previewJobs.some(
            (j) =>
              j.type === "preview" &&
              j.status === "done" &&
              j.outputUrl === m.url,
          ),
        ),
      "PREVIEW_NOT_READY",
      "Preview phụ cần được xử lý watermark trước khi công bố.",
      409,
    );
    const all = await tx.list("offers");
    const offers = content.offerIds.map((oid) => all.find((o) => o.id === oid));
    requireCondition(
      offers.length > 0 && offers.every((o) => o?.productId === id),
      "INVALID_OFFER",
      "Có lựa chọn không thuộc sản phẩm.",
    );
    requireCondition(
      new Set((offers as Offer[]).map(ownershipKey)).size === offers.length,
      "DUPLICATE_OPTION",
      "Chỉ công bố một mức giá cho mỗi chất lượng / release.",
    );
    for (const offer of offers as Offer[]) {
      const files = await Promise.all(
        filesFor(offer, all).map((fid) => tx.get("files", fid)),
      );
      requireCondition(
        files.every((f) => f?.status === "ready" && f.sha256),
        "FILES_NOT_READY",
        "Tất cả file cần được kiểm tra và sẵn sàng.",
        409,
      );
      if (content.kind === "ae") {
        requireCondition(
          content.dependencies.some(
            (d) => d.kind === "software" && d.version.trim(),
          ),
          "COMPATIBILITY_REQUIRED",
          "Cần ghi phiên bản After Effects tương thích.",
        );
        requireCondition(
          content.instructions.vi.trim() &&
            content.instructions.en.trim() &&
            offer.readmeFileId &&
            files.some(
              (f) => f?.id === offer.readmeFileId && /readme/i.test(f.name),
            ),
          "README_REQUIRED",
          "Cần hướng dẫn song ngữ và file README.",
        );
      }
      if (content.kind === "bundle") {
        requireCondition(
          offer.items.length > 0,
          "EMPTY_BUNDLE",
          "Bundle cần có danh sách thành phần.",
        );
        const zip = files.find(
          (f) =>
            f?.name.toLowerCase().endsWith(".zip") &&
            offer.fileIds.includes(f.id),
        );
        requireCondition(
          zip?.zip?.status === "valid",
          "ZIP_INVALID",
          "ZIP phải được kiểm tra hợp lệ trước khi bán.",
          409,
        );
        const expected = offer.items.flatMap((i) =>
          i.offerId
            ? (all.find((o) => o.id === i.offerId)?.fileIds ?? [])
            : i.fileIds,
        );
        for (const fid of expected) {
          const f = files.find((f) => f?.id === fid);
          requireCondition(
            f && zip.zip.entries.some((e) => e.split("/").pop() === f.name),
            "ZIP_MISSING_COMPONENT",
            "ZIP thiếu một file thành phần.",
            409,
            { fileId: fid },
          );
        }
        if (zip.zip.warnings.length && !zip.zip.acknowledgedBy) {
          requireCondition(
            acknowledgeWarnings,
            "ZIP_WARNINGS",
            "ZIP có cảnh báo cần Admin xác nhận.",
            409,
            zip.zip.warnings,
          );
          await tx.put("files", {
            ...zip,
            zip: { ...zip.zip, acknowledgedBy: actor.id },
          });
          await audit(tx, actor.id, "zip-warnings-acknowledged", zip.id, {
            warnings: zip.zip.warnings,
          });
        }
      }
    }
    content.media = [
      {
        id: job.id,
        type: "video",
        url: job.outputUrl!,
        poster: content.cover,
        label: bilingual("Preview chính", "Main preview"),
      },
      ...content.media.filter((m) => m.id !== job.id),
    ];
    const updated = await tx.put("products", {
      ...product,
      status: "active",
      published: content,
      publishedAt: nowIso(),
      revision: product.revision + 1,
    });
    const entitlements = await tx.list("entitlements");
    for (const userId of new Set(
      entitlements.filter((e) => e.productId === id).map((e) => e.userId),
    ))
      await grantPublishedFreeUpdates(tx, userId);
    if (product.published)
      for (const userId of new Set(
        entitlements.filter((e) => e.productId === id).map((e) => e.userId),
      ))
        await notify(
          tx,
          userId,
          bilingual("Sản phẩm có cập nhật", "Product updated"),
          content.title,
          "/library",
        );
    await enqueue(
      tx,
      "product-published",
      "community-discord",
      content.title.vi,
      content.description.vi.slice(0, 500),
      `/products/${content.slug}`,
    );
    await enqueue(
      tx,
      "product-published",
      "admin-discord",
      "Đã công bố sản phẩm",
      content.title.vi,
      `/admin/products/${id}`,
    );
    await audit(tx, actor.id, "product-published", id, {
      revision: updated.revision,
    });
    return updated;
  });
}
