import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Messages() {
  const { user } = useAuth();
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const providers = user.phone
      ? await base44.entities.ServiceProvider
          .filter({ phone: user.phone }, "-created_date", 1)
          .catch(() => [])
      : [];
    const myProviderId = providers[0]?.id || null;

    const [asCustomer, asProvider] = await Promise.all([
      base44.entities.Conversation.filter({ customer_id: user.id }, "-updated_date", 50),
      myProviderId
        ? base44.entities.Conversation.filter({ provider_id: myProviderId }, "-updated_date", 50)
        : Promise.resolve([]),
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

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto px-4 md:px-8 py-4 md:py-6">
      <h1 className="text-2xl font-extrabold text-foreground mb-3 shrink-0">Messages</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        </div>
      ) : convos.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            No conversations yet. Once a job is matched, you can message the other party here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 flex-1 min-h-0 overflow-y-auto">
          {convos.map((c) => {
            const isCustomer = c.customer_id === user?.id;
            const name = isCustomer ? c.provider_name : c.customer_name;
            const photo = isCustomer ? c.provider_photo : null;
            return (
              <Link
                key={c.id}
                to={`/chat/${c.id}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors"
              >
                {photo ? (
                  <img src={photo} alt={name} className="w-12 h-12 rounded-2xl object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center font-bold text-secondary-foreground shrink-0">
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
  );
}