import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../store/store";

const LanguageToggle: React.FC = () => {
  const { currentLanguage, setCurrentLanguage } = useAuthStore();
  const { i18n } = useTranslation();

  useEffect(() => {
    const normalizedLanguage = currentLanguage === "ar" ? "ar" : "en";
    document.documentElement.dir = normalizedLanguage === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = normalizedLanguage;
    i18n.changeLanguage(normalizedLanguage);
  }, [currentLanguage, i18n]);

  const handleLanguageToggle = () => {
    const newLang = currentLanguage === "ar" ? "en" : "ar";
    localStorage.setItem("gdrfa-language", newLang);
    i18n.changeLanguage(newLang);
    setCurrentLanguage(newLang);
  };

  return (
    <label className="flex items-center xl:gap-2 gap-1 cursor-pointer w-fit xl:me-4">
      <svg
        className="md:w-6 w-5 md:h-6 h-5 rtl:-scale-x-100"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.02231 16.9777C7.07674 18.6978 7.26397 19.7529 7.90796 20.5376C8.07418 20.7401 8.25989 20.9258 8.46243 21.092C9.56878 22 11.2125 22 14.5 22C17.7875 22 19.4312 22 20.5376 21.092C20.7401 20.9258 20.9258 20.7401 21.092 20.5376C22 19.4312 22 17.7875 22 14.5C22 11.2125 22 9.56878 21.092 8.46243C20.9258 8.25989 20.7401 8.07418 20.5376 7.90796C19.7563 7.26676 18.707 7.07837 17 7.02303M7.02231 16.9777C5.30217 16.9233 4.24713 16.736 3.46243 16.092C3.25989 15.9258 3.07418 15.7401 2.90796 15.5376C2 14.4312 2 12.7875 2 9.5C2 6.21252 2 4.56878 2.90796 3.46243C3.07418 3.25989 3.25989 3.07418 3.46243 2.90796C4.56878 2 6.21252 2 9.5 2C12.7875 2 14.4312 2 15.5376 2.90796C15.7401 3.07418 15.9258 3.25989 16.092 3.46243C16.736 4.24713 16.9233 5.30217 16.9777 7.02231M7.02231 16.9777L17 7.02303"
          stroke="#161616"
          strokeWidth="1.5"
        />
        <path
          d="M10.8368 5.60001C11.039 5.76026 11.2151 5.9806 11.3652 6.26104C11.5217 6.5348 11.6 6.77518 11.6 6.98217C11.6 7.22922 11.5348 7.54972 11.4043 7.94367C11.2804 8.33094 11.1434 8.63475 10.9934 8.85509C10.8107 9.04205 10.5172 9.22233 10.1128 9.39594C9.70838 9.56954 9.25505 9.70976 8.75279 9.81659C8.25054 9.91675 7.77112 9.96683 7.31452 9.96683C6.53179 9.96683 5.91538 9.82327 5.46531 9.53616C5.02176 9.24236 4.79999 8.8384 4.79999 8.32426C4.95653 7.8769 5.162 7.45958 5.41639 7.07231C5.6773 6.67836 6.02301 6.26438 6.45351 5.83037L6.63941 6.69171C6.31327 6.93209 5.9904 7.2192 5.67078 7.55306C5.84037 7.86688 6.10454 8.0939 6.4633 8.23412C6.82205 8.37434 7.31126 8.44445 7.93092 8.44445C8.45275 8.44445 8.97457 8.39771 9.49639 8.30423C10.0247 8.20408 10.4683 8.07721 10.827 7.92364C10.6314 7.58978 10.2791 7.20585 9.77035 6.77184L10.8368 5.60001ZM8.03855 12C7.81025 11.8197 7.58195 11.5326 7.35366 11.1387L8.26358 10.5177L8.40056 10.748C8.5832 11.0552 8.73649 11.2889 8.86042 11.4491L8.03855 12Z"
          fill="#7A2530"
        />
        <path
          d="M13 19L13.8333 17M13.8333 17L15.5 13L17.1667 17M13.8333 17H17.1667M18 19L17.1667 17"
          stroke="#7A2530"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <input type="checkbox" id="lang-toggle" className="sr-only peer" onClick={handleLanguageToggle} />
      <span
        className="selected-language font-bold text-primary sm:text-sm text-xs font-just lg:ps-2 ps-1 md:block hidden relative before:content-[''] before:absolute before:top-1/2 before:-translate-y-1/2 before:-start-0 before:w-[1px] before:h-[0.4rem] before:bg-primary"
        id="toggle-label"
      >
        {currentLanguage === "ar" ? "العربية" : "English"}
      </span>
    </label>
  );
};

export default LanguageToggle;
