import { useState } from "react";
import type { InputHTMLAttributes } from "react";

type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
>;

export function PasswordInput({
  className = "",
  ...inputProps
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="password-input">
      <input
        {...inputProps}
        className={`password-input__control ${className}`}
        type={isVisible ? "text" : "password"}
      />

      <button
        className="password-input__toggle"
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        aria-label={
          isVisible ? "Ẩn mật khẩu" : "Hiển thị mật khẩu"
        }
        aria-pressed={isVisible}
      >
        {isVisible ? "ẨN" : "HIỆN"}
      </button>
    </div>
  );
}