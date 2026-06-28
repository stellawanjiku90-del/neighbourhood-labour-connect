import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

/**
 * Role-based route guard.
 * Renders child routes only if the current user's role is in `allow`.
 * Otherwise redirects to the home dashboard (which is role-specific).
 */
export default function RoleGuard({ allow }) {
  const { user } = useAuth();

  if (!user || !allow.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}