import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AvtarImage, HeroBanner, LogoImage, RunningPerson } from "../../assets/images/images";
import LanguageToggle from "../../components/Header/LanguageToggle";
import { useAuthStore } from "../../store/store";
import { loginApi } from "../../api/auth.api";

type LoginErrors = {
  username?: string;
  password?: string;
  general?: string;
};


export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser, setToken, setAccessToken, setCurrentLanguage } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});

  const validate = () => {
    const nextErrors: LoginErrors = {};

    if (!username.trim()) {
      nextErrors.username = t("login.usernameRequired");
    }

    if (!password.trim()) {
      nextErrors.password = t("login.passwordRequired");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      debugger
      const response = await loginApi({
        username: username.trim(),
        password,
      });
      const token = response.data?.jwtToken;
      const refreshToken = response.data?.refreshToken;
      const user = response.data?.user;

      if (!token) {
        throw new Error("Login response did not include a token.");
      }

      const authPayload = {
        ...user,
        username: username.trim(),
        avatar: user?.image || AvtarImage,
        image: user?.image || AvtarImage,
        refreshToken
      };

      setUser(authPayload);
      setToken(token);
      setAccessToken(token);
      if (response.data.language) {
        setCurrentLanguage(response.data.language);
      }

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.setItem("rememberMe", "false");
      }

      navigate("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to login. Please try again.";
      setErrors((current) => ({ ...current, general: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="h-dvh max-h-dvh bg-red-light text-secondary overflow-hidden">
      <section className="relative h-full flex items-stretch overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${HeroBanner})` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(122,37,48,0.18),transparent_28%),linear-gradient(135deg,#FFF3F3_0%,#FFFFFF_45%,#F4F7FB_100%)]" />

        <div className="relative max-w-341.5 w-full mx-auto md:px-7 px-4 xl:py-6 py-4 flex flex-col h-full min-h-0">
          <header className="flex items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center">
              <img src={LogoImage} alt="GDRFA Sports" className="xl:h-8 md:h-7 h-6 w-auto" />
            </Link>
            <div className="rounded-2xl bg-white/70 border border-white px-3 py-2 backdrop-blur-md">
              <LanguageToggle />
            </div>
          </header>

          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-center flex-1 min-h-0 xl:py-6 py-4">
            <div className="relative h-full min-h-0 flex items-end max-lg:hidden">
              <div className="absolute xl:top-8 top-5 inset-s-0 z-10 max-w-150">
                <span className="inline-flex rounded-full bg-white/70 border border-white px-4 py-2 text-primary text-sm font-bold backdrop-blur-md">
                  {t("login.eyebrow")}
                </span>
                <h1 className="xl:mt-5 mt-4 xl:text-[58px]/[0.98] md:text-5xl/tight text-4xl/tight font-bold text-secondary max-w-140">
                  {t("login.heroTitle")}
                </h1>
                <p className="xl:mt-4 mt-3 max-w-112 text-secondary/70 md:text-base/tight text-sm/tight font-medium">
                  {t("login.heroText")}
                </p>
              </div>

              <div className="absolute lg:inset-e-8 inset-e-0 lg:bottom-0 bottom-2 login-runner">
                <img
                  src={RunningPerson}
                  alt=""
                  className="xl:w-115 lg:w-96 md:w-80 w-72 max-w-[62vw] rtl:-scale-x-100"
                />
              </div>


            </div>

            <div className="relative min-h-0">
              <div className="absolute -top-6 -inset-e-4 w-24 h-24 rounded-full border border-primary/20 login-orbit" />
              <form
                noValidate
                onSubmit={handleSubmit}
                className="relative z-10 bg-white/80 border border-white xl:rounded-[40px] rounded-3xl xl:p-7 md:p-6 p-4 backdrop-blur-xl shadow-[0_30px_90px_rgba(10,34,64,0.16)] max-w-145 ms-auto"
              >
                <div className="flex items-start justify-between gap-4 xl:mb-6 mb-5">
                  <div>
                    <h2 className="text-secondary font-bold xl:text-3xl/tight text-2xl/tight">{t("login.title")}</h2>
                    <p className="mt-2 text-secondary/60 md:text-sm/tight text-xs/tight font-medium max-w-105">
                      {t("login.subtitle")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="min-w-12 w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center transition hover:bg-secondary cursor-pointer rtl:-scale-x-100"
                    aria-label="Back to home"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M15 6C15 6 9 10.419 9 12C9 13.581 15 18 15 18"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {errors.general && (
                    <div className="rounded-2xl border border-primary/15 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
                      {errors.general}
                    </div>
                  )}
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-secondary">{t("login.username")}</span>
                    <div className="relative">
                      <input
                        value={username}
                        onChange={(event) => {
                          setUsername(event.target.value);
                          if (errors.username || errors.general) setErrors((current) => ({ ...current, username: undefined, general: undefined }));
                        }}
                        className="w-full rounded-2xl border border-secondary/10 bg-[#F7EEF0] px-4 py-3 pe-12 text-secondary font-semibold outline-none transition focus:border-primary focus:bg-white"
                        placeholder={t("login.username")}
                        autoComplete="username"
                      />
                      <span className="absolute top-1/2 -translate-y-1/2 inset-e-4 text-primary">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <path d="M20 21C20 18.239 16.418 16 12 16C7.582 16 4 18.239 4 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      </span>
                    </div>
                    {errors.username && <span className="mt-2 block text-sm font-semibold text-primary">{errors.username}</span>}
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-bold text-secondary">{t("login.password")}</span>
                    <div className="relative">
                      <input
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          if (errors.password || errors.general) setErrors((current) => ({ ...current, password: undefined, general: undefined }));
                        }}
                        type={showPassword ? "text" : "password"}
                        className="w-full rounded-2xl border border-secondary/10 bg-[#F7EEF0] px-4 py-3 pe-12 text-secondary font-semibold outline-none transition focus:border-primary focus:bg-white"
                        placeholder={t("login.password")}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute top-1/2 -translate-y-1/2 inset-e-4 text-primary cursor-pointer"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <path d="M2.5 12S5.8 5.5 12 5.5S21.5 12 21.5 12S18.2 18.5 12 18.5S2.5 12 2.5 12Z" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M12 15A3 3 0 1 0 12 9A3 3 0 0 0 12 15Z" stroke="currentColor" strokeWidth="1.5" />
                          {!showPassword && <path d="M4 20L20 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />}
                        </svg>
                      </button>
                    </div>
                    {errors.password && <span className="mt-2 block text-sm font-semibold text-primary">{errors.password}</span>}
                  </label>
                </div>

                <div className="mt-4 flex sm:flex-row flex-col sm:items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-semibold text-secondary">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="peer sr-only"
                    />
                    <span className="w-5 h-5 rounded-full border border-secondary/30 bg-white flex items-center justify-center peer-checked:border-primary peer-checked:bg-primary">
                      <span className="w-2 h-2 rounded-full bg-white opacity-0 peer-checked:opacity-100" />
                    </span>
                    {t("login.rememberMe")}
                  </label>
                  {/* <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-sm font-bold text-primary underline underline-offset-4 w-fit cursor-pointer"
                  >
                    {t("login.forgotPassword")}
                  </button> */}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 w-full rounded-2xl bg-primary border border-primary py-3 px-5 text-white font-bold text-base transition hover:bg-transparent hover:text-primary disabled:cursor-wait disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? t("login.submitting") : t("login.submit")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
