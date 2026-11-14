import { test, expect } from "@playwright/test";

test("storefront filters, gallery, quality-specific files, bundle previews and cart conflict", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".product-card")).toHaveCount(6);
  await expect(page.locator(".latest-item")).toHaveCount(3);
  await page.getByRole("button", { name: "Flowframes", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(2);
  await page
    .getByRole("button", { name: "After Effects Assets", exact: true })
    .click();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Xem preview nổi bật", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").locator("video")).toHaveAttribute(
    "src",
    "/demo-media/studio-preview-6.mp4",
  );
  await page.keyboard.press("Escape");
  await page.goto("/products/aurora");
  await expect(page.locator(".file-list")).toContainText("sample.mp4");
  await expect(page.locator(".file-list")).not.toContainText("aurora-720.mp4");
  await page.getByRole("button", { name: "720p", exact: true }).click();
  await expect(page.locator(".price-large")).toContainText("180.000");
  await expect(page.locator(".spec-highlights")).toContainText("1280 × 720");
  await expect(page.locator(".file-list")).toContainText("aurora-720.mp4");
  await expect(page.locator(".file-list")).not.toContainText("sample.mp4");
  await page.getByRole("button", { name: "Ảnh chi tiết", exact: true }).click();
  await expect(page.locator(".large-preview img")).toHaveAttribute(
    "src",
    "/demo-media/studio-cover-1.webp",
  );
  await page.getByRole("tab", { name: "Mô tả", exact: true }).focus();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("tab", { name: "Giấy phép", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Home");
  await page.getByRole("button", { name: "540p", exact: true }).click();
  await page
    .getByRole("button", { name: "Thêm vào giỏ hàng", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await page.goto("/products/studio-bundle");
  await page
    .getByRole("button", {
      name: "Xem thử Blue Hour / Slow Motion",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog").locator("video")).toHaveAttribute(
    "src",
    "/demo-media/studio-preview-2.mp4",
  );
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Thêm vào giỏ hàng", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Có video trùng",
  );
  await expect(
    page.getByRole("link", { name: "Đến thanh toán", exact: true }),
  ).toHaveCount(0);
  await page
    .locator(".cart-line")
    .filter({ hasText: "The Motion Collection" })
    .getByRole("button", { name: "Bỏ sản phẩm" })
    .click();
  await expect(
    page.getByRole("link", { name: "Đến thanh toán", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/products/aurora");
  await expect(
    page.getByRole("heading", { name: "Aurora / Motion Study", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".mobile-buy")).toHaveCount(0);
  await page.locator(".file-section").scrollIntoViewIfNeeded();
  await expect(page.locator(".mobile-buy")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("a saved order remains reachable when the post-checkout account refresh fails", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() =>
    sessionStorage.setItem("zenith-demo-token", "demo-other"),
  );
  await page.goto("/products/violet");
  await expect(page.locator(".account-trigger")).toHaveAttribute(
    "href",
    "/library",
  );
  await page.getByRole("button", { name: "Mua ngay", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout/);
  await page.getByRole("checkbox").check();
  await page.route("**/api/me", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "CONNECTION",
          message: "Test: profile service unavailable",
        },
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Tạo đơn & thanh toán", exact: true })
    .click();
  await expect(page).toHaveURL(/\/orders\/ZM/);
  await expect(
    page.getByRole("heading", { name: "Chi tiết đơn hàng", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Tôi đã chuyển khoản MB Bank",
      exact: true,
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("multi-file upload skips a failed file, continues, and lets admin retry", async ({
  page,
}) => {
  await page.addInitScript(() =>
    sessionStorage.setItem("zenith-demo-token", "demo-admin"),
  );
  await page.goto("/admin/uploads");
  let failed = false;
  await page.route("**/api/uploads", async (route) => {
    if (
      !failed &&
      route.request().method() === "POST" &&
      route.request().postDataJSON().name === "first-audit.txt"
    ) {
      failed = true;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: { code: "CONNECTION", message: "Temporary upload failure" },
        }),
      });
    } else await route.continue();
  });
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles([
      {
        name: "first-audit.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("Retryable demo upload"),
      },
      {
        name: "second-audit.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("Continue after the first file fails"),
      },
    ]);
  await expect(
    page.locator(".upload-item").filter({ hasText: "first-audit.txt" }),
  ).toContainText("Lỗi");
  await expect(
    page.locator(".upload-item").filter({ hasText: "second-audit.txt" }),
  ).toContainText("kiểm tra");
  await page
    .locator(".upload-item")
    .filter({ hasText: "first-audit.txt" })
    .getByRole("button")
    .click();
  await expect(
    page.locator(".upload-item").filter({ hasText: "first-audit.txt" }),
  ).toContainText("kiểm tra");
});
