import type { InputHTMLAttributes } from "react";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
}

const SearchInput = ({ placeholder, ...props }: SearchInputProps) => {
  return (
    <div className="flex items-center gap-2 bg-white border border-[#364B9B66] rounded-full px-4 xl:py-3.5 py-2.5 w-full max-w-65 xl:max-w-80 2xl:max-w-96">
      <svg
        className="xl:w-5 w-4 xl:h-5 h-4 shrink-0"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_search)">
          <path
            d="M14.582 14.583L18.332 18.333"
            stroke="#0A2240"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.668 9.16699C16.668 5.02486 13.3101 1.66699 9.16797 1.66699C5.02584 1.66699 1.66797 5.02486 1.66797 9.16699C1.66797 13.3092 5.02584 16.667 9.16797 16.667C13.3101 16.667 16.668 13.3092 16.668 9.16699Z"
            stroke="#0A2240"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
        <defs>
          <clipPath id="clip0_search">
            <rect width="20" height="20" fill="white" />
          </clipPath>
        </defs>
      </svg>
      <input
        {...props}
        type="text"
        className="bg-transparent text-sm text-secondary/60 placeholder-secondary/60 outline-none w-full"
        placeholder={placeholder}
      />
    </div>
  );
};

export default SearchInput;
