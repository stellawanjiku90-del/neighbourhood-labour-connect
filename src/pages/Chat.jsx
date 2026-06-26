import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [convo, setConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadMessages = () =>
    base44.entities.Message.filter({ conversation_id: id }, "created_date", 200).then(setMessages);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => {});
    base44.entities.Conversation.get(id).then(setConvo).catch(() => setConvo(false));
    loadMessages();
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event?.data?.conversation_id === id || event?.type === "delete") loadMessages();
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 h-16 bg-white border-b border-slate-100 shrink-0">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {convo && convo !== false && (
          <>
            {convo.provider_photo ? (
              <img src={convo.provider_photo} alt={convo.provider_name} className="w-9 h-9 rounded-xl object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center font-bold text-secondary-foreground text-sm">
                {convo.provider_name?.[0]}
              </div>
            )}
            <p className="font-bold text-foreground">{convo.provider_name}</p>
          </>
        )}
      </header>

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