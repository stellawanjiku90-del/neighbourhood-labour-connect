import React, { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
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

  if (user?.role === "provider") {
    return <Navigate to="/" replace />;
  }

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
    <div className="h-[100dvh] flex flex-col overflow-hidden max-w-2xl mx-auto bg-background safe-area-inset">
      {/* Header */}
      <header className="shrink-0 px-4 py-2.5 border-b border-border bg-background flex items-center justify-between safe-area-top">
        <h1 className="text-lg font-semibold text-foreground">Post Request</h1>
        <Button onClick={() => navigate(-1)} variant="outline" className="h-9 text-sm rounded-lg px-4">Cancel</Button>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 py-3 flex flex-col gap-3">
        {/* Category */}
        <div className="shrink-0">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category *</label>
          <CategorySearch value={category} onChange={setCategory} placeholder="Search service category…" />
        </div>

        {/* Title */}
        <div className="shrink-0">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you need help with?"
            className="rounded-lg h-10"
          />
        </div>

        {/* Expandable details */}
        <div className="shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground py-2"
          >
            {expanded ? "Hide details" : "Add details"}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {expanded && (
            <div className="mt-2 space-y-2">
              <Textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the job in detail…"
                className="rounded-lg"
              />
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Your budget (optional)"
                className="rounded-lg h-10"
              />
            </div>
          )}
        </div>

        {/* Location */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Location</label>
          <div className="h-full overflow-y-auto">
            <LocationPicker value={loc} onChange={setLoc} />
          </div>
        </div>

        {/* Emergency toggle */}
        <div className="shrink-0 flex items-center justify-between bg-[#F5DCC8] rounded-lg p-3">
          <div className="flex items-center gap-2 text-[#B36D25]">
            <Siren className="w-4 h-4" />
            <span className="font-medium text-sm">Emergency request</span>
          </div>
          <Switch checked={emergency} onCheckedChange={setEmergency} />
        </div>

        {/* Submit */}
        <Button
          onClick={submit}
          disabled={saving}
          className="shrink-0 h-10 rounded-lg text-sm font-medium bg-primary hover:bg-primary/90"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Request"}
        </Button>
      </div>
    </div>
  );
}