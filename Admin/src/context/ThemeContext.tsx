import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

type ThemeContextType = {
  primaryColor: string;
  setPrimaryColor: (c: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getStoredPrimaryColor(): string {
  try {
    return localStorage.getItem("adminPrimaryColor") || "#7A2530";
  } catch {
    return "#7A2530";
  }
}

const PRESET_COLORS = [
  "#7A2530",
  "#1E40AF",
  "#059669",
  "#D97706",
  "#DC2626",
  "#7C3AED",
  "#0891B2",
  "#BE123C",
];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [primaryColor, setPrimaryColorState] = useState<string>(getStoredPrimaryColor);

  const applyPrimaryColor = useCallback((c: string) => {
    document.documentElement.style.setProperty("--primary", c);
    localStorage.setItem("adminPrimaryColor", c);
  }, []);

  const setPrimaryColor = useCallback((c: string) => {
    setPrimaryColorState(c);
    applyPrimaryColor(c);
  }, [applyPrimaryColor]);

  useEffect(() => {
    applyPrimaryColor(primaryColor);
  }, []);

  return (
    <ThemeContext.Provider value={{ primaryColor, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export { PRESET_COLORS };
