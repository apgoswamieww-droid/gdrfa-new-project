import { Navigate, useLocation } from "react-router-dom";
import { hasAnyPermission } from "../../utils/permissions";
import { matchRoutePermission } from "../../utils/routePermissions";
import { useAuth } from "../../context/AuthContext";

const NO_ACCESS_PATHS = ["/login", "/register", "/forgot-password", "/"];

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { permissions: authPermissions } = useAuth();

  if (NO_ACCESS_PATHS.includes(location.pathname)) {
    return <>{children}</>;
  }

  const required = matchRoutePermission(location.pathname);
  if (required.length === 0) return <>{children}</>;

  // Use AuthContext permissions (from server response), not localStorage
  if (!hasAnyPermission(required, authPermissions)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
