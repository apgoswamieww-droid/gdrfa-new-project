import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState } from "../types/store.type";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      accessToken: null,
      data: null,
      fcmToken: null,
      currentLanguage: "en",
      setCurrentLanguage: (currentLanguage: string) =>
        set(() => ({ currentLanguage: currentLanguage })),

      setFCMToken: (fcmToken) => set(() => ({ fcmToken: fcmToken })),
      setUser: (user) => set(() => ({ user: user })),
      setToken: (token) => set(() => ({ token: token })),
      setAccessToken: (accessToken) =>
        set(() => ({ accessToken: accessToken })),
      removeAll: () =>
        set(() => ({ token: null, user: null, accessToken: null, data: null })),

    }),
    {
      name: "auth",
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
