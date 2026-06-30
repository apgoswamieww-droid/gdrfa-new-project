// src/component/Input/CheckboxField.tsx

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export default function CheckboxField({
  label,
  checked,
  onChange,
  required = false,
  disabled = false,
  error,
  className = "",
}: CheckboxFieldProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className={`flex items-center gap-2.5 cursor-pointer group
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>

        <div className="relative mt-0.5 shrink-0 w-4 h-4">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            required={required}
            className="sr-only peer w-4 h-4"
          />
          {/* Custom checkbox box */}
          <div className={`
            w-4 h-4 rounded-md border transition-all duration-200
            flex items-center justify-center
            peer-focus-visible:ring-2 peer-focus-visible:ring-[#364B9B44]
            ${checked
              ? "border-primary bg-primary"
              : "border-[#364B9B66] bg-white group-hover:border-primary"
            }
          `}>
            {/* Checkmark */}
            {checked && (
              <svg width="9" height="7" viewBox="0 0 11 9" fill="none">
                <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>

        <span className={`text-[13px] font-medium leading-snug transition-colors
          ${checked ? "text-primary" : "text-gray-600 group-hover:text-gray-800"}`}>
          {label}
          {required && <span className="text-red-500 ms-0.5">*</span>}
        </span>
      </label>

      {error && <p className="text-xs text-red-500 ps-1">{error}</p>}
    </div>
  );
}