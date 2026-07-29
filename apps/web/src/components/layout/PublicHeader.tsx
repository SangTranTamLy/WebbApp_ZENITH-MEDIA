import { Link } from "react-router-dom";

export function PublicHeader() {
  return (
    <header className="public-header">
      <Link className="brand" to="/" aria-label="Zenith home">
        <span className="brand-mark" aria-hidden="true" />

        <strong>ZENITH</strong>
        <span>/ MEDIA</span>
      </Link>

      <nav className="public-navigation" aria-label="Main navigation">
        <a href="#about">About</a>
        <a href="#development">Development</a>
        <a href="#motion">Motion</a>
        <a href="#platform">Platform</a>
      </nav>

      <Link className="header-login" to="/login">
        LOGIN
      </Link>
    </header>
  );
}