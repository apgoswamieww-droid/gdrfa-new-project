import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: any | null;
  data: any | null;
  fcmToken: string | null;
  currentLanguage: string;
  setCurrentLanguage: (currentLanguage: string) => void;
  setFCMToken: (fcmToken: any | null) => void;
  setUser: (user: any | null) => void;
  removeAll: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      data: null,
      fcmToken: null,
      currentLanguage: "en",
      setCurrentLanguage: (currentLanguage: string) =>
        set(() => ({ currentLanguage: currentLanguage })),

      setFCMToken: (fcmToken) => set(() => ({ fcmToken: fcmToken })),
      setUser: (user) => set(() => ({ user: user })),
      removeAll: () =>
        set(() => ({ user: null, data: null })),
    }),
    {
      name: "auth",
      // ⚠️ Only persist non-sensitive data to localStorage.
      // The `user` object (which may contain roles/permissions) is intentionally
      // excluded from persistence to prevent privilege escalation via localStorage
      // manipulation. Authorization decisions must be made server-side via JWT.
      partialize: (state) => ({
        currentLanguage: state.currentLanguage,
        fcmToken: state.fcmToken,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
        user: null, // Never restore user from localStorage — always fetch from server
        data: null,  // Never restore data from localStorage
      }),
      storage: {
        getItem: (name: string) => {
          const value = localStorage.getItem(name);
          if (value === null) return null;
          try {
            return JSON.parse(value);
          } catch {
            return null;
          }
        },
        setItem: (name: string, value: any) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name: string) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);

// useSplashStore.js
interface SplashState {
  showedSplashScreen: boolean;
  setShowedSplashScreen: (showedSplashScreen: boolean) => void;
}

const useSplashStore = create<SplashState>((set) => ({
  showedSplashScreen: false,

  setShowedSplashScreen: (showedSplashScreen) =>
    set({ showedSplashScreen: showedSplashScreen }),
}));

export default useSplashStore;
