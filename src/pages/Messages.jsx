import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";

export default function Messages() {
  const { user } = useAuth();
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    const providers = user.phone
      ? await base44.entities.ServiceProvider.filter({ phone: user.phone }, "-created_date", 1).catch(() => [])
      : [];
    const myProviderId = providers[0]?.id || null;

    const [asCustomer, asProvider] = await Promise.all([
      base44.entities.Conversation.filter({ customer_id: user.id }, "-updated_date", 50),
      myProviderId ? base44.entities.Conversation.filter({ provider_id: myProviderId }, "-updated_date", 50) : Promise.resolve([]),
    ]);

    const seen = new Set();
    const merged = [...asCustomer, ...asProvider]
      .filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)))
      .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));

    setConvos(merged);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Conversation.subscribe(() => load());
    return unsub;
  }, [user?.id]);

  const isCustomer = user?.role !== "provider";

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto w-full">
      <PageHeader title="Messages" subtitle="Chat with providers & customers" icon={MessageCircle} />

      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center pt-12">
            <div className="w-6 h-6 border-3 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        ) : convos.length === 0 ? (
          <div className="pt-4">
            <EmptyState
              icon={MessageCircle}
              title="No conversations yet"
              description={isCustomer
                ? "Once a provider is matched to your job, you can chat with them here. Find a provider to get started."
                : "When a customer accepts your offer, your conversation with them will appear here."}
              actionLabel={isCustomer ? "Find help" : undefined}
              to={isCustomer ? "/providers" : undefined}
            />
          </div>
        ) : (
          <div className="bg-card border-t border-border divide-y divide-border">
            {convos.map((c) => {
              const fromCustomer = c.customer_id === user?.id;
              const name = fromCustomer ? c.provider_name : c.customer_name;
              const photo = fromCustomer ? c.provider_photo : null;
              return (
                <Link
                  key={c.id}
                  to={`/chat/${c.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                >
                  {photo ? (
                    <img src={photo} alt={name} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center font-bold text-accent-foreground shrink-0">
                      {name?.[0]}
                    </div>
                  )}
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
  );
}