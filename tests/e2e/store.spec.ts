import { test, expect, type Page } from "@playwright/test";

async function customer(page: Page) {
  await page.goto("/login");
  await page
    .getByRole("button", { name: "Trải nghiệm khách hàng", exact: true })
    .click();
  await expect(page).toHaveURL(/\/library/);
}

test("customer checkout, admin confirmation, downloads, credits, support and notifications", async ({
  page,
  browser,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await customer(page);
  await page.goto("/products/aurora");
  await expect(
    page.getByRole("heading", { name: "Aurora / Motion Study", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Thêm vào giỏ hàng", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("link", { name: "Đến thanh toán", exact: true }).click();
  await expect(page.getByText("120.000 VND", { exact: true })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Tạo đơn & thanh toán", exact: true })
    .click();
  await expect(page).toHaveURL(/\/orders\/ZM/);
  const orderId = page.url().split("/").pop()!;
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Tôi đã chuyển khoản MB Bank",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Tôi đã chuyển khoản MB Bank", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Đang chờ Admin xác nhận", exact: true }),
  ).toBeVisible();
  await page.goto("/library");
  await expect(
    page.getByRole("heading", { name: "Không có tài nguyên phù hợp" }),
  ).toBeVisible();
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await admin.goto("http://127.0.0.1:5180/login");
  await admin
    .getByRole("button", { name: "Mở Admin demo", exact: true })
    .click();
  await expect(admin).toHaveURL(/\/admin$/);
  await admin.goto(`http://127.0.0.1:5180/admin/orders/${orderId}`);
  await admin.getByLabel("Mã giao dịch ngân hàng thực tế").fill("E2E-BANK-001");
  await admin
    .getByLabel("Tôi đã đối chiếu giao dịch trên tài khoản ngân hàng thực tế.")
    .check();
  await admin
    .getByRole("button", {
      name: "Xác nhận thanh toán & cấp quyền",
      exact: true,
    })
    .click();
  await expect(admin.getByText("Hoàn tất", { exact: true })).toBeVisible();
  await page.goto("/library");
  await expect(
    page.getByRole("heading", { name: "Aurora / Motion Study" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Xem & tải file" }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Tải sample.mp4", exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("sample.mp4");
  expect(await download.failure()).toBeNull();
  await page.goto("/products/aurora");
  await expect(
    page.getByRole("link", { name: "Mở trong Thư viện" }),
  ).toBeVisible();
  await page.goto("/products/studio-bundle");
  await page
    .getByRole("button", { name: "Mua ngay", exact: true })
    .first()
    .click();
  await expect(
    page.getByText("Nội dung đã sở hữu", { exact: true }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Coupon" }).fill("STUDIO10");
  await page.getByRole("button", { name: "Áp dụng" }).click();
  await expect(page.getByText("279.000 VND", { exact: true })).toBeVisible();
  await page.goto(`/support/new?order=${orderId}`);
  await page.getByLabel("Tiêu đề", { exact: true }).fill("Hỗ trợ file mẫu");
  await page
    .getByLabel("Nội dung cần hỗ trợ")
    .fill("Tôi cần hướng dẫn import file vào timeline.");
  await page.getByRole("button", { name: "Gửi Ticket", exact: true }).click();
  await expect(page).toHaveURL(/\/support\/[a-z0-9-]+$/);
  const ticketUrl = page.url();
  await expect(
    page.getByText("Tôi cần hướng dẫn import file vào timeline.", {
      exact: true,
    }),
  ).toBeVisible();
  await admin.goto(ticketUrl);
  await admin
    .getByLabel("Trả lời", { exact: true })
    .fill("Bạn có thể kéo file MP4 trực tiếp vào timeline.");
  await admin.getByRole("button", { name: "Gửi trả lời", exact: true }).click();
  await expect(
    admin.getByText("Bạn có thể kéo file MP4 trực tiếp vào timeline.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/notifications");
  await expect(
    page.getByRole("heading", { name: "Ticket có cập nhật" }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Đánh dấu tất cả đã đọc" }).click();
  await page.goto(ticketUrl);
  await expect(
    page.getByText("Bạn có thể kéo file MP4 trực tiếp vào timeline.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Đóng Ticket", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Mở lại Ticket", exact: true }),
  ).toBeVisible();
  await adminContext.close();
  expect(errors).toEqual([]);
});

test("responsive Vietnamese/English, Light/Dark and accessible cart navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Từng khung hình/ }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: ".local/screenshots/home-light-desktop.png",
    fullPage: true,
  });
  await page.getByRole("combobox", { name: "Ngôn ngữ" }).selectOption("en");
  await expect(
    page.getByRole("heading", { name: /Every frame/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: ".local/screenshots/home-dark-desktop.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: ".local/screenshots/home-dark-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page
    .getByRole("link", { name: "All assets", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/shop/);
  await page.screenshot({
    path: ".local/screenshots/shop-light-mobile.png",
    fullPage: true,
  });
  await page.goto("/products/light-leaks");
  await expect(
    page.getByRole("heading", { name: "Prism / Light Overlays", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".product-card video").first()).toBeVisible();
  expect(
    await page
      .locator(".product-card video")
      .first()
      .evaluate((v: HTMLVideoElement) => v.paused),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("admin draft edits are isolated from the live catalog", async ({
  page,
}) => {
  await page.goto("/login");
  await page
    .getByRole("button", { name: "Mở Admin demo", exact: true })
    .click();
  await page.goto("/admin/products/light-leaks");
  const titles = page
    .locator("fieldset")
    .filter({ has: page.locator("legend", { hasText: "Tên sản phẩm" }) });
  await titles
    .getByRole("textbox")
    .first()
    .fill("Prism / Bản nháp chưa công bố");
  await page.getByRole("button", { name: "Lưu bản nháp", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Đã lưu bản nháp");
  await page.goto("/products/light-leaks");
  await expect(
    page.getByRole("heading", { name: "Prism / Light Overlays", exact: true }),
  ).toBeVisible();
});
