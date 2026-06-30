export interface AuthState {
  user: any | null;
  token: string | null;
  accessToken: string | null;
  fcmToken: string | null;
  currentLanguage: "ar" | "en" | string;
  setCurrentLanguage: (currentLanguage: string) => void;
  setFCMToken: (fcmToken: any | null) => void;
  setUser: (user: any | null) => void;
  setToken: (token: string | null | undefined) => void;
  setAccessToken: (accessToken: string | null | undefined) => void;
  removeAll: () => void;
}
