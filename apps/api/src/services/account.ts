import { createClient } from "@supabase/supabase-js";
import type { Actor } from "@zenith/shared";
import type { Config } from "../config.js";
import type { Repository } from "../db/repository.js";
import { requireCondition } from "../domain/errors.js";
import { audit, enqueue, nowIso } from "./events.js";

export async function requestDeletion(
  repo: Repository,
  config: Config,
  actor: Actor,
  password: string,
) {
  requireCondition(
    !actor.admin,
    "ADMIN_DELETE",
    "Không thể yêu cầu xóa tài khoản Admin qua luồng khách hàng.",
  );
  requireCondition(
    actor.verified,
    "EMAIL_UNVERIFIED",
    "Vui lòng xác minh email.",
    403,
  );
  if (!config.demo) {
    const client = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const login = await client.auth.signInWithPassword({
      email: actor.email,
      password,
    });
    requireCondition(
      !login.error && login.data.user?.id === actor.id,
      "PASSWORD_INVALID",
      "Mật khẩu không đúng.",
      403,
    );
    const send = await client.auth.signInWithOtp({
      email: actor.email,
      options: { shouldCreateUser: false },
    });
    requireCondition(
      !send.error,
      "EMAIL_FAILED",
      "Không gửi được mã xác nhận. Vui lòng thử lại.",
      503,
    );
  }
  await repo.transaction((tx) =>
    audit(tx, actor.id, "deletion-challenge", actor.id),
  );
  return { ok: true };
}
export async function confirmDeletion(
  repo: Repository,
  config: Config,
  actor: Actor,
  token: string,
) {
  requireCondition(
    !actor.admin,
    "ADMIN_DELETE",
    "Không thể xóa Admin qua luồng khách hàng.",
  );
  const challenges = (await repo.list("audit", "actorId", actor.id)).filter(
    (a) => a.action === "deletion-challenge",
  );
  requireCondition(
    challenges.some(
      (c) => Date.now() - new Date(c.createdAt).getTime() < 15 * 60_000,
    ),
    "CHALLENGE_EXPIRED",
    "Yêu cầu xác nhận đã hết hạn. Vui lòng xác nhận mật khẩu lại.",
    403,
  );
  if (config.demo)
    requireCondition(token === "123456", "INVALID_OTP", "Mã demo là 123456.");
  else {
    const client = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const result = await client.auth.verifyOtp({
      email: actor.email,
      token,
      type: "email",
    });
    requireCondition(
      !result.error && result.data.user?.id === actor.id,
      "INVALID_OTP",
      "Mã xác nhận email không hợp lệ.",
      403,
    );
  }
  return repo.transaction(async (tx) => {
    const account = (await tx.get("accounts", actor.id))!;
    const updated = await tx.put("accounts", {
      ...account,
      deletionRequestedAt: nowIso(),
    });
    await audit(tx, actor.id, "account-deletion-requested", actor.id);
    await enqueue(
      tx,
      "deletion-requested",
      "admin-discord",
      "Yêu cầu xóa tài khoản",
      "Kiểm tra nghĩa vụ lưu trữ giao dịch trước khi xử lý.",
      "/admin/customers",
    );
    return updated;
  });
}

export async function processDeletion(
  repo: Repository,
  config: Config,
  admin: Actor,
  userId: string,
  retentionNote: string,
) {
  requireCondition(
    admin.admin && userId !== admin.id,
    "FORBIDDEN",
    "Không thể xóa Admin qua quy trình này.",
    403,
  );
  const account = await repo.get("accounts", userId);
  requireCondition(
    account?.deletionRequestedAt,
    "NO_DELETION_REQUEST",
    "Khách chưa hoàn tất xác nhận yêu cầu xóa.",
    409,
  );
  if (account.deletionProcessedAt) return account;
  if (!config.demo)
    requireCondition(
      config.supabaseServiceKey,
      "AUTH_ADMIN_NOT_CONFIGURED",
      "Cần cấu hình khóa quản trị Supabase ở server để xử lý xóa Auth.",
      503,
    );
  await repo.transaction(async (tx) => {
    await tx.put("accounts", { ...account, blocked: true });
    await audit(tx, admin.id, "account-deletion-processing", userId, {
      retentionNote,
    });
  });
  if (!config.demo) {
    const client = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const result = await client.auth.admin.deleteUser(userId);
    requireCondition(
      !result.error || result.error.status === 404,
      "AUTH_DELETE_FAILED",
      "Chưa xóa được Supabase Auth. Tài khoản đã khóa; hãy kiểm tra rồi thử lại.",
      503,
    );
  }
  return repo.transaction(async (tx) => {
    const current = (await tx.get("accounts", userId))!;
    const updated = await tx.put("accounts", {
      ...current,
      blocked: true,
      name: "Deleted customer",
      email: "",
      lastReleases: {},
      deletionProcessedAt: nowIso(),
    });
    await tx.remove("carts", userId);
    await tx.remove("wishlists", userId);
    for (const notification of await tx.list("notifications", "userId", userId))
      await tx.remove("notifications", notification.id);
    await audit(tx, admin.id, "account-deletion-completed", userId, {
      retentionNote,
      retained:
        "Transaction and support evidence retained for the documented legal obligations.",
    });
    return updated;
  });
}
