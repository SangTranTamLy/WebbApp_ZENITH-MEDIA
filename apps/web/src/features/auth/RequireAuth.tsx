import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./useAuth";

export function RequireAuth() {
  const location = useLocation();
  const {
    isAuthenticated,
    isLoading,
  } = useAuth();

  if (isLoading) {
    return (
      <main className="auth-loading-state">
        Đang kiểm tra phiên đăng nhập...
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          from: {
            pathname: location.pathname,
          },
        }}
        replace
      />
    );
  }

  return <Outlet />;
}