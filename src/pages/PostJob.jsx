import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CategorySearch from "@/components/CategorySearch";
import LocationPicker from "@/components/LocationPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Siren } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";

export default function PostJob() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const params = new URLSearchParams(useLocation().search);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [loc, setLoc] = useState(null);
  const [emergency, setEmergency] = useState(params.get("emergency") === "1");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!category || !title) {
      toast({ title: "Add category and title", variant: "destructive" });
      return;
    }
    setSaving(true);
    const created = await base44.entities.ServiceRequest.create({
      category,
      title,
      customer_id: user?.id,
      customer_name: user?.full_name,
      description,
      budget: budget ? Number(budget) : undefined,
      emergency,
      location_name: loc?.location_name,
      lat: loc?.lat,
      lng: loc?.lng,
      status: "open",
    });
    base44.functions.invoke("sendJobNearbyNotifications", { data: created }).catch(() => {});
    setSaving(false);
    toast({ title: "Request posted!", description: "Nearby providers notified" });
    navigate("/jobs");
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden max-w-2xl mx-auto">
      {/* Compact header */}
      <header className="shrink-0 px-4 md:px-8 py-3 border-b border-slate-100 bg-background flex items-center justify-between">
        <h1 className="text-lg font-extrabold text-foreground">Post Request</h1>
        <Button onClick={() => navigate(-1)} variant="outline" className="h-8 text-xs rounded-xl">Cancel</Button>
      </header>

      {/* Scrollable form */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 py-3">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold">Service category *</label>
            <CategorySearch value={category} onChange={setCategory} placeholder="Search category…" />
          </div>

          <div>
            <label className="text-xs font-semibold">What do you need? *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Clean 2-bedroom apartment"
              className="rounded-xl h-10 mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold">Details</label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the job…"
              className="rounded-xl mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold">Budget</label>
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Amount"
              className="rounded-xl h-10 mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold">Location</label>
            <p className="text-[10px] text-muted-foreground mb-1">Search any area or use current location</p>
            <LocationPicker value={loc} onChange={setLoc} />
          </div>

          <div className="flex items-center justify-between bg-[#F5DCC8] rounded-xl p-3">
            <div className="flex items-center gap-2 text-[#B36D25]">
              <Siren className="w-4 h-4" />
              <span className="font-semibold text-xs">Emergency</span>
            </div>
            <Switch checked={emergency} onCheckedChange={setEmergency} />
          </div>

          <Button
            onClick={submit}
            disabled={saving}
            className="w-full h-11 rounded-xl text-sm bg-[#1A1F2E] hover:bg-[#2A2F45]"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Request"}
          </Button>
        </div>
      </div>
    </div>
  );
}