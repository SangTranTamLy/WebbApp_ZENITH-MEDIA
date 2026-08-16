import { Link } from "react-router-dom";


import {
  AuthCard,
  ForgotPasswordForm,
} from "../../features/auth/components";


export function ForgotPasswordPage() {
  return (
    <AuthCard
      id="forgot-password-title"
      eyebrow="AUTH / KHÔI PHỤC"
      title="QUÊN MẬT KHẨU?"
      description="Nhập email tài khoản để nhận hướng dẫn đặt lại mật khẩu."
      footer={
        <>
          Đã nhớ mật khẩu?{" "}


          <Link to="/login">
            Quay lại đăng nhập
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
