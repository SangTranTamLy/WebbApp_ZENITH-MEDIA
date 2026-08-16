import {
  useState,
  type FormEvent,
} from "react";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { StatusMessage } from "../../../components/ui/StatusMessage";
import { forgotPasswordRequest } from "../auth.api";
import { forgotPasswordSchema } from "../schemas/forgotPassword.schema";

type FormStatus = {
  variant: "error" | "success";
  message: string;
};

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] =
    useState<string | undefined>();
  const [status, setStatus] =
    useState<FormStatus | null>(null);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validation =
      forgotPasswordSchema.safeParse({
        email,
      });


    if (!validation.success) {
      setEmailError(
        validation.error.issues[0]?.message ??
          "Email không hợp lệ.",
      );


      return;
    }


    setEmailError(undefined);
    setStatus(null);
    setIsSubmitting(true);


    try {
      await forgotPasswordRequest(
        validation.data.email,
      );


      setStatus({
        variant: "success",
        message:
          "Nếu email thuộc một tài khoản hợp lệ, hướng dẫn đặt lại mật khẩu đã được gửi.",
      });
    } catch (error) {
      setStatus({
        variant: "error",
        message:
          error instanceof Error
            ? error.message
            : "Không thể gửi yêu cầu đặt lại mật khẩu.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <form
      className="auth-form forgot-password-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {status ? (
        <div className="auth-form__status">
          <StatusMessage
            variant={status.variant}
          >
            {status.message}
          </StatusMessage>
        </div>
      ) : null}


      <FormField
        id="forgot-password-email"
        label="Email tài khoản"
        error={emailError}
        required
      >
        <input
          id="forgot-password-email"
          className="auth-input"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="ban@example.com"
          value={email}
          disabled={isSubmitting}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError(undefined);
            setStatus(null);
          }}
        />
      </FormField>


      <Button
        className="auth-form__submit"
        type="submit"
        fullWidth
        loading={isSubmitting}
        loadingLabel="Đang gửi..."
      >
        Gửi xác nhận
        <span aria-hidden="true">→</span>
      </Button>
    </form>
  );
}
