import { Link } from "react-router-dom";


import {
  AuthCard,
  ResetPasswordForm,
} from "../../features/auth/components";


export function ResetPasswordPage() {
  return (
    <AuthCard
      id="reset-password-title"
      eyebrow="AUTH / MẬT KHẨU MỚI"
      title="ĐẶT LẠI MẬT KHẨU"
      description="Tạo mật khẩu mới cho tài khoản Zenith Community."
      footer={
        <Link to="/login">
          Quay lại đăng nhập
        </Link>
      }
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
