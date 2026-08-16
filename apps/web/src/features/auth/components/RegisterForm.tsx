import {
  useState,
  type FormEvent,
} from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { FormField } from "../../../components/ui/FormField";
import { StatusMessage } from "../../../components/ui/StatusMessage";
import { registerRequest } from "../auth.api";
import {
  registerSchema,
  type RegisterFormValues,
} from "../schemas/register.schema";
import { AuthDivider } from "./AuthDivider";
import { PasswordInput } from "./PasswordInput";
import {
  SocialLoginButtons,
  type SocialProvider,
} from "./SocialLoginButtons";

type RegisterErrors = Partial<
  Record<keyof RegisterFormValues, string>
>;

type FormStatus = {
  variant: "error" | "info";
  message: string;
};

const initialValues: RegisterFormValues = {
  displayName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptedTerms: false,
};

const registerFields = new Set<
  keyof RegisterFormValues
>([
  "displayName",
  "username",
  "email",
  "password",
  "confirmPassword",
  "acceptedTerms",
]);

export function RegisterForm() {
  const navigate = useNavigate();

  const [values, setValues] =
    useState<RegisterFormValues>(initialValues);

  const [errors, setErrors] =
    useState<RegisterErrors>({});

  const [status, setStatus] =
    useState<FormStatus | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  function updateValue<
    Key extends keyof RegisterFormValues,
  >(
    key: Key,
    value: RegisterFormValues[Key],
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
    const nextErrors: RegisterErrors = {};

    for (const issue of issues) {
      const field = issue.path[0];

      if (
        typeof field === "string" &&
        registerFields.has(
          field as keyof RegisterFormValues,
        )
      ) {
        const typedField =
          field as keyof RegisterFormValues;

        if (!nextErrors[typedField]) {
          nextErrors[typedField] =
            issue.message;
        }
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
      registerSchema.safeParse(values);

    if (!validation.success) {
      applyValidationErrors(
        validation.error.issues,
      );

      setStatus(null);

      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setStatus(null);

    try {
      const response = await registerRequest(
        validation.data,
      );

      if (
        response.data
          .requiresEmailVerification
      ) {
        navigate("/verify-email", {
          replace: true,
          state: {
            email:
              response.data.user.email ??
              validation.data.email,
          },
        });

        return;
      }

      navigate("/login", {
        replace: true,
        state: {
          registrationSuccess: true,
        },
      });
    } catch (error) {
      setStatus({
        variant: "error",
        message:
          error instanceof Error
            ? error.message
            : "Không thể đăng ký tài khoản",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSocialRegister(
    provider: SocialProvider,
  ) {
    const providerName =
      provider === "google"
        ? "Google"
        : "Discord";

    setStatus({
      variant: "info",
      message:
        `Đăng ký bằng ${providerName} sẽ được ` +
        "kết nối sau khi hoàn thành OAuth backend.",
    });
  }

  return (
    <form
      className="auth-form register-form"
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

      <div className="register-form__grid">
        <FormField
          id="register-display-name"
          label="Tên hiển thị"
          error={errors.displayName}
          required
        >
          <input
            id="register-display-name"
            className="auth-input"
            name="displayName"
            type="text"
            autoComplete="name"
            placeholder="Sang Tran"
            value={values.displayName}
            disabled={isSubmitting}
            onChange={(event) =>
              updateValue(
                "displayName",
                event.target.value,
              )
            }
          />
        </FormField>

        <FormField
          id="register-username"
          label="Username"
          error={errors.username}
          required
        >
          <input
            id="register-username"
            className="auth-input"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="sangtran"
            value={values.username}
            disabled={isSubmitting}
            onChange={(event) =>
              updateValue(
                "username",
                event.target.value,
              )
            }
          />
        </FormField>
      </div>

      <FormField
        id="register-email"
        label="Email"
        error={errors.email}
        required
      >
        <input
          id="register-email"
          className="auth-input"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="ban@example.com"
          value={values.email}
          disabled={isSubmitting}
          onChange={(event) =>
            updateValue(
              "email",
              event.target.value,
            )
          }
        />
      </FormField>

      <FormField
        id="register-password"
        label="Mật khẩu"
        error={errors.password}
        required
      >
        <PasswordInput
          id="register-password"
          name="password"
          autoComplete="new-password"
          placeholder="Từ 8 đến 64 ký tự"
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
        id="register-confirm-password"
        label="Xác nhận mật khẩu"
        error={errors.confirmPassword}
        required
      >
        <PasswordInput
          id="register-confirm-password"
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

      <div className="register-form__terms">
        <label className="auth-checkbox">
          <input
            className="auth-checkbox__control"
            name="acceptedTerms"
            type="checkbox"
            checked={values.acceptedTerms}
            disabled={isSubmitting}
            onChange={(event) =>
              updateValue(
                "acceptedTerms",
                event.target.checked,
              )
            }
          />

          <span>
            Tôi đồng ý với{" "}
            <Link to="/terms">
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link to="/privacy">
              Chính sách quyền riêng tư
            </Link>
            .
          </span>
        </label>

        {errors.acceptedTerms ? (
          <p
            className="form-field__error"
            role="alert"
          >
            {errors.acceptedTerms}
          </p>
        ) : null}
      </div>

      <Button
        className="auth-form__submit"
        type="submit"
        fullWidth
        loading={isSubmitting}
        loadingLabel="Đang tạo tài khoản..."
      >
        Tạo tài khoản
        <span aria-hidden="true">→</span>
      </Button>

      <div className="auth-form__social">
        <AuthDivider>
          HOẶC TIẾP TỤC VỚI
        </AuthDivider>

        <SocialLoginButtons
          disabled={isSubmitting}
          onSelect={handleSocialRegister}
        />
      </div>
    </form>
  );
}
