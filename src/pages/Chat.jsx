import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Phone } from "lucide-react";

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const [convo, setConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [revealed, setRevealed] = useState({ customer: false, provider: false });
  const [otherPhone, setOtherPhone] = useState(null);
  const bottomRef = useRef(null);

  const loadMessages = () =>
    base44.entities.Message.filter({ conversation_id: id }, "created_date", 200).then(setMessages);

  useEffect(() => {
    base44.entities.Conversation.get(id).then((c) => {
      setConvo(c);
      setRevealed({ customer: !!c?.customer_revealed_number, provider: !!c?.provider_revealed_number });
    }).catch(() => setConvo(false));
    loadMessages();
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event?.data?.conversation_id === id || event?.type === "delete") loadMessages();
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleReveal = async () => {
    if (!convo || !me) return;
    const isCustomer = me.id === convo.customer_id;
    const key = isCustomer ? "customer_revealed_number" : "provider_revealed_number";
    const updated = await base44.entities.Conversation.update(id, { [key]: true });
    setConvo(updated);
    setRevealed({ customer: !!updated.customer_revealed_number, provider: !!updated.provider_revealed_number });
  };

  // Fetch the other party's phone once they have consented to share (otherRevealed)
  useEffect(() => {
    if (!otherRevealed || !convo || !me) return;
    (async () => {
      if (isCustomer && convo.provider_id) {
        const prov = await base44.entities.ServiceProvider.get(convo.provider_id).catch(() => null);
        setOtherPhone(prov?.phone ? prov.phone : "unavailable");
      } else if (!isCustomer) {
        // customer's phone lives on the UserProfile via firebase_uid
        const phys = await base44.entities.UserProfile.filter({ firebase_uid: convo.customer_id }, null, 1).catch(() => []);
        setOtherPhone(phys[0]?.phone ? phys[0].phone : "unavailable");
      }
    })();
  }, [otherRevealed]);

  // My phone, and whether the other party has also revealed
  const myPhone = me?.phone;
  const isCustomer = me?.id === convo?.customer_id;
  const iRevealed = isCustomer ? revealed.customer : revealed.provider;
  const otherRevealed = isCustomer ? revealed.provider : revealed.customer;
  const bothRevealed = revealed.customer && revealed.provider;

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !me) return;
    setText("");
    const tempId = "temp-" + Date.now();
    setMessages((prev) => [...prev, {
      id: tempId,
      conversation_id: id,
      sender_id: me.id,
      sender_name: me.full_name,
      text: body,
    }]);
    setSending(true);
    try {
      const created = await base44.entities.Message.create({
        conversation_id: id,
        sender_id: me.id,
        sender_name: me.full_name,
        text: body,
      });
      setMessages((prev) => prev.map((m) => (m.id === tempId ? created : m)));
      await base44.entities.Conversation.update(id, {
        last_message: body,
        last_sender_id: me.id,
      });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(body);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background pt-[env(safe-area-inset-top)]">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 h-16 bg-white border-b border-slate-100 shrink-0">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {convo && convo !== false && (() => {
          const isCustomer = me?.id === convo.customer_id;
          const otherName = isCustomer ? convo.provider_name : convo.customer_name;
          const otherPhoto = isCustomer ? convo.provider_photo : null;
          return (
            <>
              {otherPhoto ? (
                <img src={otherPhoto} alt={otherName} className="w-9 h-9 rounded-xl object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-sm">
                  {otherName?.[0]}
                </div>
              )}
              <p className="font-bold text-foreground">{otherName}</p>
            </>
          );
        })()}
        <div className="ml-auto flex items-center gap-2">
          {convo && convo !== false && (() => {
            if (otherRevealed && otherPhone && otherPhone !== "unavailable") {
              return (
                <a href={`tel:${otherPhone}`} className="flex items-center gap-1 text-xs font-medium text-[#2D7A3E] whitespace-nowrap">
                  <Phone className="w-4 h-4" /> Call
                </a>
              );
            }
            if (iRevealed) {
              if (bothRevealed && otherPhone === "unavailable") {
                return <p className="text-[11px] text-muted-foreground whitespace-nowrap">Number hidden</p>;
              }
              return <p className="text-xs text-muted-foreground whitespace-nowrap">Waiting…</p>;
            }
            return (
              <button onClick={toggleReveal} className="flex items-center gap-1 text-xs text-[#2D7A3E] font-medium whitespace-nowrap hover:underline">
                <Phone className="w-3.5 h-3.5" /> Share number
              </button>
            );
          })()}
        </div>
      </header>
      {bothRevealed && otherPhone && otherPhone !== "unavailable" && (
        <div className="shrink-0 flex items-center justify-center gap-2 px-4 py-1.5 bg-[#C9E8D8] text-[11px] font-medium text-[#2D7A3E]">
          <Phone className="w-3.5 h-3.5" /> Numbers shared — both parties can now call each other
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground mt-10">
            No messages yet. Start the conversation!
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === me?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm ${
                  mine
                    ? "bg-[#1A1F2E] text-white rounded-br-md"
                    : "bg-white border border-slate-100 text-foreground rounded-bl-md"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={send} className="flex items-center gap-2 p-3 bg-white border-t border-slate-100 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="rounded-2xl h-12 flex-1"
        />
        <Button type="submit" disabled={sending || !text.trim()} className="rounded-2xl h-12 w-12 p-0 bg-[#1A1F2E] hover:bg-[#2A2F45] shrink-0">
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
}