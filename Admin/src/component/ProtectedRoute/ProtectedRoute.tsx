import { Navigate, useLocation } from "react-router-dom";
import { hasAnyPermission } from "../../utils/permissions";
import { matchRoutePermission } from "../../utils/routePermissions";

const NO_ACCESS_PATHS = ["/login", "/register", "/forgot-password", "/"];

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  if (NO_ACCESS_PATHS.includes(location.pathname)) {
    return <>{children}</>;
  }

  const required = matchRoutePermission(location.pathname);
  if (required.length === 0) return <>{children}</>;

  if (!hasAnyPermission(required)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
