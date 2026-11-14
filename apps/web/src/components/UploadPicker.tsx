import { useEffect, useState, useRef } from "react";
import { Upload, RotateCw } from "lucide-react";
import type { AssetFile } from "@zenith/shared/browser";
import { useShop } from "../lib/context";
import { api, errorMessage, post } from "../lib/api";
import { Status } from "./Primitives";

interface Item {
  key: string;
  file: File;
  id?: string;
  state: "queued" | "processing" | "ready" | "pending" | "failed";
  error?: string;
  progress?: number;
}
export function UploadPicker({
  purpose = "attachment",
  onReady,
  onPendingChange,
}: {
  purpose?: "attachment" | "product" | "preview-source";
  onReady?: (ids: string[]) => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const { t, locale } = useShop();
  const [items, setItems] = useState<Item[]>([]),
    [running, setRunning] = useState(false);
  const callback = useRef(onReady);
  const activeRequest = useRef<XMLHttpRequest | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      activeRequest.current?.abort();
    };
  }, []);
  callback.current = onReady;
  const pendingCallback = useRef(onPendingChange);
  pendingCallback.current = onPendingChange;
  const pending = items.some((i) =>
    ["queued", "processing", "pending"].includes(i.state),
  );
  useEffect(() => {
    pendingCallback.current?.(pending);
  }, [pending]);
  const readyIds = JSON.stringify(
    items.filter((i) => i.state === "ready").map((i) => i.id!),
  );
  useEffect(() => {
    callback.current?.(JSON.parse(readyIds));
  }, [readyIds]);
  useEffect(() => {
    if (!items.some((i) => i.state === "pending" && i.id)) return;
    const timer = setInterval(() => {
      for (const item of items.filter((i) => i.state === "pending" && i.id))
        void api<{ status: AssetFile["status"] }>(`/uploads/${item.id}`)
          .then((result) => {
            if (result.status === "ready" || result.status === "invalid")
              setItems((current) =>
                current.map((i) =>
                  i.key === item.key
                    ? {
                        ...i,
                        state: result.status === "ready" ? "ready" : "failed",
                        error:
                          result.status === "invalid"
                            ? t(
                                "File không qua kiểm tra.",
                                "File validation failed.",
                              )
                            : undefined,
                      }
                    : i,
                ),
              );
          })
          .catch(() => {});
    }, 3000);
    return () => clearInterval(timer);
  }, [items, t]);
  async function run(queue: Item[]) {
    setRunning(true);
    for (const item of queue) {
      if (!mounted.current) break;
      setItems((current) =>
        current.map((i) =>
          i.key === item.key
            ? { ...i, state: "processing", error: undefined, progress: 0 }
            : i,
        ),
      );
      try {
        const result = await post<{ file: AssetFile; uploadUrl: string }>(
          "/uploads",
          {
            name: item.file.name,
            size: item.file.size,
            type: item.file.type || "application/octet-stream",
            purpose,
          },
        );
        if (!mounted.current) break;
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          activeRequest.current = xhr;
          xhr.open("PUT", result.uploadUrl);
          xhr.setRequestHeader(
            "Content-Type",
            item.file.type || "application/octet-stream",
          );
          xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable) return;
            const progress = Math.round((event.loaded / event.total) * 100);
            setItems((current) =>
              current.map((i) =>
                i.key === item.key && i.progress !== progress
                  ? { ...i, progress }
                  : i,
              ),
            );
          };
          xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300
              ? resolve()
              : reject(new Error(`Upload HTTP ${xhr.status}`));
          xhr.onerror = () =>
            reject(
              new Error(
                t(
                  "Kết nối upload bị gián đoạn. Hãy thử lại file này.",
                  "Upload connection interrupted. Retry this file.",
                ),
              ),
            );
          xhr.onabort = () =>
            reject(new Error(t("Đã hủy upload.", "Upload canceled.")));
          xhr.send(item.file);
        });
        activeRequest.current = null;
        await post(`/uploads/${result.file.id}/complete`);
        setItems((current) =>
          current.map((i) =>
            i.key === item.key
              ? { ...i, id: result.file.id, state: "pending" }
              : i,
          ),
        );
      } catch (e) {
        setItems((current) =>
          current.map((i) =>
            i.key === item.key
              ? { ...i, state: "failed", error: errorMessage(e, locale) }
              : i,
          ),
        );
      }
    }
    setRunning(false);
  }
  return (
    <div className="upload-picker">
      <label className="upload-zone">
        <Upload size={24} />
        <strong>{t("Chọn file để upload", "Choose files to upload")}</strong>
        <span>
          {purpose === "attachment"
            ? t(
                "Ảnh, PDF hoặc TXT, tối đa 10 MB/file",
                "Images, PDF or TXT, up to 10 MB each",
              )
            : t(
                "Dưới 5 GB/file. Upload lần lượt từng file.",
                "Under 5 GB each. Files upload one at a time.",
              )}
        </span>
        <input
          type="file"
          multiple
          disabled={running}
          accept={
            purpose === "attachment"
              ? ".jpg,.jpeg,.png,.webp,.pdf,.txt"
              : undefined
          }
          onChange={(e) => {
            const added = Array.from(e.target.files ?? []).map((file) => ({
              key: crypto.randomUUID(),
              file,
              state: "queued" as const,
            }));
            setItems((current) => [...current, ...added]);
            void run(added);
            e.target.value = "";
          }}
        />
      </label>
      {items.map((item) => (
        <div className="upload-item" key={item.key}>
          <div>
            <strong>{item.file.name}</strong>
            {item.id && <code>{item.id}</code>}
            {item.error && <p className="error-text">{item.error}</p>}
          </div>
          <div className="upload-state">
            <Status
              value={item.state === "pending" ? "validating" : item.state}
            />
            {item.state === "processing" && (
              <span
                role="progressbar"
                aria-label={item.file.name}
                aria-valuenow={item.progress ?? 0}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                {item.progress ?? 0}%
              </span>
            )}
          </div>
          {item.state === "failed" && (
            <button
              className="icon-button"
              disabled={running}
              onClick={() => void run([item])}
              aria-label={t("Thử lại file này", "Retry this file")}
            >
              <RotateCw size={17} />
            </button>
          )}
        </div>
      ))}
      {items.some((i) => i.state === "pending") && (
        <p className="small muted">
          {t(
            "Đã upload. Đang chờ worker kiểm tra file; bật worker trên máy để tiếp tục.",
            "Uploaded. Waiting for the local worker to validate files.",
          )}
        </p>
      )}
    </div>
  );
}
