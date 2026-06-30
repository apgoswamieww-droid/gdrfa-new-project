import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { HeroBanner, LogoImage, RunningPerson } from "../../assets/images/images";
import LanguageToggle from "../../components/Header/LanguageToggle";
import { forgotPasswordApi } from "../../api/auth.api";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError(t("forgotPassword.emailRequired"));
      setIsSent(false);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError(t("forgotPassword.invalidEmail"));
      setIsSent(false);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await forgotPasswordApi({ email: trimmedEmail });
      setIsSent(true);
    } catch (apiError) {
      setIsSent(false);
      setError(apiError instanceof Error ? apiError.message : "Unable to send reset link. Please try again.");
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_22%,rgba(122,37,48,0.18),transparent_30%),linear-gradient(135deg,#FFFFFF_0%,#FFF3F3_46%,#F4F7FB_100%)]" />

        <div className="relative max-w-341.5 w-full mx-auto md:px-7 px-4 xl:py-6 py-4 flex flex-col h-full min-h-0">
          <header className="flex items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center">
              <img src={LogoImage} alt="GDRFA Sports" className="xl:h-8 md:h-7 h-6 w-auto" />
            </Link>
            <div className="rounded-2xl bg-white/70 border border-white px-3 py-2 backdrop-blur-md">
              <LanguageToggle />
            </div>
          </header>

          <div className="grid lg:grid-cols-[0.92fr_1.08fr] gap-6 items-center flex-1 min-h-0 xl:py-6 py-4">
            <div className="relative min-h-0">
              <div className="absolute -top-6 -inset-s-4 w-24 h-24 rounded-full border border-primary/20 login-orbit" />
              <form
                noValidate
                onSubmit={handleSubmit}
                className="relative z-10 bg-white/80 border border-white xl:rounded-[40px] rounded-3xl xl:p-7 md:p-6 p-4 backdrop-blur-xl shadow-[0_30px_90px_rgba(10,34,64,0.16)] max-w-145"
              >
                <div className="xl:mb-6 mb-5">
                  <span className="inline-flex rounded-full bg-primary/10 px-4 py-2 text-primary text-sm font-bold">
                    {t("forgotPassword.eyebrow")}
                  </span>
                  <h1 className="mt-4 text-secondary font-bold xl:text-3xl/tight text-2xl/tight">
                    {t("forgotPassword.title")}
                  </h1>
                  <p className="mt-2 text-secondary/60 md:text-sm/tight text-xs/tight font-medium max-w-110">
                    {t("forgotPassword.subtitle")}
                  </p>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-bold text-secondary">{t("forgotPassword.email")}</span>
                  <div className="relative">
                    <input
                      value={email}
                      type="email"
                      onChange={(event) => {
                        setEmail(event.target.value);
                        if (error) setError("");
                        if (isSent) setIsSent(false);
                      }}
                      className="w-full rounded-2xl border border-secondary/10 bg-[#F7EEF0] px-4 py-3 pe-12 text-secondary font-semibold outline-none transition focus:border-primary focus:bg-white"
                      placeholder={t("forgotPassword.email")}
                      autoComplete="email"
                    />
                    <span className="absolute top-1/2 -translate-y-1/2 inset-e-4 text-primary">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path d="M7 8.5L9.942 10.239C11.657 11.254 12.343 11.254 14.058 10.239L17 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2.016 13.476C2.081 16.541 2.114 18.074 3.245 19.209C4.376 20.345 5.95 20.384 9.099 20.463C11.039 20.512 12.961 20.512 14.901 20.463C18.05 20.384 19.624 20.345 20.755 19.209C21.886 18.074 21.919 16.541 21.984 13.476C22.005 12.49 22.005 11.51 21.984 10.524C21.919 7.459 21.886 5.926 20.755 4.791C19.624 3.655 18.05 3.616 14.901 3.537C12.961 3.488 11.039 3.488 9.099 3.537C5.95 3.616 4.376 3.655 3.245 4.791C2.114 5.926 2.081 7.459 2.016 10.524C1.995 11.51 1.995 12.49 2.016 13.476Z" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </span>
                  </div>
                  {error && <span className="mt-2 block text-sm font-semibold text-primary">{error}</span>}
                </label>

                {isSent && (
                  <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/10 px-4 py-3 text-sm font-semibold text-secondary">
                    {t("forgotPassword.success")}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 w-full rounded-2xl bg-primary border border-primary py-3 px-5 text-white font-bold text-base transition hover:bg-transparent hover:text-primary disabled:cursor-wait disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
                </button>

                <Link
                  to="/login"
                  className="mt-4 inline-flex w-full justify-center text-sm font-bold text-primary underline underline-offset-4"
                >
                  {t("forgotPassword.backToLogin")}
                </Link>
              </form>
            </div>

            <div className="relative h-full min-h-0 flex items-end justify-end max-lg:hidden">
              <div className="absolute xl:top-8 top-5 inset-s-0 z-10 lg:max-w-130 max-w-120">
                <h2 className="xl:text-[54px]/[0.98] md:text-5xl/tight text-4xl/tight font-bold text-secondary">
                  {t("forgotPassword.heroTitle")}
                </h2>
                <p className="xl:mt-4 mt-3 text-secondary/70 md:text-base/tight text-sm/tight font-medium max-w-105">
                  {t("forgotPassword.heroText")}
                </p>
              </div>

              <div className="absolute lg:inset-e-4 inset-e-0 bottom-0 login-runner">
                <img
                  src={RunningPerson}
                  alt=""
                  className="xl:w-115 lg:w-96 md:w-80 w-72 max-w-[62vw] rtl:-scale-x-100"
                />
              </div>

              <div className="relative z-20 rounded-2xl bg-white/75 border border-white px-4 py-3 backdrop-blur-md shadow-[0_20px_50px_rgba(10,34,64,0.08)] max-w-105 login-stat">
                <strong className="block text-primary md:text-2xl text-xl font-bold">02:00</strong>
                <span className="mt-1 block text-secondary/60 text-sm font-semibold">
                  {t("forgotPassword.resetWindow")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
