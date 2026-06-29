import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getFirebaseConfig, getMessagingToken } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Bell, MapPin, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const ONBOARDED_KEY = "nlc_permissions_onboarded";

/**
 * One-time prompt shown immediately on first authenticated access asking
 * the user to grant push-notification and location permissions. A user
 * gesture (the "Allow" button) triggers both requests so browsers accept
 * them. Completion is recorded in localStorage so it never re-appears.
 */
export default function OnboardingPermissions() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    if (localStorage.getItem(ONBOARDED_KEY) === "done") return;
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [isAuthenticated, user?.id]);

  const finish = () => {
    localStorage.setItem(ONBOARDED_KEY, "done");
    setOpen(false);
  };

  const allow = async () => {
    setBusy(true);
    try {
      // 1. Push notifications — register FCM token for this device
      if (typeof Notification !== "undefined" && "serviceWorker" in navigator) {
        if (Notification.permission === "default") {
          await Notification.requestPermission();
        }
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
      // 2. Location — trigger the browser permission prompt now so later
      //    flows (post job, track provider) work without a second ask.
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {},
          () => {},
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      }
    } finally {
      setBusy(false);
      finish();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 relative">
        <button
          onClick={finish}
          className="absolute top-3 right-3 text-muted-foreground hover:opacity-70"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-extrabold text-foreground mb-1">
          Enable permissions
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Allow notifications and location so you never miss job alerts and
          providers can find you quickly.
        </p>
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Bell className="w-4 h-4 text-[#2D7A3E]" /> Job alerts &amp; subscription reminders
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground">
            <MapPin className="w-4 h-4 text-[#2D7A3E]" /> Faster location for posting &amp; tracking
          </div>
        </div>
        <Button
          onClick={allow}
          disabled={busy}
          className="w-full h-11 rounded-xl bg-[#2D7A3E] hover:bg-[#246332]"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Allow"}
        </Button>
        <button
          onClick={finish}
          className="w-full text-center text-sm text-muted-foreground mt-3"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}