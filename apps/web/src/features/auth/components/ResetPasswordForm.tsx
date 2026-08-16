import {
  useEffect,
  useState,
  type FormEvent,
} from "react";
import {
  useNavigate,
} from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { StatusMessage } from "../../../components/ui/StatusMessage";
import { PasswordInput } from "./PasswordInput";
import { recoverySupabase } from "../services/recoverySupabase";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "../schemas/resetPassword.schema";

type ResetPasswordErrors = Partial<
  Record<keyof ResetPasswordFormValues, string>
>;

export function ResetPasswordForm() {
  const navigate = useNavigate();

  const [values, setValues] =
    useState<ResetPasswordFormValues>({
      password: "",
      confirmPassword: "",
    });
  const [errors, setErrors] =
    useState<ResetPasswordErrors>({});
  const [status, setStatus] =
    useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [isChecking, setIsChecking] =
    useState(true);
  const [sessionReady, setSessionReady] =
    useState(false);

  useEffect(() => {
    let isActive = true;

    async function prepareRecoverySession() {
      try {
        const { data: currentSessionData } =
          await recoverySupabase.auth.getSession();

        if (!isActive) {
          return;
        }

        if (currentSessionData.session) {
          setSessionReady(true);
          setIsChecking(false);

          return;
        }

        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, ""),
        );
        const accessToken =
          hashParams.get("access_token");
        const refreshToken =
          hashParams.get("refresh_token");

        if (!accessToken || !refreshToken) {
          setStatus(
            "Liên kết đã hết hạn hoặc không hợp lệ.",
          );
          setIsChecking(false);

          return;
        }

        const { data, error } =
          await recoverySupabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

        if (!isActive) {
          return;
        }

        if (error || !data.session) {
          setStatus(
            error?.message ??
              "Liên kết đã hết hạn hoặc không hợp lệ.",
          );
          setIsChecking(false);

          return;
        }

        setSessionReady(true);
        setIsChecking(false);

        window.history.replaceState(
          {},
          document.title,
          `${window.location.pathname}${window.location.search}`,
        );
      } catch (error) {
        if (!isActive) {
          return;
        }

        setStatus(
          error instanceof Error
            ? error.message
            : "Không thể xác thực liên kết đặt lại mật khẩu.",
        );
        setIsChecking(false);
      }
    }

    void prepareRecoverySession();

    return () => {
      isActive = false;
    };
  }, []);

  function updateValue<
    Key extends keyof ResetPasswordFormValues,
  >(
    key: Key,
    value: ResetPasswordFormValues[Key],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
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
    const nextErrors: ResetPasswordErrors = {};

    for (const issue of issues) {
      const field = issue.path[0];

      if (
        (field === "password" ||
          field === "confirmPassword") &&
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

    if (isSubmitting || !sessionReady) {
      return;
    }

    const validation =
      resetPasswordSchema.safeParse(values);

    if (!validation.success) {
      applyValidationErrors(
        validation.error.issues,
      );
      setStatus(null);

      return;
    }

    setErrors({});
    setStatus(null);
    setIsSubmitting(true);

    try {
      const { error } =
        await recoverySupabase.auth.updateUser({
          password: validation.data.password,
        });

      if (error) {
        throw error;
      }

      navigate("/login?passwordReset=true", {
        replace: true,
      });
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật mật khẩu.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isChecking) {
    return (
      <StatusMessage variant="info">
        Đang xác thực liên kết đặt lại
        mật khẩu...
      </StatusMessage>
    );
  }


  if (!sessionReady) {
    return (
      <div className="reset-password-invalid">
        <StatusMessage variant="error">
          {status ??
            "Liên kết đã hết hạn hoặc không hợp lệ."}
        </StatusMessage>
      </div>
    );
  }


  return (
    <form
      className="auth-form reset-password-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {status ? (
        <div className="auth-form__status">
          <StatusMessage variant="error">
            {status}
          </StatusMessage>
        </div>
      ) : null}


      <div className="auth-form__stack">
        <FormField
          id="reset-password"
          label="Mật khẩu mới"
          error={errors.password}
          required
        >
          <PasswordInput
            id="reset-password"
            name="password"
            autoComplete="new-password"
            placeholder="Tối thiểu 8 ký tự"
            value={values.password}
            disabled={isSubmitting}
            onChange={(event) =>
              updateValue(
                "password",
                event.target.value,
              )
            }
          />
        </FormField>


        <FormField
          id="reset-confirm-password"
          label="Xác nhận mật khẩu"
          error={errors.confirmPassword}
          required
        >
          <PasswordInput
            id="reset-confirm-password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            value={values.confirmPassword}
            disabled={isSubmitting}
            onChange={(event) =>
              updateValue(
                "confirmPassword",
                event.target.value,
              )
            }
          />
        </FormField>
      </div>


      <Button
        className="auth-form__submit"
        type="submit"
        fullWidth
        loading={isSubmitting}
        loadingLabel="Đang cập nhật..."
      >
        Đặt lại mật khẩu
        <span aria-hidden="true">→</span>
      </Button>
    </form>
  );
}
