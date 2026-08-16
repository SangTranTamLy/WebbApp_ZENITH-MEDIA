import {
  Link,
  Navigate,
} from "react-router-dom";
import { AuthCard } from "../../features/auth/components/AuthCard";
import { RegisterForm } from "../../features/auth/components/RegisterForm";
import { useAuth } from "../../features/auth/useAuth";


export function RegisterPage() {
  const {
    isAuthenticated,
    isLoading,
  } = useAuth();


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
      id="register-title"
      eyebrow="CỘNG THÀNH VIÊN / ĐĂNG KÝ"
      title="TẠO TÀI KHOẢN"
      description="Tham gia cộng đồng để đăng bài, chia sẻ code và kết nối."
      footer={
        <span>
          Đã có tài khoản?{" "}
          <Link to="/login">
            Đăng nhập
          </Link>
        </span>
      }
    >
      <RegisterForm />
    </AuthCard>
  );
}
