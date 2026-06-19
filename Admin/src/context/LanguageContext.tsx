import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Language = "en" | "ar";

interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getStoredLanguage = (): Language => {
  const stored = localStorage.getItem("adminLanguage");
  return stored === "ar" ? "ar" : "en";
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  const isRTL = language === "ar";

  const applyLanguage = useCallback((lang: Language) => {
    const dir = lang === "ar" ? "rtl" : "ltr";
    const html = document.documentElement;
    html.setAttribute("dir", dir);
    html.setAttribute("lang", lang);
    localStorage.setItem("adminLanguage", lang);
  }, []);

  useEffect(() => {
    applyLanguage(language);
  }, [language, applyLanguage]);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === "en" ? "ar" : "en"));
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, isRTL, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
