import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
  loadingLabel?: string;
};

export function Button({
  children,
  variant = "primary",
  fullWidth = false,
  loading = false,
  loadingLabel = "Đang xử lý...",
  className = "",
  disabled,
  ...buttonProps
}: ButtonProps) {
  const buttonClassName = [
    "ui-button",
    `ui-button--${variant}`,
    fullWidth ? "ui-button--full-width" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...buttonProps}
      className={buttonClassName}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? (
        <>
          <span className="ui-button__spinner" aria-hidden="true" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}