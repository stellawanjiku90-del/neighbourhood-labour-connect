import { createContext, useState, useContext, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { appParams } from "@/lib/app-params";
import { createAxiosClient } from "@base44/sdk/dist/utils/axios-client";
import { subscribeAuthState, signOutFirebase } from "@/lib/firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  // ─── Check app public settings (for app configuration) ──────────
  useEffect(() => {
    checkAppState();
  }, []);

  // ─── Subscribe to Firebase auth state ──────────────────────────
  // The Firebase user object is the single source of truth for the
  // session. When a Firebase user is present, we fetch the matching
  // UserProfile and merge them into the `user` value consumed by
  // the rest of the app via useAuth().
  useEffect(() => {
    let active = true;
    let unsub = () => {};

    subscribeAuthState(async (firebaseUser) => {
      if (!active) return;

      if (firebaseUser) {
        const phone = firebaseUser.phoneNumber;
        try {
          const { data } = await base44.functions.invoke("getUserProfile", {
            phone,
          });
          const profile = data?.profile;
          setUser({
            id: firebaseUser.uid,
            full_name: profile
              ? `${profile.first_name || ""} ${profile.surname || ""}`.trim()
              : phone,
            phone,
            role: "user",
            profile,
            profile_completed: profile?.profile_completed || false,
          });
        } catch (e) {
          // Profile fetch failed — still mark as authenticated with Firebase user only
          setUser({
            id: firebaseUser.uid,
            full_name: phone,
            phone,
            role: "user",
            profile: null,
            profile_completed: false,
          });
        }
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoadingAuth(false);
      setAuthChecked(true);
    })
      .then((u) => {
        unsub = u || (() => {});
      })
      .catch(() => {
        if (!active) return;
        setIsLoadingAuth(false);
        setAuthChecked(true);
      });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: {
          "X-App-Id": appParams.appId,
        },
        token: appParams.token,
        interceptResponses: true,
      });

      try {
        const publicSettings = await appClient.get(
          `/prod/public-settings/by-id/${appParams.appId}`
        );
        setAppPublicSettings(publicSettings);
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === "auth_required") {
            setAuthError({ type: "auth_required", message: "Authentication required" });
          } else if (reason === "user_not_registered") {
            setAuthError({
              type: "user_not_registered",
              message: "User not registered for this app",
            });
          } else {
            setAuthError({ type: reason, message: appError.message });
          }
        } else {
          setAuthError({
            type: "unknown",
            message: appError.message || "Failed to load app",
          });
        }
        setIsLoadingPublicSettings(false);
      }
    } catch (error) {
      setAuthError({
        type: "unknown",
        message: error.message || "An unexpected error occurred",
      });
      setIsLoadingPublicSettings(false);
    }
  };

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem("pin_verified");
    try {
      await signOutFirebase();
    } catch (e) {
      // ignore sign-out errors
    }
    if (shouldRedirect) {
      window.location.href = "/firebase-auth";
    }
  };

  const navigateToLogin = () => {
    window.location.href = "/firebase-auth";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};