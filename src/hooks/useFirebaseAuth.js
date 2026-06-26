import { useEffect, useState } from "react";
import { subscribeAuthState } from "@/lib/firebase";

/**
 * Subscribes to Firebase auth state via onAuthStateChanged.
 * Returns { user, loading, error }.
 * The Firebase user object is the single source of truth for the session.
 */
export function useFirebaseAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsub = () => {};
    let active = true;

    subscribeAuthState((u) => {
      if (!active) return;
      setUser(u);
      setLoading(false);
    })
      .then((u) => {
        unsub = u || (() => {});
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  return { user, loading, error };
}