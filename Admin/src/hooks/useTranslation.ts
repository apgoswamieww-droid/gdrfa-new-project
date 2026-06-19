import { useLanguage } from "../context/LanguageContext";
import { translations } from "../locales/translations";

export const useTranslation = () => {
  const { language } = useLanguage();
  
  // A simple helper to access nested objects using dot notation (optional, but good for scalability)
  // For now, let's keep it simple and return the whole object for the current language
  const t = translations[language] || translations.en;

  return { t, language };
};
