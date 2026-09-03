import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { hasAnyPermission, hasPermission } from "../../utils/permissions";
import { matchRoutePermission } from "../../utils/routePermissions";
import { useAuth } from "../../context/AuthContext";

const NO_ACCESS_PATHS = ["/login", "/register", "/forgot-password", "/"];

const SUPER_ADMIN_ROLE_ID =
  import.meta.env.VITE_SUPERADMINROLEID || "8B1FABC7-73AF-47F5-944C-3BA7FF049AAF";

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

function AccessDenied() {
  const navigate = useNavigate();
  const { permissions: authPermissions, clearAdminUser } = useAuth();
  const canViewDashboard = hasPermission("view-dashboard", authPermissions);
  const hasAnyNavPermission = authPermissions.length > 0 && authPermissions.some(p => p !== "can-login");

  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center max-w-md px-6">
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <ShieldIcon />
        </div>
        <h2 className="text-2xl font-bold text-secondary mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-6 leading-relaxed">
          You don't have permission to access this page.
          {!hasAnyNavPermission ? " Your account does not have any admin module permissions." : ""}
        </p>
        <p className="text-sm text-gray-400 mb-8">
          Please contact your administrator if you believe you should have access.
        </p>
        <div className="flex items-center justify-center gap-3">
          {canViewDashboard && (
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2.5 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Go to Dashboard
            </button>
          )}
          <button
            onClick={() => {
              clearAdminUser();
              navigate("/login", { replace: true });
            }}
            className="px-5 py-2.5 bg-gray-100 text-secondary font-semibold text-sm rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { permissions: authPermissions, roleId: authRoleId } = useAuth();

  if (NO_ACCESS_PATHS.includes(location.pathname)) {
    return <>{children}</>;
  }

  const required = matchRoutePermission(location.pathname);
  if (required.length === 0) return <>{children}</>;

  // Restrict super-admin-only modules (e.g. Social Links) to Super Admin only
  if (location.pathname === "/cms/social-links" && authRoleId !== SUPER_ADMIN_ROLE_ID) {
    return <AccessDenied />;
  }

  // Use AuthContext permissions (from server response), not localStorage
  if (!hasAnyPermission(required, authPermissions)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
