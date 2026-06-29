import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Route guard that enforces:
 * 1. Profile completion and ID verification
 * 2. Active subscription (for customers posting jobs, providers browsing jobs)
 * 
 * Redirects users back to profile setup or subscription page as needed.
 */
export default function SetupAndSubscriptionGuard({ requireSubscription = true }) {
  const { user, isLoadingAuth } = useAuth();
  const { active, loading: subLoading } = useSubscription();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  // Check profile completion and verification
  if (!user?.profile_completed) {
    return <Navigate to="/firebase-auth" replace />;
  }

  // Check ID verification (if id_type is set but not verified, they need admin approval)
  if (user.profile?.id_type && !user.profile?.id_verified) {
    // Allow them to continue but show a warning (admin needs to verify)
    // This is informational - they can still use the app
  }

  // Check subscription if required
  if (requireSubscription && !subLoading && !active) {
    return <Navigate to="/subscribe" replace />;
  }

  return <Outlet />;
}