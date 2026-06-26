import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getFirebaseConfig, getMessagingToken } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Bell, Check, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PushNotificationEnabler() {
  const { user } = useAuth();
  const [status, setStatus] = useState("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (typeof Notification === "undefined" || !("serviceWorker" in navigator)) {
        setStatus("unsupported");
        return;
      }
      if (!user?.id) {
        setStatus("notprovider");
        return;
      }
      try {
        const providers = await base44.entities.ServiceProvider.filter(
          { created_by_id: user.id },
          null,
          1
        );
        if (providers.length === 0) {
          setStatus("notprovider");
          return;
        }
        if (Notification.permission === "granted") setStatus("granted");
        else if (Notification.permission === "denied") setStatus("denied");
        else setStatus("provider");
      } catch {
        setStatus("notprovider");
      }
    })();
  }, [user]);

  const enable = async () => {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus("denied");
        return;
      }

      const config = await getFirebaseConfig();

      const swReg = await navigator.serviceWorker.register(
        `/firebase-messaging-sw.js?apiKey=${encodeURIComponent(
          config.apiKey
        )}&authDomain=${encodeURIComponent(config.authDomain)}&projectId=${encodeURIComponent(
          config.projectId
        )}&messagingSenderId=${encodeURIComponent(
          config.messagingSenderId
        )}&appId=${encodeURIComponent(config.appId)}`,
        { scope: "/" }
      );

      const token = await getMessagingToken(config.vapidKey, swReg);

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
      setStatus("granted");
    } catch (e) {
      console.error("Push registration failed:", e);
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading" || status === "notprovider" || status === "unsupported") {
    return null;
  }

  if (status === "granted") {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-2xl px-4 py-3 mb-6">
        <Check className="w-4 h-4 shrink-0" />
        <span>Notifications enabled — you'll be alerted to nearby jobs.</span>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-2xl px-4 py-3 mb-6">
        <BellOff className="w-4 h-4 shrink-0" />
        <span>Notifications are blocked. Enable them in your browser settings to get job alerts.</span>
      </div>
    );
  }

  return (
    <div className="bg-secondary/60 rounded-2xl p-4 flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
        <Bell className="w-5 h-5 text-secondary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">Get instant job alerts</p>
        <p className="text-xs text-muted-foreground">
          Be notified the moment a customer posts a job near you.
        </p>
      </div>
      <Button
        onClick={enable}
        disabled={busy}
        size="sm"
        className="bg-[#2D7A3E] hover:bg-[#246332] rounded-xl shrink-0"
      >
        {busy ? "Enabling…" : "Enable"}
      </Button>
    </div>
  );
}