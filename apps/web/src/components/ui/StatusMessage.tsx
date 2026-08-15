import type { ReactNode } from "react";

type StatusVariant = "error" | "success" | "info";

type StatusMessageProps = {
  children: ReactNode;
  variant?: StatusVariant;
};

const statusIcons: Record<StatusVariant, string> = {
  error: "!",
  success: "✓",
  info: "i",
};

export function StatusMessage({
  children,
  variant = "info",
}: StatusMessageProps) {
  return (
    <div
      className={`status-message status-message--${variant}`}
      role={variant === "error" ? "alert" : "status"}
    >
      <span className="status-message__icon" aria-hidden="true">
        {statusIcons[variant]}
      </span>

      <span>{children}</span>
    </div>
  );
}