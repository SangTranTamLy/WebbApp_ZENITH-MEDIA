import type { ReactNode } from "react";
import { Link, Outlet } from "react-router-dom";

type AuthLayoutProps = {
  children?: ReactNode;
};

export function AuthLayout({
  children,
}: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      <aside
        className="auth-layout__artwork"
        aria-label="Zenith Community"
      >
        <div
          className="auth-layout__ambient"
          aria-hidden="true"
        />

        <div
          className="auth-layout__beam"
          aria-hidden="true"
        />

        <Link
          className="auth-brand"
          to="/"
          aria-label="Trở về Zenith Media"
        >
          <span
            className="auth-brand__mark"
            aria-hidden="true"
          />

          <strong>ZENITH</strong>
          <span>/ MEDIA</span>
        </Link>

        <div className="auth-artwork" aria-hidden="true">
          <span className="auth-artwork__circle" />

          <span className="auth-artwork__orbit auth-artwork__orbit--outer" />
          <span className="auth-artwork__orbit auth-artwork__orbit--middle" />
          <span className="auth-artwork__orbit auth-artwork__orbit--inner" />

          <span className="auth-artwork__core" />

          <span className="auth-artwork__label auth-artwork__label--top">
            IDEAS / CODE / PEOPLE
          </span>

          <span className="auth-artwork__label auth-artwork__label--bottom">
            BUILD TOGETHER
          </span>
        </div>

        <div className="auth-layout__intro">
          <p className="auth-layout__kicker">
            ZENITH COMMUNITY / 2026
          </p>

          <h1>
            <span>KHÔNG CHỈ</span>
            <span>ĐĂNG NHẬP.</span>
            <em>HÃY KẾT NỐI.</em>
          </h1>

          <p className="auth-layout__description">
            Chia sẻ kiến thức, đăng bài và kết nối cùng
            những người đang xây dựng sản phẩm số.
          </p>
        </div>
      </aside>

      <main className="auth-layout__main">
        <Link
          className="auth-layout__portfolio-link"
          to="/"
        >
          <span aria-hidden="true">←</span>
          Về portfolio
        </Link>

        <div className="auth-layout__content">
          {children ?? <Outlet />}
        </div>
      </main>
    </div>
  );
}