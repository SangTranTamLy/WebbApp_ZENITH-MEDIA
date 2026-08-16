import {
  Link,
  Navigate,
  useSearchParams,
} from "react-router-dom";
import { StatusMessage } from "../../components/ui/StatusMessage";
import { AuthCard } from "../../features/auth/components/AuthCard";
import { LoginForm } from "../../features/auth/components/LoginForm";
import { useAuth } from "../../features/auth/useAuth";

export function LoginPage() {
  const {
    isAuthenticated,
    isLoading,
  } = useAuth();
  const [searchParams] = useSearchParams();

  const emailVerified =
    searchParams.get("verified") === "true";

  const passwordReset =
    searchParams.get("passwordReset") ===
    "true";

  if (isLoading) {
    return (
      <div className="auth-loading-state">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to="/community"
        replace
      />
    );
  }

  return (
    <AuthCard
      id="login-title"
      eyebrow="CỘNG THÀNH VIÊN / ĐĂNG NHẬP"
      title="CHÀO MỪNG TRỞ LẠI"
      description="Đăng nhập để tiếp tục vào Zenith Community."
      footer={
        <span>
          Chưa có tài khoản?{" "}
          <Link to="/register">
            Đăng ký
          </Link>
        </span>
      }
    >
      {emailVerified ? (
        <div className="login-verification-success">
          <StatusMessage variant="success">
            Email đã được xác minh thành công.
            Bạn có thể đăng nhập vào Community.
          </StatusMessage>
        </div>
      ) : null}

      {passwordReset ? (
        <div className="login-verification-success">
          <StatusMessage variant="success">
            Mật khẩu đã được cập nhật.
            Vui lòng đăng nhập lại.
          </StatusMessage>
        </div>
      ) : null}

      <LoginForm />
    </AuthCard>
  );
}
