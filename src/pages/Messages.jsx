import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import { usePresenceBatch } from "@/hooks/usePresence";
import { PresenceDot } from "@/components/PresenceIndicator";

export default function Messages() {
  const { user } = useAuth();
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [presenceIds, setPresenceIds] = useState([]);
  const { presenceMap } = usePresenceBatch(presenceIds);

  const load = async () => {
    if (!user) { setLoading(false); return; }

    let list = [];
    const isCust = user.role !== "provider";

    if (user.role === "provider") {
      const providers = user.phone
        ? await base44.entities.ServiceProvider.filter({ phone: user.phone }, "-created_date", 1).catch(() => [])
        : [];
      const myProviderId = providers[0]?.id || null;
      if (myProviderId) {
        list = await base44.entities.Conversation.filter({ provider_id: myProviderId }, "-updated_date", 50);
      }
    } else {
      list = await base44.entities.Conversation.filter({ customer_id: user.id }, "-updated_date", 50);
    }

    list.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));

    // Collect user IDs for presence lookup
    let ids = [];
    if (isCust) {
      // Customers need provider firebase_uids — fetch from ServiceProvider
      const providerIds = list.map((c) => c.provider_id).filter(Boolean);
      const providers = await Promise.all(
        providerIds.map((id) => base44.entities.ServiceProvider.get(id).catch(() => null))
      );
      const providerUidMap = {};
      for (const p of providers) {
        if (p && p.id && p.firebase_uid) providerUidMap[p.id] = p.firebase_uid;
      }
      list.forEach((c) => { c._presence_uid = providerUidMap[c.provider_id] || null; });
      ids = Object.values(providerUidMap).filter(Boolean);
    } else {
      // Providers can use customer_id directly (it's the Firebase UID)
      list.forEach((c) => { c._presence_uid = c.customer_id; });
      ids = list.map((c) => c.customer_id).filter(Boolean);
    }
    setPresenceIds(ids);

    setConvos(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Conversation.subscribe(() => load());
    return unsub;
  }, [user?.id]);

  const isCustomer = user?.role !== "provider";

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <PageHeader
        title="Messages"
        subtitle={isCustomer ? "Chat with service providers" : "Chat with customers"}
        icon={MessageCircle}
      />

      <div className="flex-1 min-h-0 overflow-y-auto page-content py-4">
        <div className="w-full">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-3 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : convos.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No conversations yet"
            description={isCustomer
              ? "Once a provider is matched to your job, you can chat with them here. Find a provider to get started."
              : "When a customer accepts your offer, your conversation with them will appear here."}
            actionLabel={isCustomer ? "Find help" : undefined}
            to={isCustomer ? "/providers" : undefined}
          />
        ) : (
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {convos.map((c) => {
              const name = isCustomer ? c.provider_name : c.customer_name;
              const photo = isCustomer ? c.provider_photo : null;
              const presence = c._presence_uid ? presenceMap[c._presence_uid] : null;
              return (
                <Link
                  key={c.id}
                  to={`/chat/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                >
                  <div className="relative shrink-0">
                    {photo ? (
                      <img src={photo} alt={name} className="w-11 h-11 rounded-xl object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center font-bold text-accent-foreground">
                        {name?.[0]}
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <PresenceDot presence={presence} size="xs" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {c.last_message || "Say hello 👋"}
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {c.updated_date && formatDistanceToNow(new Date(c.updated_date), { addSuffix: false })}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}