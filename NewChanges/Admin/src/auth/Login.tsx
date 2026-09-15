import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PrimaryBtn from "../component/Button/PrimaryButton";
import AuthBanner from "./AuthBanner";
import InputField from "../component/Input/InputField";
import AuthTitle from "./AuthTitle";
import { adminLoginApi } from "../api/auth.api";
import { setAccessToken } from "../api/request";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTranslation } from "../hooks/useTranslation";

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const { setAdminUser } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ employeeId?: string; password?: string; general?: string }>({});

  const validate = () => {
    const nextErrors: { employeeId?: string; password?: string } = {};
    const cleanEmployeeId = employeeId.trim();

    if (!cleanEmployeeId) {
      nextErrors.employeeId = t.login.employeeIdRequired;
    } else if (cleanEmployeeId.length < 3 || cleanEmployeeId.length > 120) {
      nextErrors.employeeId = t.login.employeeIdInvalid;
    } else if (/[<>"'`;(){}]/.test(cleanEmployeeId)) {
      nextErrors.employeeId = t.login.invalidCharacters;
    }

    if (!password) {
      nextErrors.password = t.login.passwordRequired;
    } else if (password.length < 6 || password.length > 128) {
      nextErrors.password = t.login.passwordInvalid;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const response = await adminLoginApi({
        email: employeeId.trim(),
        password,
      });

      const { accessToken, admin, language } = response.data;

      if (accessToken) {
        setAccessToken(accessToken);
      }

      // ⚠️ Store ONLY display-safe fields in localStorage (name, image, email).
      // Do NOT store permissions or roleId in localStorage — they can be spoofed.
      // Authorization decisions must use AuthContext (populated via setAdminUser below).
      localStorage.setItem("adminUser", JSON.stringify({
        id: admin.id,
        name: admin.name,
        nameAr: admin.nameAr,
        email: admin.email,
        image: admin.image,
        // permissions and roleId intentionally excluded from localStorage
      }));
      localStorage.setItem("adminRememberMe", JSON.stringify(rememberMe));

      // Store permissions/roleId in sessionStorage (cleared on tab close)
      // so page refresh can restore them if /api/admin/me omits them.
      sessionStorage.setItem("adminSession", JSON.stringify({
        permissions: admin.permissions,
        roleId: admin.roleId,
      }));
      if (language) {
        localStorage.setItem("adminLanguage", language);
      }

      // Populate AuthContext with server-verified permissions and role
      // This is the ONLY source of truth for authorization decisions.
      setAdminUser(admin);

      navigate("/dashboard");
    } catch (error) {
      setErrors((current) => ({
        ...current,
        general: error instanceof Error ? error.message : t.login.loginFailed,
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-300">
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Top Bar */}
        <AuthTitle />

        {/* Card */}
        <div
          className="relative w-full xl:max-w-120 max-w-100 rounded-xl overflow-hidden shadow-lg"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="absolute top-2 end-2 z-10 flex items-center gap-1.5 text-sm font-bold text-primary py-1.5 px-3 rounded-lg bg-white/80 backdrop-blur-sm border border-primary/10 hover:bg-primary/5 transition-colors cursor-pointer"
            aria-label="Switch language"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.02231 16.9777C7.07674 18.6978 7.26397 19.7529 7.90796 20.5376C8.07418 20.7401 8.25989 20.9258 8.46243 21.092C9.56878 22 11.2125 22 14.5 22C17.7875 22 19.4312 22 20.5376 21.092C20.7401 20.9258 20.9258 20.7401 21.092 20.5376C22 19.4312 22 17.7875 22 14.5C22 11.2125 22 9.56878 21.092 8.46243C20.9258 8.25989 20.7401 8.07418 20.5376 7.90796C19.7563 7.26676 18.707 7.07837 17 7.02303M7.02231 16.9777C5.30217 16.9233 4.24713 16.736 3.46243 16.092C3.25989 15.9258 3.07418 15.7401 2.90796 15.5376C2 14.4312 2 12.7875 2 9.5C2 6.21252 2 4.56878 2.90796 3.46243C3.07418 3.25989 3.25989 3.07418 3.46243 2.90796C4.56878 2 6.21252 2 9.5 2C12.7875 2 14.4312 2 15.5376 2.90796C15.7401 3.07418 15.9258 3.25989 16.092 3.46243C16.736 4.24713 16.9233 5.30217 16.9777 7.02231C16.9777 7.02231 16.9777 7.02231 17 7.02303M7.02231 16.9777L17 7.02303"
                stroke="#161616" strokeWidth="1.5" />
            </svg>
            <span>{language === "ar" ? "EN" : "عربي"}</span>
          </button>

          {/* Hero Banner */}
          <AuthBanner />

          {/* Form Section */}
          <div className="2xl:px-8 md:px-6 px-4 2xl:py-7 py-6">
            <form onSubmit={handleSignIn} className="space-y-3">
              {/* Employee ID Field */}
              <InputField
                label={t.login.employeeId}
                placeholder={t.login.employeeId}
                value={employeeId}
                onChange={(e) => {
                  setEmployeeId(e.target.value.slice(0, 120));
                  if (errors.employeeId || errors.general) {
                    setErrors((current) => ({ ...current, employeeId: undefined, general: undefined }));
                  }
                }}
                icon={<UserIcon />}
                required
                error={errors.employeeId}
              />

              <InputField
                label={t.login.password}
                type="password"
                placeholder={t.login.password}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value.slice(0, 128));
                  if (errors.password || errors.general) {
                    setErrors((current) => ({ ...current, password: undefined, general: undefined }));
                  }
                }}
                icon={<LockIcon />}
                required
                error={errors.password}
              />

              {errors.general && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {errors.general}
                </div>
              )}

              {/* Links */}
              <div className="flex flex-wrap items-center justify-between text-sm gap-1 gap-y-0">
                <label className="inline-flex items-center gap-2 text-gray-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="size-4 accent-primary"
                  />
                  {t.login.rememberMe}
                </label>
                {/* <a
                  onClick={() => navigate("/forgot-password")}
                  className="text-primary hover:underline font-medium transition-colors cursor-pointer"
                >
                  Forgot Password?
                </a> */}
              </div>

              {/* Sign In Button */}
              <PrimaryBtn className="w-full py-3 mt-6" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                    {t.login.signingIn}
                  </span>
                ) : (
                  t.login.signIn
                )}
              </PrimaryBtn>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
