import {
  Outlet,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../features/auth/useAuth";
import { CommunityFooter } from "../../features/community/components/CommunityFooter";
import { CommunityHeader } from "../../features/community/components/CommunityHeader";

export function CommunityLayout() {
  const navigate = useNavigate();

  const {
    session,
    signOut,
  } = useAuth();

  async function handleLogout() {
    await signOut();

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <div className="community-layout">
      <CommunityHeader
        displayName={
          session?.profile.displayName ??
          "Zenith Member"
        }
        username={
          session?.profile.username ??
          "member"
        }
        avatarUrl={
          session?.profile.avatarUrl
        }
        unreadMessages={3}
        onLogout={handleLogout}
      />

      <main className="community-content">
        <Outlet />
      </main>

      <CommunityFooter />
    </div>
  );
}