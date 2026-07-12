import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

/**
 * Route guard backed by Firebase auth state + UserProfile.
 * Redirects to /firebase-auth when:
 *   - the Firebase session is absent
 *   - the profile is not yet completed
 *   - the per-session PIN has not been entered
 */
export default function FirebaseRouteGuard() {
  const { user, isLoadingAuth, isAuthenticated, pinVerified } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/firebase-auth" replace />;
  }

  if (!user.profile_completed) {
    return <Navigate to="/firebase-auth" replace />;
  }

  if (!pinVerified) {
    return <Navigate to="/firebase-auth" replace />;
  }

  return <Outlet />;
}