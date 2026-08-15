import { Link } from "react-router-dom";

import {
  AuthCard,
  LoginForm,
} from "../../features/auth/components";

export function LoginPage() {
  return (
    <AuthCard
      id="login"
      eyebrow="CỘNG THÀNH VIÊN / ĐĂNG NHẬP"
      title="Chào mừng trở lại"
      description="Đăng nhập để tiếp tục vào Zenith Community."
      footer={
        <p>
          Chưa có tài khoản?{" "}
          <Link to="/register">
            Đăng ký
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthCard>
  );
}