import { useEffect, useRef, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

/**
 * Sends periodic heartbeats to keep the user's presence "online".
 * Automatically handles page visibility changes and beforeunload.
 */
export function usePresence() {
  const { user } = useAuth();
  const intervalRef = useRef(null);

  const heartbeat = useCallback(async () => {
    if (!user?.id) return;
    try {
      await base44.functions.invoke("updatePresence", {});
    } catch { /* silent — heartbeat failures are non-critical */ }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // Go online immediately
    heartbeat();

    // Set up heartbeat interval
    intervalRef.current = setInterval(heartbeat, HEARTBEAT_INTERVAL);

    // Handle tab visibility — pause heartbeat when hidden, resume when visible
    const handleVisibility = () => {
      if (document.visibilityState === "visible") heartbeat();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user?.id, heartbeat]);
}

/**
 * Fetches presence data for a batch of user IDs.
 * Returns a map: { [user_id]: { is_online, last_active, provider_status } }
 */
export function usePresenceBatch(userIds = []) {
  const [presenceMap, setPresenceMap] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchPresence = useCallback(async () => {
    if (!userIds.length) { setPresenceMap({}); setLoading(false); return; }
    try {
      // Fetch presence records for the given user IDs
      const results = await base44.entities.UserPresence.list('-last_active', 500);
      const map = {};
      for (const p of results) {
        if (userIds.includes(p.user_id)) {
          map[p.user_id] = p;
        }
      }
      setPresenceMap(map);
    } catch { /* silent */ }
    setLoading(false);
  }, [userIds.join(",")]);

  useEffect(() => {
    fetchPresence();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPresence, 30000);
    return () => clearInterval(interval);
  }, [fetchPresence]);

  return { presenceMap, loading, refresh: fetchPresence };
}

/**
 * Fetches presence for a single user.
 */
export function useUserPresence(userId) {
  const { presenceMap, loading, refresh } = usePresenceBatch(userId ? [userId] : []);
  return { presence: presenceMap[userId] || null, loading, refresh };
}