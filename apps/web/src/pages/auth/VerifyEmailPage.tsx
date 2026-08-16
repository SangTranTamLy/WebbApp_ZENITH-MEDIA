import { Link, useLocation } from "react-router-dom";


import {
  AuthCard,
  ResendVerificationForm,
} from "../../features/auth/components";


type VerifyEmailLocationState = {
  email?: string;
};


export function VerifyEmailPage() {
  const location = useLocation();


  const state =
    location.state as
      | VerifyEmailLocationState
      | null;


  const initialEmail =
    typeof state?.email === "string"
      ? state.email
      : "";


  return (
    <AuthCard
      id="verify-email-title"
      eyebrow="AUTH / XÁC MINH EMAIL"
      title="KIỂM TRA EMAIL CỦA BẠN"
      description="Bạn cần xác minh địa chỉ email trước khi truy cập Zenith Community."
      footer={
        <>
          Đã xác minh email?{" "}


          <Link to="/login">
            Quay lại đăng nhập
          </Link>
        </>
      }
    >
      <div className="verify-email-notice">
        <span aria-hidden="true">✦</span>


        <p>
          Kiểm tra cả thư mục Spam hoặc Thư rác.
          Liên kết xác minh có thể mất vài phút
          để được gửi đến.
        </p>
      </div>


      <ResendVerificationForm
        initialEmail={initialEmail}
      />
    </AuthCard>
  );
}
