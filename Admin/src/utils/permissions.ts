export function permissionsBypassEnabled(): boolean {
  return import.meta.env.VITE_PERMISSIONS_BYPASS === 'true';
}

export function getAdminUser(): { permissions?: string[]; roleId?: string } | null {
  try {
    const raw = localStorage.getItem("adminUser");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAdminPermissions(): string[] {
  return getAdminUser()?.permissions ?? [];
}

export function getAdminRoleId(): string | undefined {
  return getAdminUser()?.roleId;
}

export function hasPermission(slug: string): boolean {
  if (permissionsBypassEnabled()) return true;
  const perms = getAdminPermissions();
  if (perms.includes("*")) return true;
  return perms.includes(slug);
}

export function hasAnyPermission(slugs: string[]): boolean {
  if (permissionsBypassEnabled()) return true;
  return slugs.some(s => hasPermission(s));
}

export function hasAllPermissions(slugs: string[]): boolean {
  if (permissionsBypassEnabled()) return true;
  return slugs.every(s => hasPermission(s));
}

export function isAdminOrSuperAdmin(): boolean {
  const roleId = getAdminRoleId();
  if (!roleId) return false;
  const ADMIN_ROLE_ID = import.meta.env.VITE_ADMINROLEID || "3C440A49-C079-479E-9747-53296DEC4D29";
  const SUPER_ADMIN_ROLE_ID = import.meta.env.VITE_SUPERADMINROLEID || "8B1FABC7-73AF-47F5-944C-3BA7FF049AAF";
  return roleId === ADMIN_ROLE_ID || roleId === SUPER_ADMIN_ROLE_ID;
}
