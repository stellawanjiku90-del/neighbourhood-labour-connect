import { Navigate } from "react-router-dom";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

/**
 * Route guard backed by Firebase auth state.
 * Redirects unauthenticated users to /firebase-auth and shows a
 * loading spinner while the onAuthStateChanged listener resolves.
 */
export default function FirebaseRouteGuard({ children }) {
  const { user, loading } = useFirebaseAuth();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/firebase-auth" replace />;
  }

  return children;
}