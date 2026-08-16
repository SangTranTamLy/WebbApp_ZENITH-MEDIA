import {useState,type FormEvent,} from "react";
import {Link, useLocation,useNavigate,} from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { StatusMessage } from "../../../components/ui/StatusMessage";
import {loginSchema,type LoginFormValues,} from "../schemas/loginSchema";
import { useAuth } from "../useAuth";
import { AuthDivider } from "./AuthDivider";
import { PasswordInput } from "./PasswordInput";
import {
  SocialLoginButtons,
  type SocialProvider,
} from "./SocialLoginButtons";

type LoginErrors = Partial<
  Record<"identifier" | "password", string>
>;

type FormStatus = {
  variant: "error" | "info";
  message: string;
};

type RedirectState = {
  from?: {
    pathname?: string;
  };
};

const initialValues: LoginFormValues = {
  identifier: "",
  password: "",
  remember: false,
};

function getRedirectPath(
  state: unknown,
): string {
  const redirectState = state as RedirectState | null;
  const pathname =
    redirectState?.from?.pathname;

  if (
    typeof pathname === "string" &&
    pathname.startsWith("/") &&
    !pathname.startsWith("//") &&
    pathname !== "/login"
  ) {
    return pathname;
  }

  return "/community";
}

export function LoginForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [values, setValues] =
    useState<LoginFormValues>(initialValues);

  const [errors, setErrors] =
    useState<LoginErrors>({});

  const [status, setStatus] =
    useState<FormStatus | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  function updateValue<
    Key extends keyof LoginFormValues,
  >(
    key: Key,
    value: LoginFormValues[Key],
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

    const validation =
      loginSchema.safeParse(values);

    if (!validation.success) {
      applyValidationErrors(
        validation.error.issues,
      );

      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      await signIn(validation.data);

      navigate(
        getRedirectPath(location.state),
        {
          replace: true,
        },
      );
    } catch (error) {
      setStatus({
        variant: "error",
        message:
          error instanceof Error
            ? error.message
            : "Không thể đăng nhập",
      });
    } finally {
      setIsSubmitting(false);
    }
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
      message:
        `Tính năng đăng nhập ${providerName} sẽ được kết nối `
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
          <StatusMessage
            variant={status.variant}
          >
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
            placeholder="Email hoặc username"
            value={values.identifier}
            disabled={isSubmitting}
            onChange={(event) =>
              updateValue(
                "identifier",
                event.target.value,
              )
            }
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
            disabled={isSubmitting}
            onChange={(event) =>
              updateValue(
                "password",
                event.target.value,
              )
            }
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
            disabled={isSubmitting}
            onChange={(event) =>
              updateValue(
                "remember",
                event.target.checked,
              )
            }
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
        Đăng nhập
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