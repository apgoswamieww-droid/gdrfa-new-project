/**
 * AuthContext
 * ============
 * Stores the authenticated user's permissions, roleId, and profile info
 * in React context — derived from the login API response, NOT from
 * localStorage. This prevents privilege escalation attacks where a user
 * modifies localStorage.getItem("adminUser") to gain unauthorized access.
 *
 * The JWT token is still stored in localStorage (needed for the
 * Authorization header), but all authorization decisions (permissions,
 * role checks) use the context values set at login time.
 */

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { apiRequest } from "../api/request";

// ─── Types ───────────────────────────────────────────────────────────

export interface AdminUser {
  id?: string;
  name?: string;
  email?: string;
  image?: string | null;
  mobile?: string;
  phone?: string;
  roleId?: string;
  permissions?: string[];
}

interface AuthContextValue {
  /** The authenticated admin user (null when not logged in). */
  adminUser: AdminUser | null;
  /** Shortcut to adminUser.permissions. */
  permissions: string[];
  /** Shortcut to adminUser.roleId. */
  roleId: string | undefined;
  /** True when the user has the wildcard '*' permission. */
  isSuperUser: boolean;
  /** Check if the user has a specific permission slug. */
  hasPermission: (slug: string) => boolean;
  /** Check if the user has any of the given permission slugs. */
  hasAnyPermission: (slugs: string[]) => boolean;
  /** Check if the user has all of the given permission slugs. */
  hasAllPermissions: (slugs: string[]) => boolean;
  /** Check if roleId matches ADMIN_ROLEID or SUPERADMINROLEID. */
  isAdminOrSuperAdmin: () => boolean;
  /** Update the auth context after login. */
  setAdminUser: (user: AdminUser) => void;
  /** Clear the auth context on logout. */
  clearAdminUser: () => void;
  /** Restore session from server on page load (calls /api/admin/me). */
  restoreSession: () => Promise<void>;
}

// ─── Constants ───────────────────────────────────────────────────────

const ADMIN_ROLE_ID =
  import.meta.env.VITE_ADMINROLEID || "3C440A49-C079-479E-9747-53296DEC4D29";
const SUPER_ADMIN_ROLE_ID =
  import.meta.env.VITE_SUPERADMINROLEID || "8B1FABC7-73AF-47F5-944C-3BA7FF049AAF";

// ─── Context ─────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUserState] = useState<AdminUser | null>(null);

  const setAdminUser = useCallback((user: AdminUser) => {
    setAdminUserState(user);
  }, []);

  const clearAdminUser = useCallback(() => {
    setAdminUserState(null);
    sessionStorage.removeItem("adminSession");
  }, []);

  /**
   * Restore the user session from the server on page load.
   * Calls /api/admin/me which returns the authenticated user's
   * profile and permissions — verified server-side via JWT + CIAM.
   * This is the secure alternative to reading spoofable localStorage.
   */
  const restoreSession = useCallback(async (): Promise<void> => {
    try {
      const response = await apiRequest({ url: "/api/admin/me", method: "GET" });
      if (response?.status && response?.data) {
        let permissions = Array.isArray(response.data.permissions) ? response.data.permissions : [];
        let roleId = response.data.roleId;

        // If API didn't return permissions/roleId, fall back to sessionStorage
        // (populated at login time). This handles backends where /api/admin/me
        // omits these fields but the login endpoint provides them.
        if (!permissions.length || !roleId) {
          try {
            const cached = sessionStorage.getItem("adminSession");
            if (cached) {
              const parsed = JSON.parse(cached);
              if (!permissions.length && Array.isArray(parsed.permissions)) {
                permissions = parsed.permissions;
              }
              if (!roleId && parsed.roleId) {
                roleId = parsed.roleId;
              }
            }
          } catch { /* ignore */ }
        }

        setAdminUserState({
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          roleId,
          image: response.data.image,
          permissions,
        });

        // Sync only display-safe fields to localStorage for Topbar/Profile use
        try {
          const existing = localStorage.getItem("adminUser");
          const parsed = existing ? JSON.parse(existing) : {};
          localStorage.setItem("adminUser", JSON.stringify({
            ...parsed,
            id: response.data.id,
            name: response.data.name,
            email: response.data.email,
            image: response.data.image,
            // ⚠️ Do NOT store permissions/roleId in localStorage — they come from the server
          }));
        } catch { /* ignore localStorage write errors */ }
      }
    } catch {
      // Session not valid — user stays null, App.tsx will redirect to login
      setAdminUserState(null);
    }
  }, []);

  const permissions = useMemo(() => adminUser?.permissions ?? [], [adminUser]);
  const roleId = adminUser?.roleId;
  const isSuperUser = permissions.includes("*");

  const hasPermission = useCallback(
    (slug: string): boolean => {
      if (isSuperUser) return true;
      return permissions.includes(slug);
    },
    [permissions, isSuperUser]
  );

  const hasAnyPermission = useCallback(
    (slugs: string[]): boolean => {
      if (isSuperUser) return true;
      return slugs.some((s) => permissions.includes(s));
    },
    [permissions, isSuperUser]
  );

  const hasAllPermissions = useCallback(
    (slugs: string[]): boolean => {
      if (isSuperUser) return true;
      return slugs.every((s) => permissions.includes(s));
    },
    [permissions, isSuperUser]
  );

  const isAdminOrSuperAdmin = useCallback((): boolean => {
    if (!roleId) return false;
    return roleId === ADMIN_ROLE_ID || roleId === SUPER_ADMIN_ROLE_ID;
  }, [roleId]);

  const value = useMemo<AuthContextValue>(
    () => ({
      adminUser,
      permissions,
      roleId,
      isSuperUser,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      isAdminOrSuperAdmin,
      setAdminUser,
      clearAdminUser,
      restoreSession,
    }),
    [
      adminUser,
      permissions,
      roleId,
      isSuperUser,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      isAdminOrSuperAdmin,
      setAdminUser,
      clearAdminUser,
      restoreSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() must be used within an <AuthProvider>");
  }
  return ctx;
}
