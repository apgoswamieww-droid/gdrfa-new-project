import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "../store";

describe("Auth Store – gdrfa-landing-page", () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset store to initial defaults
    useAuthStore.setState({
      user: null,
      token: null,
      accessToken: null,
      fcmToken: null,
      currentLanguage: "en",
    });
  });

  // ── Initial State ──────────────────────────────────────────────────

  describe("initial state", () => {
    it("has null user", () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("has null token", () => {
      expect(useAuthStore.getState().token).toBeNull();
    });

    it("has null accessToken", () => {
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it("has null fcmToken", () => {
      expect(useAuthStore.getState().fcmToken).toBeNull();
    });

    it("has 'en' as default language", () => {
      expect(useAuthStore.getState().currentLanguage).toBe("en");
    });
  });

  // ── setToken ───────────────────────────────────────────────────────

  describe("setToken", () => {
    it("sets the token value", () => {
      const token = "eyJhbGciOiJIUzI1NiJ9.test-token";
      useAuthStore.getState().setToken(token);
      expect(useAuthStore.getState().token).toBe(token);
    });

    it("sets token to null", () => {
      useAuthStore.getState().setToken("some-token");
      useAuthStore.getState().setToken(null);
      expect(useAuthStore.getState().token).toBeNull();
    });

    it("handles undefined token", () => {
      useAuthStore.getState().setToken(undefined);
      expect(useAuthStore.getState().token).toBeUndefined();
    });
  });

  // ── setAccessToken ─────────────────────────────────────────────────

  describe("setAccessToken", () => {
    it("sets the accessToken value", () => {
      const accessToken = "eyJhbGciOiJIUzI1NiJ9.test-access";
      useAuthStore.getState().setAccessToken(accessToken);
      expect(useAuthStore.getState().accessToken).toBe(accessToken);
    });

    it("sets accessToken to null", () => {
      useAuthStore.getState().setAccessToken("some-token");
      useAuthStore.getState().setAccessToken(null);
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it("handles undefined accessToken", () => {
      useAuthStore.getState().setAccessToken(undefined);
      expect(useAuthStore.getState().accessToken).toBeUndefined();
    });
  });

  // ── setUser ────────────────────────────────────────────────────────

  describe("setUser", () => {
    const mockUser = {
      id: "ml687",
      name: "Amir Abdulla Mohamed Almulla",
      email: "cmamer@dnrd.ae",
      image: "/src/assets/images/avatar.jpg",
    };

    it("sets the user object", () => {
      useAuthStore.getState().setUser(mockUser);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it("clears user to null", () => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setUser(null);
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("stores all user properties", () => {
      useAuthStore.getState().setUser(mockUser);
      const user = useAuthStore.getState().user;
      expect(user.id).toBe("ml687");
      expect(user.name).toBe("Amir Abdulla Mohamed Almulla");
      expect(user.email).toBe("cmamer@dnrd.ae");
      expect(user.image).toBe("/src/assets/images/avatar.jpg");
    });
  });

  // ── setCurrentLanguage ─────────────────────────────────────────────

  describe("setCurrentLanguage", () => {
    it("sets language to Arabic", () => {
      useAuthStore.getState().setCurrentLanguage("ar");
      expect(useAuthStore.getState().currentLanguage).toBe("ar");
    });

    it("switches back to English", () => {
      useAuthStore.getState().setCurrentLanguage("ar");
      useAuthStore.getState().setCurrentLanguage("en");
      expect(useAuthStore.getState().currentLanguage).toBe("en");
    });

    it("accepts arbitrary language strings", () => {
      useAuthStore.getState().setCurrentLanguage("fr");
      expect(useAuthStore.getState().currentLanguage).toBe("fr");
    });
  });

  // ── setFCMToken ────────────────────────────────────────────────────

  describe("setFCMToken", () => {
    it("sets FCM token", () => {
      const fcm = "fcm-device-token-abc123";
      useAuthStore.getState().setFCMToken(fcm);
      expect(useAuthStore.getState().fcmToken).toBe(fcm);
    });

    it("clears FCM token to null", () => {
      useAuthStore.getState().setFCMToken("some-token");
      useAuthStore.getState().setFCMToken(null);
      expect(useAuthStore.getState().fcmToken).toBeNull();
    });
  });

  // ── removeAll ──────────────────────────────────────────────────────

  describe("removeAll", () => {
    it("clears token, user, accessToken, and data", () => {
      // Populate all fields
      useAuthStore.getState().setToken("test-token");
      useAuthStore.getState().setAccessToken("test-access");
      useAuthStore.getState().setUser({ id: "test", name: "Test" });

      // Reset
      useAuthStore.getState().removeAll();

      // Auth fields cleared
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.user).toBeNull();
    });

    it("does NOT clear currentLanguage", () => {
      useAuthStore.getState().setCurrentLanguage("ar");
      useAuthStore.getState().removeAll();
      expect(useAuthStore.getState().currentLanguage).toBe("ar");
    });

    it("does NOT clear fcmToken", () => {
      useAuthStore.getState().setFCMToken("persist-me");
      useAuthStore.getState().removeAll();
      expect(useAuthStore.getState().fcmToken).toBe("persist-me");
    });
  });

  // ── State Persistence (localStorage) ───────────────────────────────

  describe("persistence to localStorage", () => {
    it("persists token under 'auth' key", () => {
      useAuthStore.getState().setToken("persisted-token");
      const raw = localStorage.getItem("auth");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.state.token).toBe("persisted-token");
    });

    it("persists accessToken", () => {
      useAuthStore.getState().setAccessToken("persisted-access");
      const parsed = JSON.parse(localStorage.getItem("auth")!);
      expect(parsed.state.accessToken).toBe("persisted-access");
    });

    it("persists user", () => {
      const user = { id: "u1", name: "Persisted User" };
      useAuthStore.getState().setUser(user);
      const parsed = JSON.parse(localStorage.getItem("auth")!);
      expect(parsed.state.user).toEqual(user);
    });

    it("persists currentLanguage", () => {
      useAuthStore.getState().setCurrentLanguage("ar");
      const parsed = JSON.parse(localStorage.getItem("auth")!);
      expect(parsed.state.currentLanguage).toBe("ar");
    });

    it("persists fcmToken", () => {
      useAuthStore.getState().setFCMToken("fcm-persisted");
      const parsed = JSON.parse(localStorage.getItem("auth")!);
      expect(parsed.state.fcmToken).toBe("fcm-persisted");
    });

    it("persists removed state after removeAll", () => {
      useAuthStore.getState().setToken("some-token");
      useAuthStore.getState().removeAll();
      const parsed = JSON.parse(localStorage.getItem("auth")!);
      expect(parsed.state.token).toBeNull();
      expect(parsed.state.accessToken).toBeNull();
      expect(parsed.state.user).toBeNull();
    });
  });

  // ── Rehydration from localStorage ──────────────────────────────────

  describe("rehydration from localStorage", () => {
    it("rehydrates token, accessToken, user, and language from stored auth", async () => {
      // Simulate stored auth data (as if user had logged in previously)
      localStorage.setItem(
        "auth",
        JSON.stringify({
          state: {
            user: { id: "hydrated", name: "Hydrated User" },
            token: "hydrated-token",
            accessToken: "hydrated-access",
            currentLanguage: "ar",
            fcmToken: "hydrated-fcm",
          },
          version: 0,
        }),
      );

      // Reset modules so Zustand persist re-reads from localStorage
      vi.resetModules();
      const { useAuthStore: freshStore } = await import("../store");

      // Zustand persist rehydrates on next tick
      await new Promise((r) => setTimeout(r, 50));

      const state = freshStore.getState();
      expect(state.token).toBe("hydrated-token");
      expect(state.accessToken).toBe("hydrated-access");
      expect(state.user?.id).toBe("hydrated");
      expect(state.user?.name).toBe("Hydrated User");
      expect(state.currentLanguage).toBe("ar");
      expect(state.fcmToken).toBe("hydrated-fcm");
    });

    it("starts with defaults when localStorage has no auth key", async () => {
      localStorage.removeItem("auth");

      vi.resetModules();
      const { useAuthStore: freshStore } = await import("../store");

      await new Promise((r) => setTimeout(r, 50));

      const state = freshStore.getState();
      expect(state.token).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.user).toBeNull();
      expect(state.currentLanguage).toBe("en");
    });

    it("handles corrupted localStorage data gracefully", async () => {
      localStorage.setItem("auth", "invalid-json{{{");

      vi.resetModules();
      const { useAuthStore: freshStore } = await import("../store");

      await new Promise((r) => setTimeout(r, 50));

      // Should fall back to defaults
      const state = freshStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.currentLanguage).toBe("en");
    });
  });

  // ── Full Login/Logout Flow ─────────────────────────────────────────

  describe("full login / logout flow", () => {
    const mockUser = {
      id: "ml687",
      name: "Amir Abdulla Mohamed Almulla",
      email: "cmamer@dnrd.ae",
      image: "/src/assets/images/avatar.jpg",
    };
    const mockToken = "eyJhbGciOiJIUzI1NiJ9.real-jwt-token";

    it("simulates login → stored correctly", () => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setToken(mockToken);
      useAuthStore.getState().setAccessToken(mockToken);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.accessToken).toBe(mockToken);
      expect(state.currentLanguage).toBe("en");

      // Verify persistence
      const persisted = JSON.parse(localStorage.getItem("auth")!);
      expect(persisted.state.user).toEqual(mockUser);
      expect(persisted.state.token).toBe(mockToken);
    });

    it("simulates logout → auth cleared, language/fcm preserved", () => {
      // Login
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setToken(mockToken);
      useAuthStore.getState().setAccessToken(mockToken);
      useAuthStore.getState().setCurrentLanguage("ar");
      useAuthStore.getState().setFCMToken("device-fcm-token");

      // Logout
      useAuthStore.getState().removeAll();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.accessToken).toBeNull();
      // Preserved
      expect(state.currentLanguage).toBe("ar");
      expect(state.fcmToken).toBe("device-fcm-token");
    });
  });
});
