import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PrimaryBtn from "../component/Button/PrimaryButton";
import AuthBanner from "./AuthBanner";
import InputField from "../component/Input/InputField";
import AuthTitle from "./AuthTitle";
import { adminLoginApi } from "../api/auth.api";
import { setRefreshToken } from "../api/request";

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
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<{ employeeId?: string; password?: string; general?: string }>({});

  const validate = () => {
    const nextErrors: { employeeId?: string; password?: string } = {};
    const cleanEmployeeId = employeeId.trim();

    if (!cleanEmployeeId) {
      nextErrors.employeeId = "Employee ID / Username is required.";
    } else if (cleanEmployeeId.length < 3 || cleanEmployeeId.length > 120) {
      nextErrors.employeeId = "Enter a valid Employee ID / Username.";
    } else if (/[<>"'`;(){}]/.test(cleanEmployeeId)) {
      nextErrors.employeeId = "Invalid characters are not allowed.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 6 || password.length > 128) {
      nextErrors.password = "Password length is invalid.";
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

      console.log("Login response.data:", response.data);
      console.log("Admin object:", response.data?.admin);
      console.log("RoleId:", response.data?.admin?.roleId);
      console.log("Permissions:", response.data?.admin?.permissions);

      const { token, refreshToken, admin, language } = response.data;
      if (!token) {
        throw new Error("Login response did not include a token.");
      }

      if (refreshToken) {
        setRefreshToken(refreshToken);
      }

      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminUser", JSON.stringify(admin));
      localStorage.setItem("adminRememberMe", JSON.stringify(rememberMe));
      if (language) {
        localStorage.setItem("adminLanguage", language);
      }

      navigate("/dashboard");
    } catch (error) {
      setErrors((current) => ({
        ...current,
        general: error instanceof Error ? error.message : "Unable to login. Please try again.",
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
          className="w-full xl:max-w-120 max-w-100 rounded-xl overflow-hidden shadow-lg"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Hero Banner */}
          <AuthBanner />

          {/* Form Section */}
          <div className="2xl:px-8 md:px-6 px-4 2xl:py-7 py-6">
            <form onSubmit={handleSignIn} className="space-y-3">
              {/* Employee ID Field */}
              <InputField
                label="Employee ID / Username"
                placeholder="Employee ID / Username"
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
                label="Password"
                type="password"
                placeholder="Password"
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
                  Remember me
                </label>
                <a
                  onClick={() => navigate("/forgot-password")}
                  className="text-primary hover:underline font-medium transition-colors cursor-pointer"
                >
                  Forgot Password?
                </a>
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
                    Signing In...
                  </span>
                ) : (
                  "Sign In"
                )}
              </PrimaryBtn>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
