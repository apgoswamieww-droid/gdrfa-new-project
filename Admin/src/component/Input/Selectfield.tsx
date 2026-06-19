// src/component/Input/Selectfield.tsx
import { useState } from "react";

interface SelectFieldProps {
  label?: string;
  name?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string | number; label: string }[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export default function Selectfield({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  error,
  className = "",
}: SelectFieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  const hasError = error && error !== "";

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="block text-[11px] font-semibold text-secondary/50">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`appearance-none transition-all duration-200 bg-white border rounded-lg py-1.5 w-full focus:outline-none text-[13px] text-gray-700 placeholder-gray-400 ps-3.5 pe-10 ${
            hasError
              ? "border-red-400 focus:ring-1 focus:ring-red-100"
              : "border-[#364B9B66] focus:ring-1 focus:ring-primary/10"
          } ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}`}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Dropdown arrow icon */}
        <div className="pointer-events-none absolute inset-y-0 end-3 flex items-center">
          <svg
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              isFocused ? "rotate-180" : ""
            } ${hasError ? "text-red-400" : "text-gray-400"}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {hasError && <p className="text-[10px] text-red-500 ps-1">{error}</p>}
    </div>
  );
}
