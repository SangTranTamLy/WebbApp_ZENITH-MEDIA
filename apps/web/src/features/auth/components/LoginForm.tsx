import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { StatusMessage } from "../../../components/ui/StatusMessage";

import {
  loginSchema,
  type LoginFormValues,
} from "../schemas/loginSchema";

import { AuthDivider } from "./AuthDivider";
import { PasswordInput } from "./PasswordInput";
import {
  SocialLoginButtons,
  type SocialProvider,
} from "./SocialLoginButtons";

type LoginErrors = Partial<
  Record<keyof LoginFormValues, string>
>;

type FormStatus = {
  variant: "error" | "success" | "info";
  message: string;
};

const initialValues: LoginFormValues = {
  identifier: "",
  password: "",
  remember: false,
};

export function LoginForm() {
  const [values, setValues] =
    useState<LoginFormValues>(initialValues);

  const [errors, setErrors] =
    useState<LoginErrors>({});

  const [status, setStatus] =
    useState<FormStatus | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  function updateValue<Key extends keyof LoginFormValues>(
    key: Key,
    value: LoginFormValues[Key],
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [key]: undefined,
    }));

    setStatus(null);
  }

  function applyValidationErrors(
    issues: {
      path: PropertyKey[];
      message: string;
    }[],
  ) {
    const nextErrors: LoginErrors = {};

    for (const issue of issues) {
      const field = issue.path[0];

      if (
        (field === "identifier" ||
          field === "password") &&
        !nextErrors[field]
      ) {
        nextErrors[field] = issue.message;
      }
    }

    setErrors(nextErrors);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const validation = loginSchema.safeParse(values);

    if (!validation.success) {
      applyValidationErrors(
        validation.error.issues,
      );

      setStatus({
        variant: "error",
        message:
          "Vui lòng kiểm tra lại thông tin đăng nhập.",
      });

      return;
    }

    setErrors({});
    setStatus(null);
    setIsSubmitting(true);

    /*
     * Chưa kết nối Supabase hoặc API thật.
     * Không tạo đăng nhập demo thành công tại đây.
     */
    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 500);
    });

    setIsSubmitting(false);

    setStatus({
      variant: "info",
      message:
        "Form hợp lệ. Chức năng đăng nhập sẽ được kết nối với hệ thống xác thực ở giai đoạn backend.",
    });
  }

  function handleSocialLogin(
    provider: SocialProvider,
  ) {
    const providerName =
      provider === "google"
        ? "Google"
        : "Discord";

    setStatus({
      variant: "info",
      message: `Đăng nhập bằng ${providerName} chưa được kết nối với nhà cung cấp xác thực.`,
    });
  }

  return (
    <form
      className="auth-form login-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {status ? (
        <div className="auth-form__status">
          <StatusMessage variant={status.variant}>
            {status.message}
          </StatusMessage>
        </div>
      ) : null}

      <div className="auth-form__stack">
        <FormField
          id="login-identifier"
          label="Email hoặc username"
          error={errors.identifier}
          required
        >
          <input
            id="login-identifier"
            className="auth-input"
            name="identifier"
            type="text"
            autoComplete="username"
            placeholder="you@example.com hoặc username"
            value={values.identifier}
            onChange={(event) =>
              updateValue(
                "identifier",
                event.target.value,
              )
            }
            aria-invalid={Boolean(errors.identifier)}
            aria-describedby={
              errors.identifier
                ? "login-identifier-error"
                : undefined
            }
            disabled={isSubmitting}
          />
        </FormField>

        <FormField
          id="login-password"
          label="Mật khẩu"
          error={errors.password}
          required
        >
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            placeholder="Tối thiểu 8 ký tự"
            value={values.password}
            onChange={(event) =>
              updateValue(
                "password",
                event.target.value,
              )
            }
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password
                ? "login-password-error"
                : undefined
            }
            disabled={isSubmitting}
          />
        </FormField>
      </div>

      <div className="auth-form__actions">
        <label className="auth-checkbox">
          <input
            className="auth-checkbox__control"
            name="remember"
            type="checkbox"
            checked={values.remember}
            onChange={(event) =>
              updateValue(
                "remember",
                event.target.checked,
              )
            }
            disabled={isSubmitting}
          />

          <span>Ghi nhớ đăng nhập</span>
        </label>

        <Link
          className="auth-inline-link"
          to="/forgot-password"
        >
          Quên mật khẩu?
        </Link>
      </div>

      <Button
        className="auth-form__submit"
        type="submit"
        fullWidth
        loading={isSubmitting}
        loadingLabel="Đang đăng nhập..."
      >
        <span>Đăng nhập</span>
        <span aria-hidden="true">→</span>
      </Button>

      <div className="auth-form__social">
        <AuthDivider>
          HOẶC TIẾP TỤC VỚI
        </AuthDivider>

        <SocialLoginButtons
          disabled={isSubmitting}
          onSelect={handleSocialLogin}
        />
      </div>
    </form>
  );
}