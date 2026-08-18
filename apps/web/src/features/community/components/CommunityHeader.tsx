import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Link,
  NavLink,
} from "react-router-dom";

type CommunityHeaderProps = {
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  unreadMessages?: number;
  onLogout: () => void | Promise<void>;
};

function getInitials(displayName: string) {
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

export function CommunityHeader({
  displayName,
  username,
  avatarUrl,
  unreadMessages = 0,
  onLogout,
}: CommunityHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement>(null);

  const initials =
    getInitials(displayName) || "ST";

  useEffect(() => {
    function handlePointerDown(
      event: PointerEvent,
    ) {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node,
        )
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await onLogout();
      setIsMenuOpen(false);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="community-header">
      <Link
        className="community-brand"
        to="/"
        aria-label="Quay về Zenith Portfolio"
      >
        <span
          className="community-brand__mark"
          aria-hidden="true"
        >
          <i />
          <i />
          <i />
        </span>

        <strong>ZENITH</strong>
        <span>/ COMMUNITY</span>
      </Link>

      <NavLink
        className={({ isActive }) =>
          [
            "community-header__icon-button",
            "community-header__home",
            isActive
              ? "community-header__icon-button--active"
              : "",
          ]
            .filter(Boolean)
            .join(" ")
        }
        to="/community"
        end
        aria-label="Trang chủ Community"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M3 10.8 12 3l9 7.8v9.7h-6v-6H9v6H3Z" />
        </svg>
      </NavLink>

      <div className="community-header__actions">
        <button
          className="community-header__icon-button community-header__message"
          type="button"
          aria-label={`Tin nhắn, ${unreadMessages} tin chưa đọc`}
          title="Messenger sẽ được phát triển sau"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.3 9.3 0 0 1-3.7-.9L3 20.5l1.5-4.6A8.1 8.1 0 0 1 3 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 9 8.4Z" />
            <path d="M8 12h.01M12 12h.01M16 12h.01" />
          </svg>

          {unreadMessages > 0 ? (
            <b>
              {unreadMessages > 99
                ? "99+"
                : unreadMessages}
            </b>
          ) : null}
        </button>

        <div
          className="community-account"
          ref={menuRef}
        >
          <button
            className="community-account__trigger"
            type="button"
            aria-label="Mở menu tài khoản"
            aria-expanded={isMenuOpen}
            onClick={() =>
              setIsMenuOpen((current) => !current)
            }
          >
            <span className="community-account__avatar">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                />
              ) : (
                initials
              )}
            </span>

            <i
              className="community-account__online"
              aria-hidden="true"
            />

            <svg
              viewBox="0 0 12 12"
              aria-hidden="true"
            >
              <path d="m2 4 4 4 4-4" />
            </svg>
          </button>

          {isMenuOpen ? (
            <div className="community-account__menu">
              <div className="community-account__identity">
                <strong>{displayName}</strong>
                <span>@{username}</span>
              </div>

              <button type="button">
                Hồ sơ cá nhân
              </button>

              <button type="button">
                Cài đặt tài khoản
              </button>

              <button
                className="community-account__logout"
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
              >
                {isLoggingOut
                  ? "Đang đăng xuất..."
                  : "Đăng xuất"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}