import type { ReactNode } from "react";

type AuthDividerProps = {
  children?: ReactNode;
};

export function AuthDivider({
  children = "HOẶC TIẾP TỤC VỚI",
}: AuthDividerProps) {
  return (
    <div className="auth-divider" aria-hidden="true">
      <span className="auth-divider__line" />
      <span className="auth-divider__label">
        {children}
      </span>
      <span className="auth-divider__line" />
    </div>
  );
}