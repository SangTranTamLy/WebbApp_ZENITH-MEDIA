import type { Repository } from "../db/repository.js";
import type { Config } from "../config.js";

export async function dispatchOutbox(repo: Repository, config: Config) {
  const item = await repo.transaction(async (tx) => {
    const candidate = (await tx.list("outbox"))
      .filter(
        (o) =>
          (o.status === "queued" ||
            o.status === "failed" ||
            (o.status === "sending" &&
              new Date(o.leaseUntil ?? 0) < new Date())) &&
          new Date(o.nextAt) <= new Date() &&
          o.attempts < 8,
      )
      .sort((a, b) => a.nextAt.localeCompare(b.nextAt))[0];
    if (!candidate) return null;
    return tx.put("outbox", {
      ...candidate,
      status: "sending",
      attempts: candidate.attempts + 1,
      leaseUntil: new Date(Date.now() + 60_000).toISOString(),
    });
  });
  if (!item) return false;
  try {
    if (!config.demo) {
      let response: Response;
      if (item.channel === "email") {
        if (!config.resendKey || !config.emailFrom)
          throw new Error("Resend is not configured");
        response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.resendKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": item.id,
          },
          body: JSON.stringify({
            from: config.emailFrom,
            to: [item.recipient],
            subject: item.title,
            text: `${item.body}\n\n${config.origin}${item.href}`,
          }),
          signal: AbortSignal.timeout(15000),
        });
      } else {
        const webhook =
          item.channel === "admin-discord"
            ? config.discordAdmin
            : config.discordCommunity;
        if (!webhook) throw new Error("Discord channel is not configured");
        response = await fetch(webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content:
              `${item.title}\n${item.body}\n${config.origin}${item.href}`.slice(
                0,
                1900,
              ),
            allowed_mentions: { parse: [] },
          }),
          signal: AbortSignal.timeout(15000),
        });
      }
      if (!response.ok)
        throw new Error(`Provider returned HTTP ${response.status}`);
    }
    await repo.transaction(async (tx) => {
      const current = await tx.get("outbox", item.id);
      if (current?.leaseUntil === item.leaseUntil)
        await tx.put("outbox", {
          ...current,
          status: "sent",
          error: null,
          leaseUntil: null,
        });
    });
  } catch (error) {
    await repo.transaction(async (tx) => {
      const current = await tx.get("outbox", item.id);
      if (current?.leaseUntil === item.leaseUntil)
        await tx.put("outbox", {
          ...current,
          status: "failed",
          error: (error as Error).message,
          nextAt: new Date(
            Date.now() + Math.min(3600000, 2 ** item.attempts * 30000),
          ).toISOString(),
          leaseUntil: null,
        });
    });
  }
  return true;
}
