// src/component/Input/RadioGroup.tsx

interface RadioOption {
  label: string;
  value: string;
}

interface RadioGroupProps {
  label?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  required?: boolean;
  disabled?: boolean;
  error?: string;
  inline?: boolean; // true = horizontal, false = vertical
  className?: string;
}

export default function RadioGroup({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  error,
  inline = true,
  className = "",
}: RadioGroupProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="block text-[11px] font-semibold text-secondary/50">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className={`flex ${inline ? "flex-row flex-wrap gap-x-5 gap-y-1.5" : "flex-col gap-1.5"}`}>
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center gap-2 cursor-pointer group
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="relative flex items-center justify-center">
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                disabled={disabled}
                className="sr-only peer"
              />
              {/* Custom radio circle */}
              <div className={`
                w-4 h-4 rounded-full border transition-all duration-200
                flex items-center justify-center
                peer-focus-visible:ring-2 peer-focus-visible:ring-[#364B9B44]
                ${value === opt.value
                  ? "border-primary bg-white"
                  : "border-[#364B9B66] bg-white group-hover:border-primary"
                }
              `}>
                {value === opt.value && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
            </div>
            <span className={`text-[13px] font-medium transition-colors
              ${value === opt.value ? "text-primary" : "text-gray-600 group-hover:text-gray-800"}`}>
              {opt.label}
            </span>
          </label>
        ))}
      </div>

      {error && <p className="text-[10px] text-red-500 ps-1">{error}</p>}
    </div>
  );
}