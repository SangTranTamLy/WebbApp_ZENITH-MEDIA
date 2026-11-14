import { randomUUID } from "node:crypto";
import type { Actor } from "@zenith/shared";
import type { Repository } from "../db/repository.js";
import type { Storage } from "../integrations/storage.js";
import { requireCondition } from "../domain/errors.js";
import { getOrder } from "./commerce.js";
import { audit, bilingual, enqueue, notify, nowIso } from "./events.js";

export async function getTicket(repo: Repository, actor: Actor, id: string) {
  const ticket = await repo.get("tickets", id);
  requireCondition(
    ticket && (actor.admin || ticket.userId === actor.id),
    "NOT_FOUND",
    "Không tìm thấy Ticket.",
    404,
  );
  return ticket;
}
export async function replyTicket(
  repo: Repository,
  actor: Actor,
  id: string,
  body: string,
  fileIds: string[],
) {
  return repo.transaction(async (tx) => {
    const ticket = await getTicket(tx, actor, id);
    requireCondition(
      ticket.status === "open",
      "TICKET_CLOSED",
      "Mở lại Ticket trước khi trả lời.",
      409,
    );
    requireCondition(
      body.trim() || fileIds.length,
      "EMPTY_MESSAGE",
      "Nhập nội dung hỗ trợ.",
    );
    for (const fid of fileIds) {
      const file = await tx.get("files", fid);
      requireCondition(
        file?.purpose === "attachment" &&
          file.ownerId === actor.id &&
          file.status === "ready",
        "INVALID_ATTACHMENT",
        "File đính kèm chưa kiểm tra hoặc không thuộc tài khoản này.",
      );
    }
    const message = await tx.put("ticketMessages", {
      id: randomUUID(),
      ticketId: id,
      userId: actor.id,
      admin: actor.admin,
      body: body.trim(),
      fileIds,
      createdAt: nowIso(),
    });
    await tx.put("tickets", { ...ticket, updatedAt: nowIso() });
    await notify(
      tx,
      ticket.userId,
      bilingual("Ticket có cập nhật", "Ticket updated"),
      bilingual(ticket.subject, ticket.subject),
      `/support/${id}`,
    );
    await enqueue(
      tx,
      "ticket-updated",
      "admin-discord",
      "Ticket có cập nhật",
      `Ticket ${id}. Mở Dashboard để xem nội dung riêng tư.`,
      `/admin/support/${id}`,
    );
    return message;
  });
}
export async function openTicket(
  repo: Repository,
  actor: Actor,
  input: { orderId: string; subject: string; body: string; fileIds: string[] },
) {
  return repo.transaction(async (tx) => {
    const order = await getOrder(tx, actor, input.orderId);
    const time = nowIso();
    const ticket = await tx.put("tickets", {
      id: randomUUID(),
      userId: order.userId,
      orderId: order.id,
      subject: input.subject,
      status: "open",
      createdAt: time,
      updatedAt: time,
    });
    await replyTicket(tx, actor, ticket.id, input.body, input.fileIds);
    await audit(tx, actor.id, "ticket-opened", ticket.id);
    return ticket;
  });
}
export async function downloadAttachment(
  repo: Repository,
  storage: Storage,
  actor: Actor,
  ticketId: string,
  fileId: string,
) {
  await getTicket(repo, actor, ticketId);
  const messages = await repo.list("ticketMessages", "ticketId", ticketId);
  requireCondition(
    messages.some((m) => m.fileIds.includes(fileId)),
    "NOT_FOUND",
    "File không thuộc Ticket này.",
    404,
  );
  const file = await repo.get("files", fileId);
  requireCondition(
    file?.status === "ready",
    "FILE_UNAVAILABLE",
    "File chưa sẵn sàng.",
    409,
  );
  return {
    url: await storage.download(file.bucket, file.key, file.name),
    expiresIn: 300,
  };
}
