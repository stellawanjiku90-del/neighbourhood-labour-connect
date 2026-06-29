import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
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
  const { user } = useAuth();
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
      toast({ title: "Add name and at least one profession", variant: "destructive" });
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
    toast({ title: "You're listed!", description: "Customers can now find you" });
    navigate("/providers");
  };

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden max-w-2xl mx-auto">
      {/* Compact header */}
      <header className="shrink-0 px-4 md:px-8 py-3 border-b border-slate-100 bg-background flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-extrabold text-foreground">Become Provider</h1>
      </header>

      {/* Scrollable form */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 py-3">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold">Full name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-10 mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl h-10 mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold">Years exp.</label>
              <Input type="number" value={years} onChange={(e) => setYears(e.target.value)} className="rounded-xl h-10 mt-1" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold">Professions *</label>
            <div className="mt-1">
              <CategorySearch multiple selected={professions} onToggle={toggle} placeholder="Search professions…" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold">Service radius: {radius[0]} km</label>
            <Slider value={radius} onValueChange={setRadius} min={1} max={100} step={1} className="mt-2" />
          </div>

          <div>
            <label className="text-xs font-semibold">Base location</label>
            <div className="mt-1"><LocationPicker value={loc} onChange={setLoc} /></div>
          </div>

          <div>
            <label className="text-xs font-semibold">About you</label>
            <Textarea rows={2} value={bio} onChange={(e) => setBio(e.target.value)} className="rounded-xl mt-1" placeholder="Tell customers about your work…" />
          </div>

          <Button onClick={submit} disabled={saving} className="w-full rounded-xl h-11 text-sm bg-[#1A1F2E] hover:bg-[#2A2F45]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "List as Provider"}
          </Button>
        </div>
      </div>
    </div>
  );
}