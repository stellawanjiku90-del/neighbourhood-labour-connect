import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

/**
 * Role-based route guard.
 * Renders child routes only if the current user's role is in `allow`.
 * Otherwise redirects to the home dashboard (which is role-specific).
 */
export default function RoleGuard({ allow }) {
  const { user, isLoadingAuth } = useAuth();
  const location = useLocation();

  if (isLoadingAuth) {
    return null;
  }

  // Default to customer role if not set (matches UserProfile entity default)
  const userRole = user?.role || "customer";
  if (!user || !allow.includes(userRole)) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}