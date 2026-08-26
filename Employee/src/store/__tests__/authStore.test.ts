import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuthStore } from "../store";

describe("Auth Store – gdrfa-landing-page", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      data: null,
      fcmToken: null,
      currentLanguage: "en",
    });
  });

  // ── Initial State ──────────────────────────────────────────────────

  describe("initial state", () => {
    it("has null user", () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it("has null fcmToken", () => {
      expect(useAuthStore.getState().fcmToken).toBeNull();
    });

    it("has 'en' as default language", () => {
      expect(useAuthStore.getState().currentLanguage).toBe("en");
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
    it("clears user and data", () => {
      useAuthStore.getState().setUser({ id: "test", name: "Test" });

      useAuthStore.getState().removeAll();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.data).toBeNull();
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
    it("persists currentLanguage under 'auth' key", () => {
      useAuthStore.getState().setCurrentLanguage("ar");
      const raw = localStorage.getItem("auth");
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.state.currentLanguage).toBe("ar");
    });

    it("persists fcmToken", () => {
      useAuthStore.getState().setFCMToken("fcm-persisted");
      const parsed = JSON.parse(localStorage.getItem("auth")!);
      expect(parsed.state.fcmToken).toBe("fcm-persisted");
    });

    it("does NOT persist user", () => {
      const user = { id: "u1", name: "Persisted User" };
      useAuthStore.getState().setUser(user);
      const parsed = JSON.parse(localStorage.getItem("auth")!);
      expect(parsed.state.user).toBeUndefined();
    });
  });

  // ── Rehydration from localStorage ──────────────────────────────────

  describe("rehydration from localStorage", () => {
    it("rehydrates language and fcmToken from stored auth", async () => {
      localStorage.setItem(
        "auth",
        JSON.stringify({
          state: {
            currentLanguage: "ar",
            fcmToken: "hydrated-fcm",
          },
          version: 0,
        }),
      );

      vi.resetModules();
      const { useAuthStore: freshStore } = await import("../store");

      await new Promise((r) => setTimeout(r, 50));

      const state = freshStore.getState();
      expect(state.currentLanguage).toBe("ar");
      expect(state.fcmToken).toBe("hydrated-fcm");
      expect(state.user).toBeNull();
    });

    it("starts with defaults when localStorage has no auth key", async () => {
      localStorage.removeItem("auth");

      vi.resetModules();
      const { useAuthStore: freshStore } = await import("../store");

      await new Promise((r) => setTimeout(r, 50));

      const state = freshStore.getState();
      expect(state.user).toBeNull();
      expect(state.currentLanguage).toBe("en");
    });

    it("handles corrupted localStorage data gracefully", async () => {
      localStorage.setItem("auth", "invalid-json{{{");

      vi.resetModules();
      const { useAuthStore: freshStore } = await import("../store");

      await new Promise((r) => setTimeout(r, 50));

      const state = freshStore.getState();
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

    it("simulates login → user stored correctly", () => {
      useAuthStore.getState().setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.currentLanguage).toBe("en");
    });

    it("simulates logout → user/data cleared, language/fcm preserved", () => {
      useAuthStore.getState().setUser(mockUser);
      useAuthStore.getState().setCurrentLanguage("ar");
      useAuthStore.getState().setFCMToken("device-fcm-token");

      useAuthStore.getState().removeAll();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.data).toBeNull();
      expect(state.currentLanguage).toBe("ar");
      expect(state.fcmToken).toBe("device-fcm-token");
    });
  });
});
