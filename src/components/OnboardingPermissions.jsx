import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getFirebaseConfig, getMessagingToken } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Bell, MapPin, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Mandatory blocking modal that enforces both location and notification
 * permissions before the user can use the app. Checks actual browser
 * permission states (not localStorage) so it re-appears whenever a
 * permission is missing or has been revoked.
 */
export default function OnboardingPermissions() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notifPerm, setNotifPerm] = useState("loading");
  const [locPerm, setLocPerm] = useState("loading");

  const checkPermissions = async () => {
    // Notifications
    if (typeof Notification === "undefined") {
      setNotifPerm("unsupported");
    } else {
      setNotifPerm(Notification.permission);
    }

    // Location via Permissions API (falls back to "prompt" if unsupported)
    if (!navigator.geolocation) {
      setLocPerm("unsupported");
    } else if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" });
        setLocPerm(result.state);
      } catch {
        setLocPerm("prompt");
      }
    } else {
      setLocPerm("prompt");
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    checkPermissions();
  }, [isAuthenticated, user?.id]);

  // Open the modal if either permission is missing
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    if (notifPerm === "loading" || locPerm === "loading") return;
    const notifOk = notifPerm === "granted" || notifPerm === "unsupported";
    const locOk = locPerm === "granted" || locPerm === "unsupported";
    setOpen(!notifOk || !locOk);
  }, [isAuthenticated, user?.id, notifPerm, locPerm]);

  const allow = async () => {
    setBusy(true);
    try {
      // 1. Push notifications — request + register FCM token
      if (typeof Notification !== "undefined" && "serviceWorker" in navigator) {
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }
        setNotifPerm(Notification.permission);

        if (Notification.permission === "granted" && user?.id) {
          try {
            const config = await getFirebaseConfig();
            const swReg = await navigator.serviceWorker.register(
              `/firebase-messaging-sw.js?apiKey=${encodeURIComponent(config.apiKey)}&authDomain=${encodeURIComponent(config.authDomain)}&projectId=${encodeURIComponent(config.projectId)}&messagingSenderId=${encodeURIComponent(config.messagingSenderId)}&appId=${encodeURIComponent(config.appId)}`,
              { scope: "/" }
            );
            const token = await getMessagingToken(config.vapidKey, swReg);
            if (token) {
              const existing = await base44.entities.DeviceToken.filter({
                user_id: user.id,
                token,
              });
              if (existing.length === 0) {
                await base44.entities.DeviceToken.create({
                  user_id: user.id,
                  token,
                  platform: "web",
                });
              }
            }
          } catch (e) {
            console.error("Push registration failed:", e);
          }
        }
      }

      // 2. Location — trigger the browser permission prompt
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => setLocPerm("granted"),
          (err) => {
            if (err.code === err.PERMISSION_DENIED) setLocPerm("denied");
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const notifOk = notifPerm === "granted" || notifPerm === "unsupported";
  const locOk = locPerm === "granted" || locPerm === "unsupported";
  const anyDenied = notifPerm === "denied" || locPerm === "denied";

  const statusRow = (ok, denied, icon, grantedText, deniedText, promptText) => (
    <div
      className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2.5 ${
        ok
          ? "bg-emerald-50 text-emerald-700"
          : denied
          ? "bg-destructive/10 text-destructive"
          : "bg-secondary text-foreground"
      }`}
    >
      {ok ? (
        <Check className="w-4 h-4 shrink-0" />
      ) : denied ? (
        <AlertCircle className="w-4 h-4 shrink-0" />
      ) : (
        icon
      )}
      <span>{ok ? grantedText : denied ? deniedText : promptText}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6">
        <h2 className="text-lg font-extrabold text-foreground mb-1">
          Enable permissions to continue
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Location and notifications are required so you can post jobs, find
          nearby providers, and receive real-time alerts.
        </p>

        <div className="space-y-2 mb-5">
          {statusRow(
            notifOk,
            notifPerm === "denied",
            <Bell className="w-4 h-4 shrink-0" />,
            "Notifications enabled",
            "Notifications blocked — enable in browser settings",
            "Notifications — tap Allow below"
          )}
          {statusRow(
            locOk,
            locPerm === "denied",
            <MapPin className="w-4 h-4 shrink-0" />,
            "Location enabled",
            "Location blocked — enable in browser settings",
            "Location — tap Allow below"
          )}
        </div>

        {anyDenied && (
          <div className="bg-warning-soft rounded-xl p-3 mb-4">
            <p className="text-xs text-warning-soft-foreground">
              Some permissions are blocked in your browser settings. Open your
              browser's site settings, allow Location and Notifications for this
              site, then tap "Check again".
            </p>
          </div>
        )}

        <Button
          onClick={anyDenied ? checkPermissions : allow}
          disabled={busy}
          className="w-full h-11 rounded-xl bg-[#2D7A3E] hover:bg-[#246332]"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : anyDenied ? (
            "Check again"
          ) : (
            "Allow both"
          )}
        </Button>
      </div>
    </div>
  );
}