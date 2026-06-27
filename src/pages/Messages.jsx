import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Messages() {
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const me = await base44.auth.me().catch(() => null);
    if (!me) return setLoading(false);
    const list = await base44.entities.Conversation.filter(
      { customer_id: me.id },
      "-updated_date",
      50
    );
    setConvos(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Conversation.subscribe(() => load());
    return unsub;
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-4 md:py-6">
      <h1 className="text-2xl font-extrabold text-foreground mb-6">Messages</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        </div>
      ) : convos.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            No conversations yet. Open a provider profile and tap Message to start chatting.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 max-h-[64vh] overflow-y-auto">
          {convos.map((c) => (
            <Link
              key={c.id}
              to={`/chat/${c.id}`}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors"
            >
              {c.provider_photo ? (
                <img src={c.provider_photo} alt={c.provider_name} className="w-12 h-12 rounded-2xl object-cover shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center font-bold text-secondary-foreground shrink-0">
                  {c.provider_name?.[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">{c.provider_name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {c.last_message || "Say hello 👋"}
                </p>
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0">
                {c.updated_date && formatDistanceToNow(new Date(c.updated_date), { addSuffix: false })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}