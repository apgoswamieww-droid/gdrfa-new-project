import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../api/request";
import PrimaryBtn from "../component/Button/PrimaryButton";
import InputField from "../component/Input/InputField";

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token || !email) {
    return (
      <div className="min-h-screen w-full flex flex-col bg-gray-300">
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full xl:max-w-120 max-w-100 rounded-xl overflow-hidden shadow-lg bg-white/92 p-8 text-center">
            <h2 className="text-lg font-bold text-red-600">Invalid Reset Link</h2>
            <p className="text-sm text-gray-500 mt-2">This reset link is missing required parameters.</p>
            <button onClick={() => navigate("/login")} className="text-primary font-semibold text-sm hover:underline cursor-pointer mt-4">Back to Login</button>
          </div>
        </main>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest({
        url: "/admin/reset-password",
        method: "POST",
        body: { email, token, new_password: password, confirm_password: confirmPassword },
      });
      if (res.status) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-300">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full xl:max-w-120 max-w-100 rounded-xl overflow-hidden shadow-lg"
          style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)" }}
        >
          <div className="2xl:px-8 md:px-6 px-4 2xl:py-7 py-6">
            {success ? (
              <div className="text-center space-y-4 py-6">
                <div className="w-14 h-14 mx-auto rounded-full bg-green-50 flex items-center justify-center">
                  <CheckIcon />
                </div>
                <h2 className="text-lg font-bold text-secondary">Password Reset Successful</h2>
                <p className="text-sm text-gray-500">Your password has been reset. You can now log in.</p>
                <button onClick={() => navigate("/login")} className="text-primary font-semibold text-sm hover:underline cursor-pointer">Back to Login</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-secondary">Reset Your Password</h2>
                  <p className="text-sm text-gray-500 mt-1">Enter your new password below</p>
                </div>

                <InputField label="New Password" type="password" placeholder="Enter new password" value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }} icon={<LockIcon />} required />
                <InputField label="Confirm Password" type="password" placeholder="Confirm new password" value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }} icon={<LockIcon />} required />

                {error && <p className="text-xs text-red-500 text-center">{error}</p>}

                <PrimaryBtn className="w-full py-3 mt-4" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                      Resetting...
                    </span>
                  ) : "Reset Password"}
                </PrimaryBtn>

                <div className="text-center mt-3">
                  <button type="button" onClick={() => navigate("/login")} className="text-primary font-semibold text-sm hover:underline cursor-pointer">Back to Login</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
