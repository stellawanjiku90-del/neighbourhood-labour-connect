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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check } from "lucide-react";

export default function BidDialog({ open, onOpenChange, job, provider, onDone }) {
  const [charge, setCharge] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState(null);

  useEffect(() => {
    if (!open || !job || !provider) return;
    setCharge("");
    setMessage("");
    setExisting(null);
    base44.entities.JobBid
      .filter({ request_id: job.id, provider_id: provider.id }, "-created_date", 1)
      .then((r) => setExisting(r[0] || null))
      .catch(() => setExisting(null));
  }, [open, job, provider]);

  const submit = async () => {
    if (!charge) return;
    setSaving(true);
    try {
      await base44.entities.JobBid.create({
        request_id: job.id,
        request_title: job.title,
        provider_id: provider.id,
        provider_name: provider.name,
        provider_photo: provider.photo_url,
        charge: Number(charge),
        message,
        status: "pending",
      });
      onDone?.();
      onOpenChange(false);
    } catch (e) {
      // ignore — dialog stays open
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-md">
        <DialogHeader>
          <DialogTitle>Submit your offer</DialogTitle>
          <DialogDescription>{job?.title}</DialogDescription>
        </DialogHeader>
        {existing ? (
          <div className="bg-[#C9E8D8] rounded-2xl p-4 text-sm text-[#2D7A3E] flex items-center gap-2">
            <Check className="w-5 h-5 shrink-0" />
            You already offered KES {existing.charge}. Waiting for the customer to assign the job.
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold">Your charge (KES)</label>
              <Input
                type="number"
                value={charge}
                onChange={(e) => setCharge(e.target.value)}
                placeholder="Amount"
                className="rounded-2xl h-11 mt-1.5"
                disabled={saving}
              />
            </div>
            <div>
              <label className="text-sm font-semibold">Message (optional)</label>
              <Textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell the customer why you're the right fit…"
                className="rounded-2xl mt-1.5"
                disabled={saving}
              />
            </div>
            <Button
              onClick={submit}
              disabled={saving || !charge}
              className="w-full h-12 rounded-2xl bg-[#2D7A3E] hover:bg-[#246332]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…
                </>
              ) : (
                "Submit offer"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}