import type { ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
};

export function FormField({
  id,
  label,
  children,
  error,
  hint,
  required = false,
}: FormFieldProps) {
  const descriptionId = error
    ? `${id}-error`
    : hint
      ? `${id}-hint`
      : undefined;

  return (
    <div
      className={`form-field ${
        error ? "form-field--error" : ""
      }`}
    >
      <div className="form-field__label-row">
        <label className="form-field__label" htmlFor={id}>
          {label}

          {required ? (
            <span aria-hidden="true"> *</span>
          ) : null}
        </label>
      </div>

      {children}

      {error ? (
        <p
          className="form-field__error"
          id={descriptionId}
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {!error && hint ? (
        <p className="form-field__hint" id={descriptionId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}