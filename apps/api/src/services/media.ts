import { randomUUID } from "node:crypto";
import type { Actor, AssetFile, PreviewJob } from "@zenith/shared";
import type { Repository } from "../db/repository.js";
import type { Storage } from "../integrations/storage.js";
import { requireCondition, ShopError } from "../domain/errors.js";
import { audit, bilingual, enqueue, notify, nowIso } from "./events.js";

const attachmentTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "text/plain",
  "application/pdf",
]);
export async function beginUpload(
  repo: Repository,
  storage: Storage,
  actor: Actor,
  input: {
    name: string;
    type: string;
    size: number;
    purpose: AssetFile["purpose"];
  },
) {
  requireCondition(
    actor.admin || input.purpose === "attachment",
    "FORBIDDEN",
    "Chỉ Admin được upload sản phẩm.",
    403,
  );
  requireCondition(
    input.size > 0 &&
      input.size <
        (input.purpose === "attachment" ? 10 * 1024 * 1024 : 5_000_000_000),
    "FILE_TOO_LARGE",
    "File vượt giới hạn upload thông thường.",
  );
  requireCondition(
    !/[\/\\\u0000-\u001f]/.test(input.name) && input.name.length <= 180,
    "INVALID_FILENAME",
    "Tên file không hợp lệ.",
  );
  if (input.purpose === "attachment")
    requireCondition(
      attachmentTypes.has(input.type),
      "INVALID_ATTACHMENT",
      "Chỉ hỗ trợ ảnh JPG/PNG/WebP, PDF và TXT.",
    );
  const id = randomUUID();
  const file: AssetFile = {
    id,
    name: input.name,
    key: `staging/${id}`,
    bucket: "products",
    type: input.type,
    size: input.size,
    sha256: null,
    status: "pending",
    purpose: input.purpose,
    ownerId: input.purpose === "attachment" ? actor.id : null,
    createdAt: nowIso(),
    zip: input.name.toLowerCase().endsWith(".zip")
      ? {
          status: "pending",
          errors: [],
          warnings: [],
          entries: [],
          acknowledgedBy: null,
        }
      : null,
  };
  const uploadUrl = await storage.upload(file.bucket, file.key, file.type);
  await repo.transaction((tx) => tx.put("files", file));
  return { file, uploadUrl };
}
export async function finalizeUpload(
  repo: Repository,
  storage: Storage,
  actor: Actor,
  id: string,
) {
  const file = await repo.get("files", id);
  requireCondition(
    file && (actor.admin || file.ownerId === actor.id),
    "NOT_FOUND",
    "Không tìm thấy upload.",
    404,
  );
  if (!file.key.startsWith("staging/")) return file;
  const head = await storage.head(file.bucket, file.key);
  requireCondition(
    head.size === file.size && head.type === file.type,
    "UPLOAD_MISMATCH",
    "Dung lượng hoặc loại file không khớp. Hãy upload lại.",
  );
  const key = `originals/${id}/${randomUUID()}/${file.name}`;
  // PUT signatures remain usable after completion; customers only receive this new immutable copy.
  await storage.copy(file.bucket, file.key, key);
  return repo.transaction(async (tx) => {
    const current = await tx.get("files", id);
    requireCondition(
      current?.key === file.key && current.status !== "deleting",
      "UPLOAD_CONFLICT",
      "Upload đã hoàn tất ở một yêu cầu khác.",
      409,
    );
    const updated = await tx.put("files", { ...file, key });
    await createJob(tx, id, file.zip ? "zip" : "verify");
    await audit(tx, actor.id, "upload-finalized", id);
    return updated;
  });
}
export async function createJob(
  repo: Repository,
  fileId: string,
  type: PreviewJob["type"],
  start = 0,
  duration = 10,
) {
  const file = await repo.get("files", fileId);
  requireCondition(
    file && file.status !== "deleting" && !file.key.startsWith("staging/"),
    "SOURCE_NOT_READY",
    "Upload file trước khi tạo tác vụ.",
  );
  if (type === "preview")
    requireCondition(
      file.status === "ready" && file.type.startsWith("video/"),
      "INVALID_PREVIEW_SOURCE",
      "Cần file video đã kiểm tra.",
    );
  const settings = await repo.get("settings", "store");
  const job: PreviewJob = {
    id: randomUUID(),
    fileId,
    type,
    status: "queued",
    start,
    duration,
    watermark: settings?.watermark ?? "ZENITH MEDIA",
    outputKey: "",
    outputUrl: null,
    attempts: 0,
    leaseToken: null,
    leaseUntil: null,
    error: null,
    createdAt: nowIso(),
  };
  await repo.put("jobs", job);
  return job;
}
export async function claimJob(repo: Repository, storage: Storage) {
  const job = await repo.transaction(async (tx) => {
    const candidate = (await tx.list("jobs"))
      .filter(
        (j) =>
          j.status === "queued" ||
          (j.status === "processing" &&
            new Date(j.leaseUntil ?? 0) < new Date()),
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    if (!candidate) return null;
    const token = randomUUID();
    return tx.put("jobs", {
      ...candidate,
      status: "processing",
      attempts: candidate.attempts + 1,
      leaseToken: token,
      leaseUntil: new Date(Date.now() + 120_000).toISOString(),
      outputKey:
        candidate.type === "preview"
          ? `previews/${candidate.id}/${token}.mp4`
          : "",
      error: null,
    });
  });
  if (!job) return null;
  const file = (await repo.get("files", job.fileId))!;
  return {
    job,
    file: { id: file.id, name: file.name, type: file.type, size: file.size },
    sourceUrl: await storage.download(file.bucket, file.key),
    uploadUrl:
      job.type === "preview"
        ? await storage.upload("previews", job.outputKey, "video/mp4")
        : null,
  };
}
export async function heartbeat(repo: Repository, id: string, token: string) {
  return repo.transaction(async (tx) => {
    const job = await tx.get("jobs", id);
    requireCondition(
      job?.status === "processing" &&
        job.leaseToken === token &&
        new Date(job.leaseUntil!) > new Date(),
      "LEASE_LOST",
      "Tác vụ đã được nhận bởi worker khác.",
      409,
    );
    return tx.put("jobs", {
      ...job,
      leaseUntil: new Date(Date.now() + 120_000).toISOString(),
    });
  });
}
export async function finishJob(
  repo: Repository,
  storage: Storage,
  id: string,
  token: string,
  result: {
    sha256: string;
    error?: string;
    zip?: AssetFile["zip"];
    detectedType?: string;
  },
) {
  const current = await repo.get("jobs", id);
  requireCondition(
    current?.leaseToken === token && current.status === "processing",
    "LEASE_LOST",
    "Worker lease không hợp lệ.",
    409,
  );
  if (!result.error && current.type === "preview") {
    const output = await storage.head("previews", current.outputKey);
    requireCondition(
      output.size > 0 && output.type === "video/mp4",
      "OUTPUT_INVALID",
      "Preview chưa upload hoàn tất.",
    );
  }
  return repo.transaction(async (tx) => {
    const job = await tx.get("jobs", id);
    requireCondition(
      job?.status === "processing" &&
        job.leaseToken === token &&
        new Date(job.leaseUntil!) > new Date(),
      "LEASE_LOST",
      "Worker lease đã hết hạn.",
      409,
    );
    const file = (await tx.get("files", job.fileId))!;
    let error = result.error;
    if (!error && file.sha256 && file.sha256 !== result.sha256)
      error = "Source checksum differs from the verified original";
    if (
      !error &&
      file.purpose === "attachment" &&
      result.detectedType !== file.type
    )
      error = "Attachment content does not match its declared MIME type";
    if (
      !error &&
      job.type === "zip" &&
      (!result.zip || result.zip.status !== "valid")
    )
      error = "ZIP validation failed";
    if (job.type !== "preview")
      await tx.put("files", {
        ...file,
        status: error ? (file.sha256 ? "missing" : "invalid") : "ready",
        sha256: file.sha256 ?? (error ? null : result.sha256),
        zip: result.zip ?? file.zip,
      });
    const updated = await tx.put("jobs", {
      ...job,
      status: error ? "failed" : "done",
      error: error ?? null,
      outputUrl:
        !error && job.type === "preview"
          ? storage.publicUrl(job.outputKey)
          : null,
      leaseToken: null,
      leaseUntil: null,
    });
    if (error)
      await enqueue(
        tx,
        "worker-failed",
        "admin-discord",
        "Tác vụ xử lý file thất bại",
        `Tác vụ ${job.id}: ${error.slice(0, 200)}`,
        "/admin/uploads",
      );
    return updated;
  });
}
export async function downloadFile(
  repo: Repository,
  storage: Storage,
  actor: Actor,
  fileId: string,
) {
  const owned = await repo.list("entitlements", "userId", actor.id);
  const entitlement = owned.find((e) => e.line.fileIds.includes(fileId));
  requireCondition(
    entitlement,
    "NOT_FOUND",
    "Bạn không có quyền tải file này.",
    404,
  );
  const file = await repo.get("files", fileId);
  requireCondition(
    file?.status === "ready",
    "FILE_UNAVAILABLE",
    "File đang được khôi phục. Admin đã được thông báo.",
    409,
  );
  try {
    await storage.head(file.bucket, file.key);
  } catch (error) {
    if (error instanceof ShopError && error.code === "OBJECT_MISSING")
      await flagMissing(repo, file);
    throw error;
  }
  const url = await storage.download(file.bucket, file.key, file.name);
  await repo.transaction(async (tx) => {
    const recent = (await tx.list("downloads", "userId", actor.id)).filter(
      (d) => Date.now() - new Date(d.createdAt).getTime() < 60_000,
    );
    requireCondition(
      recent.length < 30,
      "DOWNLOAD_RATE_LIMIT",
      "Quá nhiều yêu cầu tải. Vui lòng đợi một phút.",
      429,
    );
    await tx.put("downloads", {
      id: randomUUID(),
      userId: actor.id,
      fileId,
      entitlementId: entitlement.id,
      name: file.name,
      createdAt: nowIso(),
    });
  });
  return { url, expiresIn: 300 };
}
export async function flagMissing(repo: Repository, file: AssetFile) {
  await repo.transaction(async (tx) => {
    const current = await tx.get("files", file.id);
    if (current?.status === "missing") return;
    await tx.put("files", { ...file, status: "missing" });
    await enqueue(
      tx,
      "file-missing",
      "admin-discord",
      "File cần được khôi phục",
      `File ${file.id} không thể truy cập.`,
      "/admin/uploads",
    );
  });
}
export async function restoreFile(
  repo: Repository,
  storage: Storage,
  actor: Actor,
  id: string,
  replacementId: string,
) {
  const [file, replacement] = await Promise.all([
    repo.get("files", id),
    repo.get("files", replacementId),
  ]);
  requireCondition(
    file?.status === "missing" &&
      file.sha256 &&
      replacement?.status === "ready" &&
      replacement.sha256 === file.sha256 &&
      replacement.size === file.size,
    "RESTORE_MISMATCH",
    "Bản khôi phục phải có checksum và dung lượng đúng với file đã bán.",
    409,
  );
  await storage.head(replacement.bucket, replacement.key);
  await storage.copy(file.bucket, replacement.key, file.key);
  return repo.transaction(async (tx) => {
    await tx.put("files", { ...file, status: "ready" });
    for (const userId of new Set(
      (await tx.list("entitlements"))
        .filter((e) => e.line.fileIds.includes(id))
        .map((e) => e.userId),
    ))
      await notify(
        tx,
        userId,
        bilingual("File đã được khôi phục", "File restored"),
        bilingual(file.name, file.name),
        "/library",
      );
    await audit(tx, actor.id, "file-restored", id, { replacementId });
    return { ok: true };
  });
}
export async function deleteUnusedFile(
  repo: Repository,
  storage: Storage,
  actor: Actor,
  id: string,
) {
  // Mark unavailable while locked, then delete. A failed network delete remains visible for retry.
  const file = await repo.transaction(async (tx) => {
    const file = await tx.get("files", id);
    requireCondition(file, "NOT_FOUND", "Không tìm thấy file.", 404);
    const [offers, orders, entitlements, jobs, messages] = await Promise.all([
      tx.list("offers"),
      tx.list("orders"),
      tx.list("entitlements"),
      tx.list("jobs"),
      tx.list("ticketMessages"),
    ]);
    requireCondition(
      !offers.some(
        (o) =>
          o.fileIds.includes(id) ||
          o.readmeFileId === id ||
          o.items.some((i) => i.fileIds.includes(id)),
      ) &&
        !orders.some((o) => o.lines.some((l) => l.fileIds.includes(id))) &&
        !entitlements.some((e) => e.line.fileIds.includes(id)) &&
        !jobs.some((j) => j.fileId === id) &&
        !messages.some((m) => m.fileIds.includes(id)),
      "FILE_REFERENCED",
      "File còn liên quan đến sản phẩm, đơn hàng, quyền tải, Ticket hoặc tác vụ.",
      409,
    );
    await tx.put("files", { ...file, status: "deleting" });
    await audit(tx, actor.id, "file-delete-requested", id);
    return file;
  });
  await storage.remove(file.bucket, file.key);
  await repo.transaction(async (tx) => {
    await tx.remove("files", id);
    await audit(tx, actor.id, "file-deleted", id);
  });
}
