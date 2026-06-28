import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export function useSubscription() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    setLoading(true);
    base44.functions
      .invoke("checkSubscription", { firebase_uid: user.id })
      .then((res) => {
        if (active) setData(res.data);
      })
      .catch(() => {
        if (active) setData({ active: false });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  return { active: data?.active, periodEnd: data?.period_end, loading };
}