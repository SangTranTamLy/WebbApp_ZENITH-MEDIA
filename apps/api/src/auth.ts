import { createClient } from "@supabase/supabase-js";
import type { RequestHandler } from "express";
import type { Actor } from "@zenith/shared";
import type { Config } from "./config.js";
import type { Repository } from "./db/repository.js";
import { requireCondition } from "./domain/errors.js";
import { nowIso } from "./services/events.js";

export function authentication(
  config: Config,
  repo: Repository,
): RequestHandler {
  const supabase = config.demo
    ? null
    : createClient(config.supabaseUrl, config.supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
      requireCondition(token, "UNAUTHENTICATED", "Vui lòng đăng nhập.", 401);
      let actor: Actor;
      if (config.demo) {
        const roles: Record<string, Actor> = {
          "demo-customer": {
            id: "demo-customer",
            email: "customer@example.test",
            name: "Khách trải nghiệm",
            verified: true,
            admin: false,
          },
          "demo-admin": {
            id: "demo-admin",
            email: "admin@example.test",
            name: "Admin Demo",
            verified: true,
            admin: true,
          },
          "demo-other": {
            id: "demo-other",
            email: "other@example.test",
            name: "Other Customer",
            verified: true,
            admin: false,
          },
          "demo-unverified": {
            id: "demo-unverified",
            email: "unverified@example.test",
            name: "Unverified",
            verified: false,
            admin: false,
          },
        };
        requireCondition(
          roles[token],
          "INVALID_TOKEN",
          "Phiên đăng nhập không hợp lệ.",
          401,
        );
        actor = roles[token];
      } else {
        const { data, error } = await supabase!.auth.getUser(token);
        requireCondition(
          !error && data.user,
          "INVALID_TOKEN",
          "Phiên đăng nhập đã hết hạn.",
          401,
        );
        actor = {
          id: data.user.id,
          email: data.user.email ?? "",
          name: String(data.user.user_metadata?.display_name ?? "").slice(
            0,
            100,
          ),
          verified: !!data.user.email_confirmed_at,
          admin: data.user.id === config.adminId,
        };
      }
      const account = await repo.get("accounts", actor.id);
      requireCondition(
        !account?.blocked,
        "ACCOUNT_BLOCKED",
        "Tài khoản đang bị tạm khóa. Vui lòng liên hệ cửa hàng.",
        403,
      );
      if (!account)
        await repo.transaction(async (tx) => {
          if (!(await tx.get("accounts", actor.id)))
            await tx.put("accounts", {
              id: actor.id,
              email: actor.email,
              name: actor.name,
              blocked: false,
              createdAt: nowIso(),
              deletionRequestedAt: null,
              lastReleases: {},
            });
        });
      if (account && account.email !== actor.email)
        await repo.transaction(async (tx) => {
          const current = (await tx.get("accounts", actor.id))!;
          await tx.put("accounts", { ...current, email: actor.email });
        });
      res.locals.actor = actor;
      next();
    } catch (error) {
      next(error);
    }
  };
}
export const adminOnly: RequestHandler = (_req, res, next) => {
  try {
    requireCondition(
      (res.locals.actor as Actor)?.admin,
      "FORBIDDEN",
      "Chỉ Admin được truy cập.",
      403,
    );
    next();
  } catch (error) {
    next(error);
  }
};
