/**
 * Permissions utilities.
 *
 * AUTHORIZATION DECISIONS must use context-injected permissions (from
 * AuthContext), not localStorage. The localStorage fallback has been
 * removed to prevent privilege escalation via localStorage manipulation.
 *
 * Display-only data (name, image, email) can still use localStorage since
 * it poses no privilege escalation risk.
 */

/**
 * Get the admin user object from localStorage.
 * WARNING: Only use for DISPLAY purposes (name, image, email).
 * Do NOT use for authorization decisions — use AuthContext instead.
 */
export function getAdminUser(): { name?: string; image?: string; email?: string; id?: string } | null {
  try {
    const raw = localStorage.getItem("adminUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Check if the given permission slugs are present.
 * REQUIRES a permissions array — does NOT fall back to localStorage.
 *
 * @param slug - Permission slug to check
 * @param permissions - Permissions array (must be from AuthContext or API)
 */
export function hasPermission(slug: string, permissions: string[]): boolean {
  if (permissions.includes("*")) return true;
  return permissions.includes(slug);
}

/**
 * Check if any of the given permission slugs are present.
 *
 * @param slugs - Permission slugs to check
 * @param permissions - Permissions array (must be from AuthContext or API)
 */
export function hasAnyPermission(slugs: string[], permissions: string[]): boolean {
  return slugs.some((s) => hasPermission(s, permissions));
}

/**
 * Check if all of the given permission slugs are present.
 *
 * @param slugs - Permission slugs to check
 * @param permissions - Permissions array (must be from AuthContext or API)
 */
export function hasAllPermissions(slugs: string[], permissions: string[]): boolean {
  return slugs.every((s) => hasPermission(s, permissions));
}
