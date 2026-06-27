import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import Stars from "@/components/Stars";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, BadgeCheck, Phone, MessageCircle, MapPin, Award, Briefcase, Heart,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { openConversation } from "@/lib/chat";
import { useAuth } from "@/lib/AuthContext";

export default function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [p, setP] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    base44.entities.ServiceProvider.get(id).then(setP).catch(() => setP(false));
    base44.entities.Review.filter({ provider_id: id }, "-created_date", 20).then(setReviews);
  }, [id]);

  if (p === null) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  }
  if (p === false) {
    return <div className="text-center py-20 text-muted-foreground">Provider not found.</div>;
  }

  const hire = () => toast({ title: `Request sent to ${p.name}`, description: "They'll respond shortly." });
  const message = async () => {
    const convo = await openConversation(p, user);
    navigate(`/chat/${convo.id}`);
  };

  return (
    <div className="h-[100dvh] flex flex-col max-w-2xl mx-auto px-4 md:px-8 py-4 md:py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-5 shrink-0">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>

      <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="flex flex-col items-center text-center">
        {p.photo_url ? (
          <img src={p.photo_url} alt={p.name} className="w-24 h-24 rounded-3xl object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-3xl bg-secondary flex items-center justify-center text-4xl font-bold text-secondary-foreground">
            {p.name?.[0]}
          </div>
        )}
        <p className="text-4xl font-extrabold text-foreground mt-3">{(p.rating || 0).toFixed(1)}</p>
        <Stars value={p.rating} size={20} className="mt-1" />
        <div className="flex items-center gap-1.5 mt-3">
          <h1 className="text-xl font-bold text-foreground">{p.name}</h1>
          {p.verified && <BadgeCheck className="w-5 h-5 text-emerald-600" />}
        </div>
        <p className="text-muted-foreground">{(p.professions || []).join(" · ")}</p>
        {p.location_name && (
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="w-4 h-4" /> {p.location_name}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <Stat icon={Briefcase} label="Jobs done" value={p.completed_jobs || 0} />
        <Stat icon={Award} label="Experience" value={`${p.years_experience || 0}y`} />
        <Stat icon={Heart} label="Reviews" value={p.reviews_count || 0} />
      </div>

      {p.bio && <p className="text-muted-foreground mt-4 leading-relaxed">{p.bio}</p>}

      <h2 className="text-lg font-bold text-foreground mt-5 mb-2">Reviews</h2>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">{r.reviewer_name || "Customer"}</span>
              <Stars value={r.stars} size={13} />
            </div>
            {r.comment && <p className="text-sm text-muted-foreground mt-1">{r.comment}</p>}
          </div>
        ))}
        {reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
      </div>

      </div>

      {/* Actions */}
      <div className="shrink-0 flex gap-3 pt-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {p.phone && (
          <Button asChild variant="outline" className="rounded-2xl h-14 flex-1 bg-white">
            <a href={`tel:${p.phone}`}><Phone className="w-5 h-5 mr-1" /> Call</a>
          </Button>
        )}
        <Button variant="outline" className="rounded-2xl h-14 flex-1 bg-white" onClick={message}>
          <MessageCircle className="w-5 h-5 mr-1" /> Message
        </Button>
        <Button onClick={hire} className="rounded-2xl h-14 flex-[1.5] bg-[#1A1F2E] hover:bg-[#2A2F45] text-base">
          Hire Provider
        </Button>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-2xl p-3 border border-slate-100 text-center">
      <Icon className="w-5 h-5 text-[#2D7A3E] mx-auto" />
      <p className="text-xl font-bold text-foreground mt-1">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}