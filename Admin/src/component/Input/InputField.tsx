// src/component/Input/InputField.tsx
import { useState, forwardRef } from "react";
import type { ReactNode } from "react";

interface InputFieldProps {
  label?: string;
  name?: string;
  type?: "text" | "password" | "email" | "number" | "tel" | "date" | "time" | "datetime-local";
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  step?: string;
  min?: string;
}

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  required = false,
  disabled = false,
  error,
  className = "",
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="block text-[11px] font-semibold text-secondary/50">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="absolute inset-s-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </span>
        )}

        <input
          ref={ref}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`transition-all duration-200 bg-white border rounded-lg py-1.5 w-full focus:outline-none text-[13px] text-gray-700 placeholder-gray-400 ${icon ? "ps-10" : "ps-3.5"} ${isPassword ? "pe-10" : "pe-3.5"} ${error && error !== "" ? "border-red-400 focus:ring-1 focus:ring-red-100" : "border-[#364B9B66] focus:ring-1 focus:ring-primary/10"} ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}`}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((p) => !p)}
            className="absolute inset-e-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            {showPassword ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        )}
      </div>

      {error && error !== "" && (
        <p className="text-[10px] text-red-500 ps-1">{error}</p>
      )}
    </div>
  );
});

InputField.displayName = "InputField";
export default InputField;
