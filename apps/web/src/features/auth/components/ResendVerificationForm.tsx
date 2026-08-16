import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { StatusMessage } from "../../../components/ui/StatusMessage";
import { resendVerificationRequest } from "../auth.api";
import { resendVerificationSchema } from "../schemas/resendVerification.schema";

type FormStatus = {
  variant: "error" | "success";
  message: string;
};

type ResendVerificationFormProps = {
  initialEmail?: string;
};

export function ResendVerificationForm({
  initialEmail = "",
}: ResendVerificationFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] =
    useState<string | undefined>();
  const [status, setStatus] =
    useState<FormStatus | null>(null);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldown((current) =>
        Math.max(current - 1, 0),
      );
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting || cooldown > 0) {
      return;
    }

    const validation =
      resendVerificationSchema.safeParse({
        email,
      });

    if (!validation.success) {
      const emailIssue =
        validation.error.issues.find(
          (issue) => issue.path[0] === "email",
        );

      setEmailError(
        emailIssue?.message ?? "Email không hợp lệ.",
      );
      setStatus(null);

      return;
    }

    setEmailError(undefined);
    setStatus(null);
    setIsSubmitting(true);

    try {
      await resendVerificationRequest(
        validation.data.email,
      );

      setStatus({
        variant: "success",
        message:
          "Email xác minh đã được gửi lại thành công. Vui lòng kiểm tra hộp thư đến của bạn.",
      });

      setCooldown(60);
    } catch (error) {
      setStatus({
        variant: "error",
        message:
          error instanceof Error
            ? error.message
            : "Không thể gửi lại email xác minh.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="resend-verification-form"
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
        id="verification-email"
        label="Email đăng ký"
        error={emailError}
        required
      >
        <input
          id="verification-email"
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
        className="resend-verification-form__submit"
        type="submit"
        fullWidth
        disabled={
          isSubmitting || cooldown > 0
        }
        loading={isSubmitting}
        loadingLabel="Đang gửi..."
      >
        {cooldown > 0
          ? `Gửi lại sau ${cooldown}s`
          : "Gửi lại email xác minh"}


        <span aria-hidden="true">→</span>
      </Button>
    </form>
  );
}
