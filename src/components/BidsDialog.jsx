import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Loader2, CheckCircle2 } from "lucide-react";

export default function BidsDialog({ open, onOpenChange, job, onDone }) {
  const [bids, setBids] = useState([]);
  const [providers, setProviders] = useState({});
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(null);

  const load = async () => {
    if (!job) return;
    setLoading(true);
    try {
      const list = await base44.entities.JobBid.filter(
        { request_id: job.id },
        "-created_date",
        50
      );
      setBids(list);
      const provs = await Promise.all(
        list.map((b) =>
          base44.entities.ServiceProvider.get(b.provider_id).catch(() => null)
        )
      );
      const map = {};
      list.forEach((b, i) => {
        if (provs[i]) map[b.provider_id] = provs[i];
      });
      setProviders(map);
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) load();
  }, [open, job]);

  const assign = async (bid) => {
    setAssigning(bid.id);
    try {
      await base44.entities.ServiceRequest.update(job.id, {
        status: "accepted",
        assigned_provider_id: bid.provider_id,
        assigned_provider_name: bid.provider_name,
      });
      await base44.entities.JobBid.update(bid.id, { status: "accepted" });
      onDone?.();
      onOpenChange(false);
    } catch (e) {
      // ignore
    }
    setAssigning(null);
  };

  const sorted = [...bids].sort((a, b) => {
    const ra = providers[a.provider_id]?.rating || 0;
    const rb = providers[b.provider_id]?.rating || 0;
    if (rb !== ra) return rb - ra;
    return (a.charge || 0) - (b.charge || 0);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Offers for "{job?.title}"</DialogTitle>
          <DialogDescription>
            {bids.length} pro{bids.length === 1 ? "" : "s"} interested. Sorted by rating then price.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No offers yet. Check back soon.
          </p>
        ) : (
          <div className="space-y-3">
            {sorted.map((bid) => {
              const p = providers[bid.provider_id];
              return (
                <div
                  key={bid.id}
                  className="bg-white rounded-2xl border border-slate-100 p-3"
                >
                  <div className="flex items-center gap-3">
                    {p?.photo_url ? (
                      <img
                        src={p.photo_url}
                        alt={bid.provider_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-secondary-foreground">
                        {bid.provider_name?.[0] || "?"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground truncate">{bid.provider_name}</p>
                      {p && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {(p.rating || 0).toFixed(1)} ({p.reviews_count || 0} reviews) ·{" "}
                          {p.completed_jobs || 0} jobs
                        </p>
                      )}
                    </div>
                    <p className="font-extrabold text-[#2D7A3E] shrink-0">KES {bid.charge}</p>
                  </div>
                  {bid.message && (
                    <p className="text-sm text-muted-foreground mt-2">{bid.message}</p>
                  )}
                  <Button
                    onClick={() => assign(bid)}
                    disabled={assigning === bid.id}
                    className="w-full mt-3 h-10 rounded-xl bg-[#2D7A3E] hover:bg-[#246332]"
                  >
                    {assigning === bid.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Assigning…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Assign this pro
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}