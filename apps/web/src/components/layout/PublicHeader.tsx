import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isEditor = location.pathname.startsWith("/editor");
  const isLanding = location.pathname === "/";

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function toggleMenu() {
    setIsMenuOpen((currentState) => !currentState);
  }

  const codeNav = [
    { label: "About", href: "#about" },
    { label: "Projects", href: "#development" },
    { label: "Contact", href: "#contact" },
  ];

  const editorNav = [
    { label: "Giới Thiệu", href: "#about" },
    { label: "Công Nghệ", href: "#plugins" },
    { label: "Dự Án", href: "#works" },
    { label: "Liên Hệ", href: "#contact" },
  ];

  const navItems = isEditor ? editorNav : codeNav;

  if (isLanding) {
    return null; // Don't show header on the split-screen landing page
  }

  return (
    <header className={`public-header ${isEditor ? "header-editor" : ""}`}>
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
        <span>/ {isEditor ? "EDITOR" : "CODE"}</span>
      </Link>

      <nav
        id="public-navigation"
        className={`public-navigation ${isMenuOpen ? "public-navigation--open" : ""}`}
        aria-label="Điều hướng chính"
      >
        {navItems.map((item) => (
          <a key={item.href} href={item.href} onClick={closeMenu}>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="public-header-actions">
        <Link
          className="portfolio-cta switch-btn"
          to={isEditor ? "/code" : "/editor"}
          onClick={closeMenu}
        >
          {isEditor ? "SWITCH TO CODE ↗" : "SWITCH TO EDITOR ↗"}
        </Link>

        <button
          className={`mobile-menu-button ${isMenuOpen ? "mobile-menu-button--open" : ""}`}
          type="button"
          aria-label={isMenuOpen ? "Đóng menu" : "Mở menu"}
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
