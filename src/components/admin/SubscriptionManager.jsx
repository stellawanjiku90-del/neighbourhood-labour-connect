import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, Check, CreditCard } from "lucide-react";

export default function SubscriptionManager() {
  const [users, setUsers] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);

  const load = async () => {
    try {
      const [userProfiles, subscriptions] = await Promise.all([
        base44.entities.UserProfile.list("-created_date", 100),
        base44.entities.Subscription.filter({ status: "active" }, "-created_date", 100),
      ]);
      setUsers(userProfiles);
      setSubs(subscriptions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const activeByUser = {};
  subs.forEach((s) => {
    if (new Date(s.period_end) > new Date()) {
      activeByUser[s.user_id] = s;
    }
  });

  const activate = async (firebaseUid) => {
    setActivating(firebaseUid);
    try {
      await base44.functions.invoke("activateSubscription", { target_user_id: firebaseUid });
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setActivating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-3">Subscriptions</h2>
      <p className="text-xs text-muted-foreground mb-3">
        Activate a user's $1/month subscription after confirming payment. This also triggers referral commission payouts up to 3 levels.
      </p>
      <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden">
        {users.map((u) => {
          const sub = activeByUser[u.firebase_uid];
          return (
            <div key={u.id} className="flex items-center gap-3 px-5 py-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold">
                {u.first_name?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {`${u.first_name || ""} ${u.surname || ""}`.trim() || u.phone}
                </p>
                <p className="text-xs text-muted-foreground truncate">{u.phone}</p>
              </div>
              {sub ? (
                <span className="flex items-center gap-1 text-xs font-medium text-[#2D7A3E] bg-[#C9E8D8] px-2.5 py-1 rounded-full whitespace-nowrap">
                  <Check className="w-3.5 h-3.5" /> Until {new Date(sub.period_end).toLocaleDateString()}
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => activate(u.firebase_uid)}
                  disabled={activating === u.firebase_uid || !u.firebase_uid}
                  className="rounded-lg h-8 bg-[#2D7A3E] hover:bg-[#246332]"
                >
                  {activating === u.firebase_uid ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5 mr-1" /> Activate
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        })}
        {users.length === 0 && (
          <p className="text-muted-foreground text-sm px-5 py-8 text-center">No users yet.</p>
        )}
      </div>
    </div>
  );
}