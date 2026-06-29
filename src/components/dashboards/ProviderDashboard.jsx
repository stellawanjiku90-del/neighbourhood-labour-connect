import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import BidDialog from "@/components/BidDialog";
import { getOrCreateConversation } from "@/lib/chat";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import LegalLinks from "@/components/LegalLinks";
import { useSubscription } from "@/hooks/useSubscription";
import SubscriptionPaywall from "@/components/SubscriptionPaywall";
import { Wallet, Star, Briefcase, Siren, MapPin, Check, Wrench, CheckCircle2, MessageCircle } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function sortByProximity(jobs, provider) {
  if (!provider || provider.lat == null || provider.lng == null) return jobs;
  const radius = provider.service_radius_km || 10;
  const withDist = jobs.map((j) => {
    const dist = j.lat != null && j.lng != null ? haversine(provider.lat, provider.lng, j.lat, j.lng) : Infinity;
    return { ...j, _dist: dist };
  });
  withDist.sort((a, b) => {
    const aNear = a._dist <= radius ? 0 : 1;
    const bNear = b._dist <= radius ? 0 : 1;
    if (aNear !== bNear) return aNear - bNear;
    return a._dist - b._dist;
  });
  return withDist;
}

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [provider, setProvider] = useState(null);
  const [openJobs, setOpenJobs] = useState([]);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [loadingProvider, setLoadingProvider] = useState(true);
  const [bidJob, setBidJob] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [activeTab, setActiveTab] = useState("open");

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
    const [providers, jobs, acceptedJobs, inProgressJobs] = await Promise.all([
      phone ? base44.entities.ServiceProvider.filter({ phone }, "-created_date", 1) : Promise.resolve([]),
      base44.entities.ServiceRequest.filter({ status: "open" }, "-created_date", 50),
      base44.entities.ServiceRequest.filter({ status: "accepted" }, "-created_date", 50),
      base44.entities.ServiceRequest.filter({ status: "in_progress" }, "-created_date", 50),
    ]);
    const me = providers[0] || null;
    setProvider(me);
    setOpenJobs(sortByProximity(jobs, me));
    const myAssigned = [...acceptedJobs, ...inProgressJobs].filter((j) => me && j.assigned_provider_id === me.id);
    setAssignedJobs(me ? myAssigned : []);
    setLoadingProvider(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Broadcast live location to customers tracking in-progress jobs.
  // Updates every 30s while the provider has the dashboard open.
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

  const startJob = async (job) => {
    setCompleting(job.id);
    await base44.entities.ServiceRequest.update(job.id, { status: "in_progress" });
    setAssignedJobs((prev) => prev.filter((j) => j.id !== job.id));
    setCompleting(null);
  };

  const messageCustomer = async (job) => {
    if (!provider || !job.customer_id) return;
    const convo = await getOrCreateConversation({
      providerId: provider.id,
      providerName: provider.name,
      providerPhoto: provider.photo_url,
      customerId: job.customer_id,
      customerName: job.customer_name,
    });
    navigate(`/chat/${convo.id}`);
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

  if (!subActive) {
    return (
      <SubscriptionPaywall
        message={
          <>
            Subscribe for just <span className="font-bold text-foreground">$1/month</span> to go live, be visible to customers, and start receiving job notifications.
          </>
        }
      />
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="shrink-0 px-4 py-2.5 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_URL} alt="Logo" className="w-7 h-7 rounded-lg" />
            <h1 className="text-base font-semibold text-foreground">{firstName}</h1>
          </div>
          <button
            onClick={toggleAvailable}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-md transition-colors ${
              provider.available ? "bg-[#C9E8D8] text-[#2D7A3E]" : "bg-muted text-muted-foreground"
            }`}
          >
            {provider.available ? "Available" : "Unavailable"}
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="shrink-0 px-4 py-2 bg-background">
        <div className="grid grid-cols-3 gap-1.5">
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

      {/* Tabs */}
      <div className="shrink-0 px-4 py-1.5 border-t border-border bg-background">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab("assigned")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              activeTab === "assigned" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            Assigned ({assignedJobs.length})
          </button>
          <button
            onClick={() => setActiveTab("open")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              activeTab === "open" ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            Open ({openJobs.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-x-auto px-4 py-2">
        <div className="flex gap-2 pb-2 h-full">
          {activeTab === "assigned" && assignedJobs.length === 0 && (
            <p className="text-xs text-muted-foreground text-center w-full py-8">No assigned jobs</p>
          )}
          {activeTab === "assigned" && assignedJobs.slice(0, 6).map((job) => (
            <div key={job.id} className="min-w-[180px] shrink-0 bg-[#C9E8D8] rounded-lg border border-[#2D7A3E]/20 p-2">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px] font-medium text-[#2D7A3E] bg-white/60 px-1.5 py-0.5 rounded-md truncate max-w-[100px]">
                  {job.category}
                </span>
                {job.emergency && <Siren className="w-2.5 h-2.5 text-[#B36D25]" />}
              </div>
              <h3 className="font-semibold text-xs text-foreground truncate mb-1">{job.title}</h3>
              {job.location_name && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mb-1">
                  <MapPin className="w-2.5 h-2.5" /> {job.location_name}
                </p>
              )}
              <div className="flex gap-1">
                {job.status === "accepted" && (
                  <Button
                    onClick={() => startJob(job)}
                    disabled={completing === job.id}
                    className="flex-1 h-7 rounded bg-[#2D7A3E] text-[10px] hover:bg-[#2D7A3E]/90"
                  >
                    {completing === job.id ? (
                      <div className="w-2.5 h-2.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Start
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={() => messageCustomer(job)}
                  variant="outline"
                  className="flex-1 h-7 rounded bg-white text-[10px]"
                >
                  <MessageCircle className="w-2.5 h-2.5 mr-0.5" /> Chat
                </Button>
              </div>
            </div>
          ))}

          {activeTab === "open" && openJobs.length === 0 && (
            <p className="text-xs text-muted-foreground text-center w-full py-8">No open jobs</p>
          )}
          {activeTab === "open" && openJobs.slice(0, 6).map((job) => (
            <div key={job.id} className="min-w-[180px] shrink-0 bg-card rounded-lg border border-border p-2">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px] font-medium text-[#2D7A3E] bg-[#C9E8D8] px-1.5 py-0.5 rounded-md truncate max-w-[80px]">
                  {job.category}
                </span>
                {job.emergency && <Siren className="w-2.5 h-2.5 text-[#B36D25]" />}
              </div>
              <h3 className="font-semibold text-xs text-foreground truncate mb-1">{job.title}</h3>
              {job.location_name && (
                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mb-1">
                  <MapPin className="w-2.5 h-2.5" /> {job.location_name}
                </p>
              )}
              {job._dist != null && job._dist !== Infinity && (
                <p
                  className={`text-[10px] font-medium mb-1 ${
                    job._dist <= (provider?.service_radius_km || 10) ? "text-[#2D7A3E]" : "text-muted-foreground"
                  }`}
                >
                  {job._dist < 1 ? `${Math.round(job._dist * 1000)}m` : `${job._dist.toFixed(1)}km`}
                </p>
              )}
              {job.budget != null && <p className="text-xs font-bold text-foreground mb-1">KES {job.budget}</p>}
              <Button
                onClick={() => setBidJob(job)}
                className="w-full h-7 rounded bg-[#2D7A3E] text-[10px] hover:bg-[#2D7A3E]/90"
              >
                <Check className="w-2.5 h-2.5 mr-0.5" /> Offer
              </Button>
            </div>
          ))}
        </div>
      </div>

      <LegalLinks />

      <BidDialog open={!!bidJob} onOpenChange={(v) => !v && setBidJob(null)} job={bidJob} provider={provider} onDone={load} />
    </div>
  );
}