import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { Offer, ProductContent, Settings } from "@zenith/shared";
import type { Repository } from "../db/repository.js";
import type { DemoStorage } from "./storage.js";
import { bilingual as t, nowIso } from "../services/events.js";

export const defaultSettings: Settings = {
  id: "store",
  heroTitle: t(
    "Từng khung hình.\nMột dấu ấn riêng.",
    "Every frame.\nMake it yours.",
  ),
  heroDescription: t(
    "Video, overlay và tài nguyên After Effects cho ý tưởng tiếp theo của bạn.",
    "Videos, overlays and After Effects assets for your next idea.",
  ),
  heroProductId: null,
  heroMediaId: null,
  watermark: "ZENITH MEDIA",
  usdRate: 25000,
  usdRateUpdatedAt: nowIso(),
  termsVersion: "draft-2026-11",
  license: t(
    "Sử dụng trong dự án cá nhân và sản phẩm đầu ra thương mại. Không bán lại, chia sẻ hoặc phân phối file gốc.",
    "Use in personal projects and commercial end products. Do not resell, share or redistribute source files.",
  ),
  refund: t(
    "Liên hệ hỗ trợ khi sản phẩm lỗi hoặc giao dịch sai. Không hoàn tiền chỉ vì đổi ý sau khi nhận quyền truy cập, trong phạm vi pháp luật cho phép. Quyền hợp pháp của khách hàng được bảo lưu.",
    "Contact support for defective products or incorrect transactions. Change-of-mind refunds after access are excluded where permitted by law. Statutory rights are preserved.",
  ),
  legalReviewed: false,
  checkoutEnabled: false,
  faq: [
    {
      question: t("Tôi nhận sản phẩm bằng cách nào?", "How do I get my files?"),
      answer: t(
        "Sau khi thanh toán được xác nhận, mở Thư viện để tải file.",
        "After payment is confirmed, download your files from My Library.",
      ),
    },
    {
      question: t(
        "Có thể sử dụng cho dự án thương mại không?",
        "Can I use assets commercially?",
      ),
      answer: t(
        "Bạn có thể sử dụng trong sản phẩm đầu ra thương mại theo giấy phép. Không phân phối lại file gốc.",
        "You may use assets in commercial end products under the license. Source files cannot be redistributed.",
      ),
    },
    {
      question: t("Tôi cần hỗ trợ về đơn hàng?", "Need help with an order?"),
      answer: t(
        "Mở chi tiết đơn hàng và tạo Ticket hỗ trợ.",
        "Open your order details and create a support ticket.",
      ),
    },
  ],
};
export async function seedBase(repo: Repository) {
  await repo.transaction(async (tx) => {
    if (!(await tx.get("settings", "store")))
      await tx.put("settings", defaultSettings);
    for (const c of [
      {
        id: "video",
        name: t("Video & Overlay", "Video & Overlay"),
        parentId: null,
        position: 0,
        active: true,
      },
      {
        id: "flowframes",
        name: t("Flowframes", "Flowframes"),
        parentId: "video",
        position: 1,
        active: true,
      },
      {
        id: "twixtor",
        name: t("Twixtor Slow", "Twixtor Slow"),
        parentId: "video",
        position: 2,
        active: true,
      },
      {
        id: "ae",
        name: t("After Effects Assets", "After Effects Assets"),
        parentId: null,
        position: 3,
        active: true,
      },
      {
        id: "bundle",
        name: t("Bundle", "Bundles"),
        parentId: null,
        position: 4,
        active: true,
      },
    ])
      if (!(await tx.get("categories", c.id))) await tx.put("categories", c);
  });
}
export async function seedDemo(repo: Repository, storage: DemoStorage) {
  await seedBase(repo);
  if (await repo.get("products", "aurora")) return;
  const assets = new URL("../../../../demo-assets/", import.meta.url);
  const video = await readFile(new URL("preview.mp4", assets));
  const zip = await readFile(new URL("studio-collection.zip", assets));
  const readme = Buffer.from(
    "ZENITH MEDIA DEMO\nThis is a local test asset, not a commercial product.\nImport the included clip into your editing timeline.\n",
  );
  const data = [
    { id: "demo-clip", name: "sample.mp4", type: "video/mp4", bytes: video },
    {
      id: "demo-readme",
      name: "README.txt",
      type: "text/plain",
      bytes: readme,
    },
    {
      id: "demo-zip",
      name: "collection.zip",
      type: "application/zip",
      bytes: zip,
    },
    {
      id: "demo-ae",
      name: "demo-preset.txt",
      type: "text/plain",
      bytes: Buffer.from(
        "Demo placeholder for After Effects product delivery. Not a usable preset.",
      ),
    },
    {
      id: "demo-blue-clip",
      name: "blue-hour.mp4",
      type: "video/mp4",
      bytes: await readFile(new URL("studio-preview-2.mp4", assets)),
    },
    {
      id: "demo-prism-clip",
      name: "prism.mp4",
      type: "video/mp4",
      bytes: await readFile(new URL("studio-preview-3.mp4", assets)),
    },
    {
      id: "demo-violet-clip",
      name: "violet.mp4",
      type: "video/mp4",
      bytes: await readFile(new URL("studio-preview-6.mp4", assets)),
    },
    {
      id: "demo-aurora-720",
      name: "aurora-720.mp4",
      type: "video/mp4",
      bytes: await readFile(new URL("aurora-720.mp4", assets)),
    },
  ];
  for (const file of data)
    await storage.seed(`demo/${file.name}`, file.bytes, file.type);
  await repo.transaction(async (tx) => {
    for (const file of data)
      await tx.put("files", {
        id: file.id,
        name: file.name,
        key: `demo/${file.name}`,
        bucket: "products",
        type: file.type,
        size: file.bytes.length,
        sha256: createHash("sha256").update(file.bytes).digest("hex"),
        status: "ready",
        purpose: "product",
        ownerId: null,
        createdAt: nowIso(),
        zip:
          file.id === "demo-zip"
            ? {
                status: "valid",
                errors: [],
                warnings: [],
                entries: ["sample.mp4", "blue-hour.mp4", "README.txt"],
                acknowledgedBy: null,
              }
            : null,
      });
    await tx.put("jobs", {
      id: "demo-preview",
      type: "preview",
      fileId: "demo-clip",
      status: "done",
      start: 0,
      duration: 8,
      watermark: "ZENITH MEDIA DEMO",
      outputKey: "",
      outputUrl: "/demo-media/preview.mp4",
      attempts: 1,
      leaseToken: null,
      leaseUntil: null,
      error: null,
      createdAt: nowIso(),
    });
    const items = [
      {
        id: "aurora",
        title: "Aurora / Motion Study",
        category: "flowframes",
        kind: "video" as const,
        price: 120000,
        image: 1,
        tag: "Flowframes",
      },
      {
        id: "blue-hour",
        title: "Blue Hour / Slow Motion",
        category: "twixtor",
        kind: "video" as const,
        price: 150000,
        image: 2,
        tag: "Twixtor Slow",
      },
      {
        id: "light-leaks",
        title: "Prism / Light Overlays",
        category: "video",
        kind: "video" as const,
        price: 90000,
        image: 3,
        tag: "Overlay",
      },
      {
        id: "type-motion",
        title: "Kinetic Type / Essentials",
        category: "ae",
        kind: "ae" as const,
        price: 240000,
        image: 4,
        tag: "After Effects",
      },
      {
        id: "studio-bundle",
        title: "The Motion Collection",
        category: "bundle",
        kind: "bundle" as const,
        price: 390000,
        image: 5,
        tag: "Bundle",
      },
      {
        id: "violet",
        title: "Violet / Frame Collection",
        category: "flowframes",
        kind: "video" as const,
        price: 180000,
        image: 6,
        tag: "Flowframes",
      },
    ];
    const descriptions: Record<string, [string, string]> = {
      aurora: [
        "Ánh kim, thủy tinh và chuyển động nhẹ trong một nghiên cứu thị giác. File demo 8 giây để trải nghiệm lựa chọn chất lượng và tải xuống.",
        "Chrome, glass and subtle motion in a visual study. An 8-second demo for exploring quality options and downloads.",
      ],
      "blue-hour": [
        "Một khung cảnh phố đêm, ánh đèn và sắc xanh giờ chạng vạng. Clip demo từ ảnh tạo bằng AI, phục vụ trải nghiệm cửa hàng.",
        "A blue-hour city scene with neon reflections. A demo clip made from generated artwork for exploring the store.",
      ],
      "light-leaks": [
        "Thử nghiệm ánh sáng khúc xạ qua lăng kính. Clip minh họa có watermark, không phải bộ overlay thương mại.",
        "A study of light refracting through a prism. A watermarked sample clip, not a commercial overlay pack.",
      ],
      "type-motion": [
        "Thiết kế chữ với sắc lavender và hình khối chrome. Bản demo minh họa cách giao tài nguyên AE; file kèm chưa phải preset sử dụng được.",
        "Lavender typography and chrome shapes. A demonstration of AE asset delivery; the included file is not a usable preset.",
      ],
      "studio-bundle": [
        "Khám phá Aurora, Blue Hour và nội dung đi kèm trong cùng một bộ sưu tập demo. Tải ZIP hoặc từng file; ưu đãi theo video đã sở hữu.",
        "Explore Aurora, Blue Hour and extras in one demo collection. Download the ZIP or individual files, with eligible ownership credits.",
      ],
      violet: [
        "Thủy tinh tím, ánh sáng mềm và những chi tiết macro. Clip từ artwork tạo bằng AI để thử preview, Wishlist và thư viện riêng.",
        "Violet glass, soft light and macro details. A generated-artwork clip for trying previews, wishlists and your library.",
      ],
    };
    for (const [i, item] of items.entries()) {
      const jobId =
        item.id === "aurora" ? "demo-preview" : `demo-preview-${item.id}`;
      const previewUrl = `/demo-media/studio-preview-${item.image}.mp4`;
      await tx.put("jobs", {
        id: jobId,
        type: "preview",
        fileId: "demo-clip",
        status: "done",
        start: 0,
        duration: 8,
        watermark: "ZENITH MEDIA DEMO",
        outputKey: "",
        outputUrl: previewUrl,
        attempts: 1,
        leaseToken: null,
        leaseUntil: null,
        error: null,
        createdAt: nowIso(),
      });
      const content: ProductContent = {
        slug: item.id,
        title: t(item.title, item.title),
        description: t(...descriptions[item.id]),
        instructions: t(
          "Tải file từ Thư viện sau khi đơn được xác nhận. Giải nén Bundle và đọc README trước khi sử dụng.",
          "Download from My Library after confirmation. Extract bundles and read the included README.",
        ),
        kind: item.kind,
        categoryId: item.category,
        tags: [item.tag],
        priority: 10 - i,
        cover: `/demo-media/studio-cover-${item.image}.webp`,
        media: [
          {
            id: jobId,
            type: "video",
            url: previewUrl,
            poster: `/demo-media/studio-cover-${item.image}.webp`,
            label: t("Xem thử", "Preview"),
          },
          {
            id: `still-${item.id}`,
            type: "image",
            url: `/demo-media/studio-cover-${item.image}.webp`,
            poster: "",
            label: t("Ảnh chi tiết", "Artwork detail"),
          },
        ],
        mainPreviewJobId: jobId,
        offerIds: [`${item.id}-standard`],
        relatedIds: [],
        specs: [
          {
            label: t("Định dạng", "Format"),
            value: t(
              item.kind === "bundle"
                ? "ZIP"
                : item.kind === "ae"
                  ? "Demo asset"
                  : "MP4",
              item.kind === "bundle"
                ? "ZIP"
                : item.kind === "ae"
                  ? "Demo asset"
                  : "MP4",
            ),
          },
          {
            label: t("Nội dung", "Content"),
            value: t("File kiểm thử", "Test asset"),
          },
          ...(item.kind === "video"
            ? [
                {
                  label: t("Độ phân giải", "Resolution"),
                  value: t("960 × 540", "960 × 540"),
                },
                {
                  label: t("Khung hình", "Frame rate"),
                  value: t("24 FPS", "24 FPS"),
                },
                {
                  label: t("Thời lượng", "Duration"),
                  value: t("8 giây", "8 seconds"),
                },
              ]
            : []),
        ],
        dependencies:
          item.kind === "ae"
            ? [
                {
                  kind: "software",
                  name: "Adobe After Effects",
                  version: "2024+",
                  required: true,
                  url: "https://www.adobe.com/products/aftereffects.html",
                },
              ]
            : [],
      };
      await tx.put("products", {
        id: item.id,
        status: "active",
        published: content,
        draft: content,
        revision: 1,
        createdAt: nowIso(),
        publishedAt: nowIso(),
      });
      const offer: Offer = {
        id: `${item.id}-standard`,
        productId: item.id,
        label: t(
          item.kind === "video" ? "540p" : "Standard",
          item.kind === "video" ? "540p" : "Standard",
        ),
        quality: item.kind === "video" ? "540p" : "",
        release: item.kind === "video" ? "" : "1.0",
        priceVnd: item.price,
        fileIds: [
          item.kind === "bundle"
            ? "demo-zip"
            : item.kind === "ae"
              ? "demo-ae"
              : item.id === "blue-hour"
                ? "demo-blue-clip"
                : item.id === "light-leaks"
                  ? "demo-prism-clip"
                  : item.id === "violet"
                    ? "demo-violet-clip"
                    : "demo-clip",
        ],
        readmeFileId: "demo-readme",
        changelog: t("Bản phát hành đầu tiên.", "Initial release."),
        items:
          item.kind === "bundle"
            ? [
                {
                  offerId: "aurora-standard",
                  title: t("Aurora / Motion Study", "Aurora / Motion Study"),
                  fileIds: [],
                  creditVnd: 80000,
                },
                {
                  offerId: "blue-hour-standard",
                  title: t(
                    "Blue Hour / Slow Motion",
                    "Blue Hour / Slow Motion",
                  ),
                  fileIds: [],
                  creditVnd: 100000,
                },
                {
                  offerId: null,
                  title: t(
                    "Nội dung độc quyền: README",
                    "Exclusive content: README",
                  ),
                  fileIds: ["demo-readme"],
                  creditVnd: 0,
                },
              ]
            : [],
        upgrades: [],
        freeFromOfferIds: [],
      };
      await tx.put("offers", offer);
      if (item.id === "aurora") {
        await tx.put("offers", {
          ...offer,
          id: "aurora-720",
          label: t("720p", "720p"),
          quality: "720p",
          priceVnd: 180000,
          fileIds: ["demo-aurora-720"],
          upgrades: [{ fromOfferId: offer.id, priceVnd: 60000 }],
          specs: [
            {
              label: t("Độ phân giải", "Resolution"),
              value: t("1280 × 720", "1280 × 720"),
            },
            {
              label: t("Khung hình", "Frame rate"),
              value: t("24 FPS", "24 FPS"),
            },
            {
              label: t("Thời lượng", "Duration"),
              value: t("8 giây", "8 seconds"),
            },
          ],
        });
        const product = (await tx.get("products", item.id))!;
        const withOptions = { ...content, offerIds: [offer.id, "aurora-720"] };
        await tx.put("products", {
          ...product,
          published: withOptions,
          draft: withOptions,
        });
      }
    }
    await tx.put("settings", {
      ...defaultSettings,
      heroProductId: "violet",
      heroMediaId: "demo-preview-violet",
      checkoutEnabled: true,
      legalReviewed: true,
    });
    await tx.put("coupons", {
      id: "studio10",
      code: "STUDIO10",
      kind: "percent",
      value: 10,
      startsAt: "2020-01-01T00:00:00.000Z",
      endsAt: "2099-01-01T00:00:00.000Z",
      minVnd: 0,
      maxUses: 10000,
      perUser: 10,
      productIds: [],
      stackOwnership: true,
      active: true,
    });
  });
}
