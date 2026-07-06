/**
 * Permissions utilities.
 *
 * AUTHORIZATION DECISIONS must use context-injected permissions (from
 * AuthContext), not localStorage. The localStorage fallback here exists
 * only for backward compatibility during migration and will be removed.
 *
 * Display-only data (name, image, email) can still use localStorage since
 * it poses no privilege escalation risk.
 */

export function permissionsBypassEnabled(): boolean {
  return import.meta.env.VITE_PERMISSIONS_BYPASS === 'true';
}

/**
 * Get the admin user object from localStorage.
 * WARNING: Only use for DISPLAY purposes (name, image, email).
 * Do NOT use for authorization decisions — use AuthContext instead.
 */
export function getAdminUser(): { permissions?: string[]; roleId?: string; name?: string; image?: string; email?: string; id?: string } | null {
  try {
    const raw = localStorage.getItem("adminUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Get permissions from localStorage.
 * @deprecated Use AuthContext's hasPermission/hasAnyPermission instead.
 */
export function getAdminPermissions(): string[] {
  return getAdminUser()?.permissions ?? [];
}

/**
 * @deprecated Use AuthContext's roleId instead.
 */
export function getAdminRoleId(): string | undefined {
  return getAdminUser()?.roleId;
}

/**
 * Check if the given permission slugs are present.
 * Use the injected `permissions` array when available (from AuthContext).
 * Falls back to localStorage for backward compatibility.
 *
 * @param slug - Permission slug to check
 * @param permissions - Optional permissions array (prefer from AuthContext)
 */
export function hasPermission(slug: string, permissions?: string[]): boolean {
  if (permissionsBypassEnabled()) return true;
  const perms = permissions ?? getAdminPermissions();
  if (perms.includes("*")) return true;
  return perms.includes(slug);
}

/**
 * Check if any of the given permission slugs are present.
 *
 * @param slugs - Permission slugs to check
 * @param permissions - Optional permissions array (prefer from AuthContext)
 */
export function hasAnyPermission(slugs: string[], permissions?: string[]): boolean {
  if (permissionsBypassEnabled()) return true;
  return slugs.some((s) => hasPermission(s, permissions));
}

/**
 * Check if all of the given permission slugs are present.
 *
 * @param slugs - Permission slugs to check
 * @param permissions - Optional permissions array (prefer from AuthContext)
 */
export function hasAllPermissions(slugs: string[], permissions?: string[]): boolean {
  if (permissionsBypassEnabled()) return true;
  return slugs.every((s) => hasPermission(s, permissions));
}

/**
 * @deprecated Use AuthContext's isAdminOrSuperAdmin() instead.
 */
export function isAdminOrSuperAdmin(): boolean {
  const roleId = getAdminRoleId();
  if (!roleId) return false;
  const ADMIN_ROLE_ID = import.meta.env.VITE_ADMINROLEID || "3C440A49-C079-479E-9747-53296DEC4D29";
  const SUPER_ADMIN_ROLE_ID = import.meta.env.VITE_SUPERADMINROLEID || "8B1FABC7-73AF-47F5-944C-3BA7FF049AAF";
  return roleId === ADMIN_ROLE_ID || roleId === SUPER_ADMIN_ROLE_ID;
}
