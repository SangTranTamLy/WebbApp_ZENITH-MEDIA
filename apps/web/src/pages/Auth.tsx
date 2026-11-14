import { useState, type ReactNode } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { ArrowRight, LogOut } from "lucide-react";
import { useShop } from "../lib/context";
import { isDemo, supabase } from "../lib/supabase";
import { errorMessage, post, put, setAccessToken } from "../lib/api";
import { ErrorState, Loading, PageHead } from "../components/Primitives";
import { AccountNav } from "../components/Layout";

export function RequireAuth({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const { me, ready, t } = useShop();
  const location = useLocation();
  if (!ready) return <Loading />;
  if (!me)
    return (
      <Navigate
        replace
        to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
      />
    );
  if (admin && !me.actor.admin)
    return (
      <div className="container">
        <ErrorState
          message={t(
            "Bạn không có quyền quản trị.",
            "You do not have admin access.",
          )}
        />
      </div>
    );
  return children;
}
export function AuthPage() {
  const { t, locale, loginDemo, refreshMe } = useShop();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const navigate = useNavigate();
  const destination = params.get("next");
  const next =
    destination?.startsWith("/") && !destination.startsWith("//")
      ? destination
      : "/library";
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError(
        t(
          "Đăng nhập chưa được cấu hình.",
          "Authentication has not been configured.",
        ),
      );
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setAccessToken(data.session?.access_token ?? null);
        await refreshMe();
        navigate(next);
      }
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name },
            emailRedirectTo: `${location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        setMessage(
          t(
            "Kiểm tra email để xác minh tài khoản, sau đó đăng nhập.",
            "Check your inbox to verify your email, then sign in.",
          ),
        );
      }
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/auth/callback?recovery=true`,
        });
        if (error) throw error;
        setMessage(
          t(
            "Nếu tài khoản tồn tại, bạn sẽ nhận email đặt lại mật khẩu.",
            "If an account exists, a password reset email will arrive shortly.",
          ),
        );
      }
    } catch (e) {
      setError(errorMessage(e, locale));
    } finally {
      setBusy(false);
    }
  }
  async function demo(role: string) {
    setBusy(true);
    try {
      await loginDemo(role);
      navigate(role === "demo-admin" ? "/admin" : next);
    } catch (e) {
      setError(errorMessage(e, locale));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page container">
      <div className="auth-story">
        <span>YOUR CREATIVE SPACE</span>
        <h1>
          {t(
            "Ý tưởng tiếp theo\nbắt đầu từ đây.",
            "Your next idea\nstarts here.",
          )}
        </h1>
        <p>
          {t(
            "Một tài khoản để lưu sản phẩm yêu thích, quản lý tài nguyên và nhận hỗ trợ sau mua.",
            "One account for your favorites, your assets and help when you need it.",
          )}
        </p>
      </div>
      <section className="auth-card">
        <h2>
          {mode === "login"
            ? t("Chào mừng trở lại", "Welcome back")
            : mode === "register"
              ? t("Tạo tài khoản", "Create your account")
              : t("Quên mật khẩu", "Reset your password")}
        </h2>
        <p>
          {t(
            "Không gian sáng tạo của bạn tại ZENITH MEDIA.",
            "Your creative space at ZENITH MEDIA.",
          )}
        </p>
        {isDemo ? (
          <div className="demo-login">
            <p className="notice-box">
              {t(
                "Tài khoản demo chỉ có hiệu lực trên máy này.",
                "Demo accounts only work in this local environment.",
              )}
            </p>
            <button
              disabled={busy}
              className="button full"
              onClick={() => void demo("demo-customer")}
            >
              {t("Trải nghiệm khách hàng", "Explore as a customer")}
              <ArrowRight size={17} />
            </button>
            <button
              disabled={busy}
              className="button secondary full"
              onClick={() => void demo("demo-admin")}
            >
              {t("Mở Admin demo", "Open demo admin")}
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)}>
            {mode === "register" && (
              <label>
                {t("Tên hiển thị", "Display name")}
                <input
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
            )}
            <label>
              Email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            {mode !== "forgot" && (
              <label>
                {t("Mật khẩu", "Password")}
                <input
                  type="password"
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}
            <button className="button full" disabled={busy || !supabase}>
              {busy
                ? t("Đang xử lý…", "Please wait…")
                : mode === "login"
                  ? t("Đăng nhập", "Sign in")
                  : mode === "register"
                    ? t("Tạo tài khoản", "Create account")
                    : t("Gửi email khôi phục", "Send reset email")}
            </button>
            {!supabase && (
              <p className="notice-box">
                {t(
                  "Đăng nhập sẽ mở khi cửa hàng hoàn tất cấu hình.",
                  "Sign-in will open when the store finishes setup.",
                )}
              </p>
            )}
          </form>
        )}
        {error && <ErrorState message={error} />}{" "}
        {message && (
          <p className="success-box" role="status">
            {message}
          </p>
        )}{" "}
        {!isDemo && (
          <div className="auth-links">
            <button
              className="text-button"
              onClick={() => {
                setMode(mode === "register" ? "login" : "register");
                setError("");
                setMessage("");
              }}
            >
              {mode === "register"
                ? t("Đã có tài khoản? Đăng nhập", "Already registered? Sign in")
                : t(
                    "Chưa có tài khoản? Đăng ký",
                    "New here? Create an account",
                  )}
            </button>
            <button
              className="text-button"
              onClick={() => setMode(mode === "forgot" ? "login" : "forgot")}
            >
              {mode === "forgot"
                ? t("Trở về đăng nhập", "Back to sign in")
                : t("Quên mật khẩu?", "Forgot password?")}
            </button>
          </div>
        )}
        <p className="small muted">
          {t(
            "Tiếp tục nghĩa là bạn đồng ý với",
            "By continuing, you agree to our",
          )}{" "}
          <Link to="/license">{t("điều khoản sử dụng", "terms of use")}</Link>.
        </p>
      </section>
    </div>
  );
}
export function AuthCallback() {
  const { ready, me } = useShop();
  const [params] = useSearchParams();
  if (!ready) return <Loading />;
  if (!me) return <Navigate to="/login" replace />;
  return (
    <Navigate
      to={params.get("recovery") === "true" ? "/account/reset" : "/library"}
      replace
    />
  );
}
export function Account() {
  const { t, locale, me, refreshMe, logout, toast } = useShop();
  const [name, setName] = useState(me?.account.name ?? ""),
    [email, setEmail] = useState(me?.actor.email ?? ""),
    [password, setPassword] = useState(""),
    [currentPassword, setCurrentPassword] = useState(""),
    [token, setToken] = useState(""),
    [challenge, setChallenge] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  async function action(work: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await work();
      await refreshMe();
      toast(t("Đã lưu thay đổi.", "Changes saved."));
    } catch (e) {
      setError(errorMessage(e, locale));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="container account-page">
      <AccountNav />
      <PageHead
        title={t("Hồ sơ của bạn", "Your profile")}
        description={t(
          "Thông tin cơ bản và bảo mật tài khoản.",
          "Your personal details and account security.",
        )}
      />
      <div className="profile-grid">
        <section className="form-panel">
          <h2>{t("Thông tin cá nhân", "Personal details")}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void action(() => put("/account", { name }));
            }}
          >
            <label>
              {t("Tên hiển thị", "Display name")}
              <input
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button className="button" disabled={busy}>
              {t("Lưu hồ sơ", "Save profile")}
            </button>
          </form>
          <p>
            {me?.actor.email}{" "}
            <span className="status">
              {me?.actor.verified
                ? t("Đã xác minh", "Verified")
                : t("Chưa xác minh", "Unverified")}
            </span>
          </p>
          {!me?.actor.verified && supabase && (
            <button
              className="button secondary"
              onClick={() =>
                void action(async () => {
                  const { error } = await supabase!.auth.resend({
                    type: "signup",
                    email: me!.actor.email,
                    options: {
                      emailRedirectTo: `${location.origin}/auth/callback`,
                    },
                  });
                  if (error) throw error;
                })
              }
            >
              {t("Gửi lại email xác minh", "Resend verification email")}
            </button>
          )}
        </section>
        <section className="form-panel">
          <h2>{t("Bảo mật", "Security")}</h2>
          {!isDemo ? (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void action(async () => {
                    const result = await supabase!.auth.updateUser(
                      { email },
                      { emailRedirectTo: `${location.origin}/auth/callback` },
                    );
                    if (result.error) throw result.error;
                    toast(
                      t(
                        "Kiểm tra email để xác nhận thay đổi.",
                        "Check your inbox to confirm the change.",
                      ),
                    );
                  });
                }}
              >
                <label>
                  {t("Email mới", "New email")}
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <button className="button secondary" disabled={busy}>
                  {t("Đổi email", "Change email")}
                </button>
              </form>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void action(async () => {
                    const result = await supabase!.auth.updateUser({
                      password,
                    });
                    if (result.error) throw result.error;
                    setPassword("");
                  });
                }}
              >
                <label>
                  {t("Mật khẩu mới", "New password")}
                  <input
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <button className="button secondary" disabled={busy}>
                  {t("Đặt mật khẩu mới", "Set new password")}
                </button>
              </form>
            </>
          ) : (
            <p className="muted">
              {t(
                "Thông tin xác thực demo không thay đổi mật khẩu Supabase.",
                "Demo credentials do not change Supabase passwords.",
              )}
            </p>
          )}
          <div className="session-actions">
            <button
              className="text-button"
              onClick={() => {
                void logout().then(() => navigate("/"));
              }}
            >
              <LogOut size={16} />
              {t("Đăng xuất thiết bị này", "Sign out this device")}
            </button>
            <button
              className="text-button"
              onClick={() => {
                void logout(true).then(() => navigate("/"));
              }}
            >
              {t("Đăng xuất tất cả thiết bị", "Sign out all devices")}
            </button>
          </div>
        </section>
        {!me?.actor.admin && (
          <section className="form-panel deletion-panel">
            <h2>{t("Yêu cầu xóa tài khoản", "Request account deletion")}</h2>
            <p>
              {t(
                "Bạn sẽ mất quyền truy cập khi yêu cầu được xử lý. Chứng từ giao dịch có thể được giữ theo nghĩa vụ pháp lý. Cần xác nhận bằng mật khẩu và email.",
                "Access will end when the request is processed. Transaction records may be retained to meet legal obligations. Password and email confirmation are required.",
              )}
            </p>
            {me?.account.deletionRequestedAt ? (
              <p className="notice-box">
                {t(
                  "Đã gửi yêu cầu. Admin sẽ xử lý theo chính sách lưu trữ.",
                  "Request submitted. An admin will review the retention requirements.",
                )}
              </p>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void action(async () => {
                    if (challenge)
                      await post("/account/deletion/confirm", { token });
                    else {
                      await post("/account/deletion/request", {
                        password: currentPassword,
                      });
                      setChallenge(true);
                    }
                  });
                }}
              >
                {challenge ? (
                  <label>
                    {t("Mã xác nhận email", "Email confirmation code")}
                    <input
                      required
                      autoComplete="one-time-code"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                    />
                    {isDemo && <small>Demo: 123456</small>}
                  </label>
                ) : (
                  <label>
                    {t("Mật khẩu hiện tại", "Current password")}
                    <input
                      type="password"
                      autoComplete="current-password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </label>
                )}
                <button className="button danger" disabled={busy}>
                  {challenge
                    ? t("Xác nhận yêu cầu xóa", "Confirm deletion request")
                    : t("Gửi mã xác nhận", "Send confirmation code")}
                </button>
              </form>
            )}
          </section>
        )}
      </div>
      {error && <ErrorState message={error} />}
    </div>
  );
}
