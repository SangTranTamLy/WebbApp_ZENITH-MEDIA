import { randomUUID } from "node:crypto";
import type { Localized, Outbox } from "@zenith/shared";
import type { Repository } from "../db/repository.js";

export const nowIso = () => new Date().toISOString();
export const bilingual = (vi: string, en: string): Localized => ({ vi, en });
export async function audit(
  repo: Repository,
  actorId: string,
  action: string,
  targetId: string,
  detail: Record<string, unknown> = {},
) {
  await repo.put("audit", {
    id: randomUUID(),
    actorId,
    action,
    targetId,
    detail,
    createdAt: nowIso(),
  });
}
export async function notify(
  repo: Repository,
  userId: string,
  title: Localized,
  body: Localized,
  href: string,
) {
  await repo.put("notifications", {
    id: randomUUID(),
    userId,
    title,
    body,
    href,
    read: false,
    createdAt: nowIso(),
  });
}
export async function enqueue(
  repo: Repository,
  event: string,
  channel: Outbox["channel"],
  title: string,
  body: string,
  href: string,
  recipient = "",
) {
  await repo.put("outbox", {
    id: randomUUID(),
    event,
    channel,
    title,
    body,
    href,
    recipient,
    status: "queued",
    attempts: 0,
    nextAt: nowIso(),
    leaseUntil: null,
    error: null,
  });
}
