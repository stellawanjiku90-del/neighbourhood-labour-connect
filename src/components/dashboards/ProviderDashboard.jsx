import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { Wallet, Star, Briefcase, Wrench, ArrowRight } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [provider, setProvider] = useState(null);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [loadingProvider, setLoadingProvider] = useState(true);

  const phone = user?.phone;
  const { active: subActive, loading: subLoading } = useSubscription();
  const { toast } = useToast();

  // Greet providers who just finished listing + paying.
  useEffect(() => {
    if (sessionStorage.getItem("provider_just_listed") === "true") {
      sessionStorage.removeItem("provider_just_listed");
      toast({ title: "You're listed!", description: "Customers can now find you" });
    }
  }, []);

  const load = async () => {
    const [providers, acceptedJobs, inProgressJobs] = await Promise.all([
      phone ? base44.entities.ServiceProvider.filter({ phone }, "-created_date", 1) : Promise.resolve([]),
      base44.entities.ServiceRequest.filter({ status: "accepted" }, "-created_date", 50),
      base44.entities.ServiceRequest.filter({ status: "in_progress" }, "-created_date", 50),
    ]);
    const me = providers[0] || null;
    setProvider(me);
    const myAssigned = [...acceptedJobs, ...inProgressJobs].filter((j) => me && j.assigned_provider_id === me.id);
    setAssignedJobs(me ? myAssigned : []);
    setLoadingProvider(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Broadcast live location to customers tracking in-progress jobs.
  useEffect(() => {
    const inProgress = assignedJobs.filter((j) => j.status === "in_progress");
    if (inProgress.length === 0 || !navigator.geolocation) return;
    const update = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          await Promise.all(
            inProgress.map((j) =>
              base44.entities.ServiceRequest.update(j.id, {
                provider_lat: latitude,
                provider_lng: longitude,
                provider_loc_updated_at: new Date().toISOString(),
              })
            )
          );
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [assignedJobs]);

  const toggleAvailable = async () => {
    if (!provider) return;
    const updated = await base44.entities.ServiceProvider.update(provider.id, { available: !provider.available });
    setProvider(updated);
  };

  const firstName = user?.full_name?.split(" ")[0] || "there";

  if (loadingProvider || subLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8">
        <Wrench className="w-12 h-12 text-[#2D7A3E] mb-3" />
        <h2 className="text-xl font-bold text-foreground mb-1">Become a Provider</h2>
        <p className="text-sm text-muted-foreground mb-4 text-center">Create your profile to receive jobs</p>
        <Button onClick={() => navigate("/become-provider")} className="rounded-lg bg-[#2D7A3E] h-10 px-6">
          Get Started
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 px-4 md:px-8 py-2.5 border-b border-border bg-background" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Logo" className="w-7 h-7 rounded-lg" />
            <h1 className="text-base font-semibold text-foreground">{firstName}</h1>
          </div>
          <div className="flex items-center gap-2">
            {!subActive && (
              <button
                onClick={() => navigate("/subscribe")}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-md bg-warning-soft text-warning-soft-foreground"
              >
                Subscribe to go live
              </button>
            )}
            <button
              onClick={toggleAvailable}
              disabled={!subActive}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors ${
                !subActive
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : provider.available
                  ? "bg-[#C9E8D8] text-[#2D7A3E]"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {provider.available ? "Available" : "Unavailable"}
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="shrink-0 px-4 md:px-8 py-2 bg-background">
        <div className="grid grid-cols-3 gap-1.5 w-full">
          <div className="bg-card rounded-lg p-2 border border-border text-center">
            <Wallet className="w-3.5 h-3.5 text-[#2D7A3E] mx-auto mb-0.5" />
            <p className="text-base font-bold text-foreground">{provider.earnings || 0}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">KES</p>
          </div>
          <div className="bg-[#C9E8D8] rounded-lg p-2 text-center">
            <Briefcase className="w-3.5 h-3.5 text-[#2D7A3E] mx-auto mb-0.5" />
            <p className="text-base font-bold text-[#2D7A3E]">{provider.completed_jobs || 0}</p>
            <p className="text-[10px] text-[#2D7A3E]/80 mt-0.5">Jobs</p>
          </div>
          <div className="bg-[#F5DCC8] rounded-lg p-2 text-center">
            <Star className="w-3.5 h-3.5 text-[#B36D25] mx-auto mb-0.5" />
            <p className="text-base font-bold text-[#B36D25]">{(provider.rating || 0).toFixed(1)}</p>
            <p className="text-[10px] text-[#B36D25]/80 mt-0.5">Rating</p>
          </div>
        </div>
      </div>

      {/* CTA to Jobs page */}
      <div className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center px-6">
        <div className="text-center">
          <span className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-secondary-foreground mx-auto mb-3">
            <Briefcase className="w-7 h-7" />
          </span>
          <h2 className="text-lg font-bold text-foreground mb-1">Browse Available Jobs</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            View open jobs near you and manage your assigned tasks — all in one place.
          </p>
          <Button onClick={() => navigate("/jobs")} className="rounded-xl h-10 px-6">
            Go to Jobs <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}