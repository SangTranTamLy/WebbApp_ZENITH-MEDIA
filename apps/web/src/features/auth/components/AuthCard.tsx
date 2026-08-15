import type { ReactNode } from "react";

type AuthCardProps = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({
  id,
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthCardProps) {
  const titleId = `${id}-title`;

  return (
    <section
      className="auth-card"
      aria-labelledby={titleId}
    >
      <header className="auth-card__header">
        <p className="auth-card__eyebrow">{eyebrow}</p>

        <h2 id={titleId}>{title}</h2>

        <p className="auth-card__description">
          {description}
        </p>
      </header>

      <div className="auth-card__body">
        {children}
      </div>

      {footer ? (
        <footer className="auth-card__footer">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}