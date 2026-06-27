import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CategorySearch from "@/components/CategorySearch";
import LocationPicker from "@/components/LocationPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Siren, ChevronDown, ChevronUp } from "lucide-react";
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
  const [expanded, setExpanded] = useState(false);

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
      {/* Ultra-compact header */}
      <header className="shrink-0 px-4 py-2 border-b border-slate-100 bg-background flex items-center justify-between">
        <h1 className="text-base font-bold text-foreground">Post Request</h1>
        <Button onClick={() => navigate(-1)} variant="outline" className="h-7 text-xs rounded-lg px-3">Cancel</Button>
      </header>

      {/* Fixed height content - NO scroll */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 py-2 flex flex-col gap-2">
        {/* Row 1: Category */}
        <div className="shrink-0">
          <label className="text-[10px] font-semibold">Category *</label>
          <CategorySearch value={category} onChange={setCategory} placeholder="Search…" />
        </div>

        {/* Row 2: Title */}
        <div className="shrink-0">
          <label className="text-[10px] font-semibold">Title *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you need?"
            className="rounded-lg h-9 text-xs"
          />
        </div>

        {/* Row 3: Expandable details */}
        <div className="shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-[10px] font-semibold text-muted-foreground"
          >
            {expanded ? "Hide details" : "Add details"}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {expanded && (
            <div className="mt-1 space-y-1.5">
              <Textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the job…"
                className="rounded-lg text-xs"
              />
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Budget (optional)"
                className="rounded-lg h-9 text-xs"
              />
            </div>
          )}
        </div>

        {/* Row 4: Location - compact */}
        <div className="shrink-0 flex-1 min-h-0 overflow-hidden">
          <label className="text-[10px] font-semibold">Location</label>
          <div className="h-full overflow-y-auto">
            <LocationPicker value={loc} onChange={setLoc} />
          </div>
        </div>

        {/* Row 5: Emergency toggle */}
        <div className="shrink-0 flex items-center justify-between bg-[#F5DCC8] rounded-lg p-2">
          <div className="flex items-center gap-1.5 text-[#B36D25]">
            <Siren className="w-3 h-3" />
            <span className="font-semibold text-[10px]">Emergency</span>
          </div>
          <Switch checked={emergency} onCheckedChange={setEmergency} className="scale-75" />
        </div>

        {/* Row 6: Submit button */}
        <Button
          onClick={submit}
          disabled={saving}
          className="shrink-0 h-9 rounded-lg text-xs bg-[#1A1F2E] hover:bg-[#2A2F45]"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Post Request"}
        </Button>
      </div>
    </div>
  );
}