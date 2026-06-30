import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/request";
import PrimaryBtn from "../component/Button/PrimaryButton";
import InputField from "../component/Input/InputField";

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [userDomain, setUserDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDomain.trim()) {
      setError("Please enter your username");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest({
        url: "/admin/forgot-password",
        method: "POST",
        body: { userDomain: userDomain.trim() },
      });
      if (res.status) {
        setSent(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-300">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div
          className="w-full xl:max-w-120 max-w-100 rounded-xl overflow-hidden shadow-lg"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="2xl:px-8 md:px-6 px-4 2xl:py-7 py-6">
            {sent ? (
              <div className="text-center space-y-4 py-6">
                <div className="w-14 h-14 mx-auto rounded-full bg-green-50 flex items-center justify-center">
                  <MailIcon />
                </div>
                <h2 className="text-lg font-bold text-secondary">Check Your Email</h2>
                <p className="text-sm text-gray-500">
                  A password reset link has been sent to the email address associated with this username.
                </p>
                <button
                  onClick={() => navigate("/login")}
                  className="text-primary font-semibold text-sm hover:underline cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-secondary">Forgot Password</h2>
                  <p className="text-sm text-gray-500 mt-1">Enter your username to receive a reset link</p>
                </div>

                <InputField
                  label="Username"
                  type="text"
                  placeholder="Enter your username (e.g. ml123)"
                  value={userDomain}
                  onChange={(e) => { setUserDomain(e.target.value); setError(""); }}
                  icon={<UserIcon />}
                  required
                />

                {error && (
                  <p className="text-xs text-red-500 text-center">{error}</p>
                )}

                <PrimaryBtn className="w-full py-3 mt-4" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </PrimaryBtn>

                <div className="text-center mt-3">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-primary font-semibold text-sm hover:underline cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
