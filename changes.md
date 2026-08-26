# Build Fixes

## 1. `src/component/Sidebar/sidebar.tsx` — Line 275
**Error:** `Cannot find name 'clearAdminUser'`
**Fix:** Added `clearAdminUser` to the `useAuth()` destructuring.
```ts
const { permissions: authPermissions, isAdminOrSuperAdmin: authIsAdminOrSuperAdmin, clearAdminUser } = useAuth();
```

## 2. `src/component/Sidebar/sidebar.tsx` — Line 361
**Error:** `Argument of type '() => boolean' is not assignable to parameter of type 'boolean'`
**Fix:** Called `authIsAdminOrSuperAdmin()` as a function instead of passing the function reference.
```ts
const filteredNavItems = filterNavItems(navItems, authPermissions, authIsAdminOrSuperAdmin());
```

## 3. `src/pages/Participants/ParticipantsTable.tsx` — Line 33
**Error:** `'EvaluationIcon' is declared but its value is never read`
**Fix:** Removed the unused `EvaluationIcon` component (its usage was already commented out).

## 4. `src/pages/Participants/ManageParticipants.tsx` — Lines 105, 138
**Error:** `Property 'onEvaluate' does not exist on type` / `'handleEvaluate' is declared but its value is never read`
**Fix:** Removed the `onEvaluate` prop from `<ParticipantsTable>` and removed the unused `handleEvaluate` function.

---

# Session Refresh Fix ("Access Denied" on page refresh)

## Root Cause
On page refresh, `restoreSession()` calls `/api/admin/me`. If the backend doesn't return `permissions`/`roleId` in its response, the user is set up with empty permissions, causing `ProtectedRoute` to show **"Access Denied"**.

## 5. `src/auth/Login.tsx` — Lines 107-111
**Fix:** Store permissions and roleId in `sessionStorage` (cleared on tab close, safer than `localStorage`).
```ts
sessionStorage.setItem("adminSession", JSON.stringify({
  permissions: admin.permissions,
  roleId: admin.roleId,
}));
```

## 6. `src/context/AuthContext.tsx` — `clearAdminUser()`
**Fix:** Clear `sessionStorage` on logout.
```ts
sessionStorage.removeItem("adminSession");
```

## 7. `src/context/AuthContext.tsx` — `restoreSession()`
**Fix:** If `/api/admin/me` doesn't return permissions/roleId, fall back to `sessionStorage` (saved at login time).
```ts
if (!permissions.length || !roleId) {
  const cached = sessionStorage.getItem("adminSession");
  if (cached) {
    const parsed = JSON.parse(cached);
    if (!permissions.length && Array.isArray(parsed.permissions)) permissions = parsed.permissions;
    if (!roleId && parsed.roleId) roleId = parsed.roleId;
  }
}
```
