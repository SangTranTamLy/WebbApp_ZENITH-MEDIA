import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";

export function CommunityPage() {
  const navigate = useNavigate();
  const {
    profile,
    signOut,
  } = useAuth();

  async function handleLogout() {
    await signOut(false);
    navigate("/login", {
      replace: true,
    });
  }

  return (
    <main>
      <h1>Zenith Community</h1>

      <p>
        Xin chào{" "}
        {profile?.displayName ??
          profile?.username}.
      </p>

      <button
        type="button"
        onClick={handleLogout}
      >
        Đăng xuất
      </button>
    </main>
  );
}