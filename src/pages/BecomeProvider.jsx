import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import CategorySearch from "@/components/CategorySearch";
import LocationPicker from "@/components/LocationPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import SubscriptionPaywall from "@/components/SubscriptionPaywall";

export default function BecomeProvider() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { active: subActive, loading: subLoading } = useSubscription();
  const { detect } = useGeoLocation();
  const profile = user?.profile;
  const [name, setName] = useState(
    profile ? `${profile.first_name || ""} ${profile.surname || ""}`.trim() : ""
  );
  const [phone, setPhone] = useState(user?.phone || "");
  const [bio, setBio] = useState("");
  const [years, setYears] = useState("");
  const [professions, setProfessions] = useState([]);
  const [radius, setRadius] = useState([10]);
  const [loc, setLoc] = useState(
    profile?.lat != null && profile?.lng != null
      ? { lat: profile.lat, lng: profile.lng, location_name: profile.location_name }
      : null
  );
  const [saving, setSaving] = useState(false);

  // Autofill base location from live location if the profile had none.
  useEffect(() => {
    if (!loc && navigator.geolocation) {
      detect().then((res) => {
        if (res) setLoc(res);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check profile completion first
  if (!user?.profile_completed) {
    return (
      <SubscriptionPaywall
        message={
          <>
            Please complete your profile and verify your identity before becoming a provider. This helps build trust with customers.
          </>
        }
      />
    );
  }

  const toggle = (n) =>
    setProfessions((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));

  const submit = async () => {
    if (!name || professions.length === 0) {
      toast({ title: "Add name and at least one profession", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name,
        phone,
        bio,
        years_experience: years ? Number(years) : 0,
        professions,
        service_radius_km: radius[0],
        location_name: loc?.location_name,
        lat: loc?.lat,
        lng: loc?.lng,
        firebase_uid: user?.id,
        // Listed immediately if already subscribed; otherwise activated after payment.
        available: !!subActive,
      };

      // Upsert so re-listing doesn't create duplicate provider records.
      const existing = user?.id
        ? await base44.entities.ServiceProvider.filter({ firebase_uid: user.id }, null, 1)
        : [];
      if (existing.length > 0) {
        await base44.entities.ServiceProvider.update(existing[0].id, payload);
      } else {
        await base44.entities.ServiceProvider.create(payload);
      }

      if (subActive) {
        toast({ title: "You're listed!", description: "Customers can now find you" });
        navigate("/");
      } else {
        // Prompt payment; the Subscribe page activates the listing on success.
        navigate("/subscribe?intent=provider");
      }
    } catch (e) {
      toast({ title: "Failed to list. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
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
            <label className="text-xs font-semibold text-foreground">Full name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl h-10 mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-foreground">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl h-10 mt-1" />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Years exp.</label>
              <Input type="number" value={years} onChange={(e) => setYears(e.target.value)} className="rounded-xl h-10 mt-1" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Professions *</label>
            <div className="mt-1">
              <CategorySearch multiple selected={professions} onToggle={toggle} placeholder="Search professions…" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Service radius: {radius[0]} km</label>
            <Slider value={radius} onValueChange={setRadius} min={1} max={100} step={1} className="mt-2" />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Base location</label>
            <div className="mt-1"><LocationPicker value={loc} onChange={setLoc} /></div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">About you</label>
            <Textarea rows={2} value={bio} onChange={(e) => setBio(e.target.value)} className="rounded-xl mt-1" placeholder="Tell customers about your work…" />
          </div>

          <Button
            onClick={submit}
            disabled={saving || subLoading}
            className="w-full rounded-xl h-11 text-sm bg-[#1A1A1A] hover:bg-[#333333] text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "List as Provider"}
          </Button>
        </div>
      </div>
    </div>
  );
}