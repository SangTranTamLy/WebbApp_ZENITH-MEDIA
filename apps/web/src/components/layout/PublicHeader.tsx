import { useState } from "react";
import { Link } from "react-router-dom";

const navigationItems = [
  {
    label: "Dự án",
    href: "#development",
  },
  {
    label: "Giới thiệu",
    href: "#about",
  },
  {
    label: "Snippets",
    href: "/snippets",
  },
  {
    label: "Dịch vụ",
    href: "#services",
  },
  {
    label: "Liên hệ",
    href: "#contact",
  },
];

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function toggleMenu() {
    setIsMenuOpen((currentState) => !currentState);
  }

  return (
    <header className="public-header">
      <Link
        className="public-brand"
        to="/"
        aria-label="Trở về trang chủ Zenith"
        onClick={closeMenu}
      >
        <span
          className="public-brand-mark"
          aria-hidden="true"
        />

        <strong>ZENITH</strong>
        <span>/ MEDIA</span>
      </Link>

      <nav
        id="public-navigation"
        className={`public-navigation ${
          isMenuOpen ? "public-navigation--open" : ""
        }`}
        aria-label="Điều hướng chính"
      >
        {navigationItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={closeMenu}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="public-header-actions">
        <Link
          className="portfolio-login"
          to="/blog"
          onClick={closeMenu}
        >
          BLOG
        </Link>

        <button
          className={`mobile-menu-button ${
            isMenuOpen ? "mobile-menu-button--open" : ""
          }`}
          type="button"
          aria-label={
            isMenuOpen
              ? "Đóng menu điều hướng"
              : "Mở menu điều hướng"
          }
          aria-expanded={isMenuOpen}
          aria-controls="public-navigation"
          onClick={toggleMenu}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}