import { useEffect, useRef, type ReactNode } from "react";
import { ArrowRight, LoaderCircle, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useShop } from "../lib/context";

export function Loading() {
  const { t } = useShop();
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={22} />
      {t("Đang tải…", "Loading…")}
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  const { t } = useShop();
  return (
    <div className="error-box" role="alert">
      <p>{message}</p>
      {retry && (
        <button className="button secondary" onClick={retry}>
          {t("Thử lại", "Try again")}
        </button>
      )}
    </div>
  );
}
export function Empty({
  title,
  body,
  href,
  label,
}: {
  title: string;
  body: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{body}</p>
      {href && (
        <Link className="button" to={href}>
          {label}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
  drawer = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  drawer?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useShop();
  useEffect(() => {
    const element = ref.current;
    if (open && !element?.open) element?.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={drawer ? "drawer" : "modal"}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={t("Đóng", "Close")}
        >
          <X size={21} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function PageHead({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function Status({ value }: { value: string }) {
  const { t } = useShop();
  const labels: Record<string, [string, string]> = {
    pending: ["Chờ thanh toán", "Awaiting payment"],
    reported: ["Chờ Admin xác nhận", "Awaiting confirmation"],
    paid: ["Hoàn tất", "Complete"],
    expired: ["Hết thời hạn", "Expired"],
    support: ["Cần hỗ trợ", "Needs attention"],
    active: ["Đang bán", "Published"],
    draft: ["Bản nháp", "Draft"],
    hidden: ["Tạm ẩn", "Hidden"],
    retired: ["Ngừng bán", "Retired"],
    queued: ["Đang chờ", "Queued"],
    validating: ["Chờ kiểm tra file", "Awaiting file validation"],
    processing: ["Đang xử lý", "Processing"],
    done: ["Hoàn tất", "Done"],
    failed: ["Lỗi", "Failed"],
    ready: ["Sẵn sàng", "Ready"],
    missing: ["Thiếu file", "Missing"],
    invalid: ["Không hợp lệ", "Invalid"],
    open: ["Đang mở", "Open"],
    closed: ["Đã đóng", "Closed"],
    sent: ["Đã gửi", "Sent"],
  };
  return (
    <span className={`status status-${value}`}>
      {labels[value] ? t(...labels[value]) : value}
    </span>
  );
}
