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

export default function PostJob() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
      toast({ title: "Add a category and title", variant: "destructive" });
      return;
    }
    setSaving(true);
    await base44.entities.ServiceRequest.create({
      category,
      title,
      description,
      budget: budget ? Number(budget) : undefined,
      emergency,
      location_name: loc?.location_name,
      lat: loc?.lat,
      lng: loc?.lng,
      status: "open",
    });
    setSaving(false);
    toast({ title: "Request posted!", description: "Nearby providers are being notified." });
    navigate("/jobs");
  };

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto px-4 md:px-8 py-4 md:py-6">
      <h1 className="text-2xl font-extrabold text-foreground mb-4 shrink-0">Post a Request</h1>

      <div className="flex-1 min-h-0 overflow-y-auto">
      <label className="text-sm font-semibold text-foreground">Service category</label>
      <div className="mt-2 mb-6">
        <CategorySearch value={category} onChange={setCategory} placeholder="Search and select a category…" />
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold">What do you need?</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Deep clean a 2-bedroom apartment"
            className="rounded-2xl h-12 mt-1.5"
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Details (optional)</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the job…"
            className="rounded-2xl mt-1.5"
          />
        </div>
        <div>
          <label className="text-sm font-semibold">Budget (optional)</label>
          <Input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Amount"
            className="rounded-2xl h-12 mt-1.5"
          />
        </div>

        <div>
          <label className="text-sm font-semibold">Location</label>
          <div className="mt-1.5">
            <LocationPicker value={loc} onChange={setLoc} />
          </div>
        </div>

        <div className="flex items-center justify-between bg-[#F5DCC8] rounded-2xl p-4">
          <div className="flex items-center gap-2 text-[#B36D25]">
            <Siren className="w-5 h-5" />
            <span className="font-semibold text-sm">Emergency — dispatch nearest</span>
          </div>
          <Switch checked={emergency} onCheckedChange={setEmergency} />
        </div>

        <Button
          onClick={submit}
          disabled={saving}
          className="w-full h-14 rounded-2xl text-base bg-[#1A1F2E] hover:bg-[#2A2F45]"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Post Request"}
        </Button>
      </div>
      </div>
    </div>
  );
}