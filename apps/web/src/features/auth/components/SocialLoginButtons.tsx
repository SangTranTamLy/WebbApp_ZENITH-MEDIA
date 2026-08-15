import { DiscordIcon } from "./DiscordIcon";
import { GoogleIcon } from "./GoogleIcon";

export type SocialProvider = "google" | "discord";

type SocialLoginButtonsProps = {
  disabled?: boolean;
  onSelect: (provider: SocialProvider) => void;
};

export function SocialLoginButtons({
  disabled = false,
  onSelect,
}: SocialLoginButtonsProps) {
  return (
    <div className="social-login-buttons">
      <button
        className="social-login-button social-login-button--google"
        type="button"
        disabled={disabled}
        onClick={() => onSelect("google")}
      >
        <GoogleIcon className="social-login-icon" />
        <span>Google</span>
      </button>

      <button
        className="social-login-button social-login-button--discord"
        type="button"
        disabled={disabled}
        onClick={() => onSelect("discord")}
      >
        <DiscordIcon className="social-login-icon" />
        <span>Discord</span>
      </button>
    </div>
  );
}