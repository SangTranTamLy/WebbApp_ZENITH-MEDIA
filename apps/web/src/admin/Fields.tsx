import type { Localized } from "@zenith/shared/browser";
import { useShop } from "../lib/context";
export function BilingualField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: Localized;
  onChange: (v: Localized) => void;
  multiline?: boolean;
}) {
  const { t } = useShop();
  return (
    <fieldset className="bilingual-field">
      <legend>{label}</legend>
      {(["vi", "en"] as const).map((lang) => (
        <label key={lang}>
          <span>
            {lang === "vi" ? t("Tiếng Việt", "Vietnamese") : "English"}
          </span>
          {multiline ? (
            <textarea
              rows={4}
              value={value[lang]}
              onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
            />
          ) : (
            <input
              value={value[lang]}
              onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
            />
          )}
        </label>
      ))}
    </fieldset>
  );
}
