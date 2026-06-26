import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";

export default function RateDialog({ open, onOpenChange, request, onDone }) {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    const me = await base44.auth.me().catch(() => null);
    await base44.entities.Review.create({
      provider_id: request.assigned_provider_id,
      request_id: request.id,
      reviewer_name: me?.full_name || "Customer",
      stars,
      comment,
    });
    // recompute provider rating
    if (request.assigned_provider_id) {
      const prov = await base44.entities.ServiceProvider.get(request.assigned_provider_id).catch(() => null);
      if (prov) {
        const all = await base44.entities.Review.filter({ provider_id: prov.id });
        const avg = all.reduce((s, r) => s + r.stars, 0) / all.length;
        await base44.entities.ServiceProvider.update(prov.id, {
          rating: Math.round(avg * 10) / 10,
          reviews_count: all.length,
        });
      }
    }
    await base44.entities.ServiceRequest.update(request.id, { rated: true });
    setSaving(false);
    onDone?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Rate {request?.assigned_provider_name || "provider"}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center gap-2 py-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <button key={i} onClick={() => setStars(i)} className="transition-transform active:scale-90">
              <Star className={`w-9 h-9 ${i <= stars ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
            </button>
          ))}
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience (optional)"
          className="rounded-2xl"
        />
        <Button onClick={submit} disabled={saving} className="w-full h-12 rounded-2xl bg-[#1A1F2E] hover:bg-[#2A2F45]">
          Submit review
        </Button>
      </DialogContent>
    </Dialog>
  );
}