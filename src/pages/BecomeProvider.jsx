import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CategorySearch from "@/components/CategorySearch";
import LocationPicker from "@/components/LocationPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function BecomeProvider() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [years, setYears] = useState("");
  const [professions, setProfessions] = useState([]);
  const [radius, setRadius] = useState([10]);
  const [loc, setLoc] = useState(null);
  const [saving, setSaving] = useState(false);

  const toggle = (n) =>
    setProfessions((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));

  const submit = async () => {
    if (!name || professions.length === 0) {
      toast({ title: "Add your name and at least one profession", variant: "destructive" });
      return;
    }
    setSaving(true);
    await base44.entities.ServiceProvider.create({
      name,
      phone,
      bio,
      years_experience: years ? Number(years) : 0,
      professions,
      service_radius_km: radius[0],
      location_name: loc?.location_name,
      lat: loc?.lat,
      lng: loc?.lng,
      available: true,
    });
    setSaving(false);
    toast({ title: "You're listed!", description: "Customers can now find you." });
    navigate("/providers");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-4 md:py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-5">
        <ArrowLeft className="w-5 h-5" /> Back
      </button>
      <h1 className="text-2xl font-extrabold text-foreground mb-6">Become a Provider</h1>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold">Full name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-2xl h-12 mt-1.5" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-2xl h-12 mt-1.5" />
          </div>
          <div>
            <label className="text-sm font-semibold">Years experience</label>
            <Input type="number" value={years} onChange={(e) => setYears(e.target.value)} className="rounded-2xl h-12 mt-1.5" />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">Professions</label>
          <div className="mt-2">
            <CategorySearch
              multiple
              selected={professions}
              onToggle={toggle}
              placeholder="Search and add professions…"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">Service radius: {radius[0]} km</label>
          <Slider value={radius} onValueChange={setRadius} min={1} max={100} step={1} className="mt-3" />
        </div>

        <div>
          <label className="text-sm font-semibold">Base location</label>
          <div className="mt-1.5"><LocationPicker value={loc} onChange={setLoc} /></div>
        </div>

        <div>
          <label className="text-sm font-semibold">About you</label>
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="rounded-2xl mt-1.5" placeholder="Tell customers about your work…" />
        </div>

        <Button onClick={submit} disabled={saving} className="w-full h-14 rounded-2xl text-base bg-[#1A1F2E] hover:bg-[#2A2F45]">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "List me as a provider"}
        </Button>
      </div>
    </div>
  );
}