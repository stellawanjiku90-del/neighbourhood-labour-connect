import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PullToRefresh from "@/components/PullToRefresh";
import BidDialog from "@/components/BidDialog";
import { getOrCreateConversation } from "@/lib/chat";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { Wallet, Star, Briefcase, Siren, MapPin, Check, Wrench, Bell, CheckCircle2, MessageCircle } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Sort open jobs so the provider's immediate area (within service radius) shows first.
function sortByProximity(jobs, provider) {
  if (!provider || provider.lat == null || provider.lng == null) return jobs;
  const radius = provider.service_radius_km || 10;
  const withDist = jobs.map((j) => {
    const dist =
      j.lat != null && j.lng != null
        ? haversine(provider.lat, provider.lng, j.lat, j.lng)
        : Infinity;
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

  const phone = user?.phone;

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
    const myAssigned = [...acceptedJobs, ...inProgressJobs].filter(
      (j) => me && j.assigned_provider_id === me.id
    );
    setAssignedJobs(me ? myAssigned : []);
    setLoadingProvider(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleAvailable = async () => {
    if (!provider) return;
    const updated = await base44.entities.ServiceProvider.update(provider.id, {
      available: !provider.available,
    });
    setProvider(updated);
  };

  const startJob = async (job) => {
    setCompleting(job.id);
    try {
      await base44.entities.ServiceRequest.update(job.id, { status: "in_progress" });
      setAssignedJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch (e) {
      // ignore
    }
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
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      {/* Header - compact */}
      <header className="shrink-0 px-4 md:px-8 py-3 border-b border-slate-100 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Logo" className="w-7 h-7 rounded-full object-cover md:hidden" />
            <div>
              <p className="text-xs text-muted-foreground">{greet}</p>
              <h1 className="text-lg font-extrabold text-foreground">{firstName} 👋</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Scrollable content */}
      <PullToRefresh onRefresh={load} className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 py-3">
        <div className="max-w-5xl mx-auto space-y-3">
          {loadingProvider ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-7 h-7 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
            </div>
          ) : !provider ? (
            <div className="bg-white rounded-xl border border-slate-100 p-5 text-center">
              <Wrench className="w-8 h-8 text-[#2D7A3E] mx-auto mb-2" />
              <h2 className="text-base font-bold text-foreground mb-1">Become a Provider</h2>
              <p className="text-xs text-muted-foreground mb-3">Create your profile to receive jobs</p>
              <Button
                onClick={() => navigate("/become-provider")}
                className="rounded-xl bg-[#2D7A3E] hover:bg-[#246332] h-10 px-5 text-sm"
              >
                <Wrench className="w-4 h-4 mr-1" /> Get Started
              </Button>
            </div>
          ) : (
            <>
              {/* Availability toggle - compact */}
              <button
                onClick={toggleAvailable}
                className="w-full flex items-center justify-between bg-white rounded-xl border border-slate-100 p-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${provider.available ? "bg-[#C9E8D8]" : "bg-slate-100"}`}>
                    <Bell className={`w-4 h-4 ${provider.available ? "text-[#2D7A3E]" : "text-muted-foreground"}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm text-foreground">{provider.available ? "Available" : "Unavailable"}</p>
                    <p className="text-[10px] text-muted-foreground">Tap to toggle</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold ${provider.available ? "text-[#2D7A3E]" : "text-muted-foreground"}`}>
                  {provider.available ? "On" : "Off"}
                </span>
              </button>

              {/* Stats - compact */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white rounded-xl p-2.5 border border-slate-100">
                  <Wallet className="w-4 h-4 text-[#2D7A3E] mb-0.5" />
                  <p className="text-xl font-extrabold text-foreground">{provider.earnings || 0}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Earnings</p>
                </div>
                <div className="bg-[#C9E8D8] rounded-xl p-2.5">
                  <Briefcase className="w-4 h-4 text-[#2D7A3E] mb-0.5" />
                  <p className="text-xl font-extrabold text-[#2D7A3E]">{provider.completed_jobs || 0}</p>
                  <p className="text-[10px] text-[#2D7A3E]/80 mt-0.5">Jobs</p>
                </div>
                <div className="bg-[#F5DCC8] rounded-xl p-2.5">
                  <Star className="w-4 h-4 text-[#B36D25] mb-0.5" />
                  <p className="text-xl font-extrabold text-[#B36D25]">{(provider.rating || 0).toFixed(1)}</p>
                  <p className="text-[10px] text-[#B36D25]/80 mt-0.5">Rating</p>
                </div>
              </div>
            </>
          )}

          {/* Assigned jobs - use tabs/accordion pattern */}
          {provider && assignedJobs.length > 0 && (
            <div className="mb-3">
              <h2 className="text-sm font-bold text-foreground mb-2">Assigned ({assignedJobs.length})</h2>
              <div className="space-y-2">
                {assignedJobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="bg-[#C9E8D8] rounded-xl border border-[#2D7A3E]/20 p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-medium text-[#2D7A3E] bg-white/60 px-1.5 py-0.5 rounded-full">
                        {job.category}
                      </span>
                      {job.emergency && (
                        <span className="text-[10px] font-medium text-[#B36D25] bg-[#F5DCC8] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <Siren className="w-2.5 h-2.5" /> Emergency
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm text-foreground truncate">{job.title}</h3>
                    {job.location_name && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5" /> {job.location_name}
                      </p>
                    )}
                    <div className="flex gap-1.5 mt-2">
                      {job.status === "accepted" && (
                        <Button
                          onClick={() => startJob(job)}
                          disabled={completing === job.id}
                          className="flex-1 h-8 rounded-lg bg-[#2D7A3E] hover:bg-[#246332] text-xs"
                        >
                          {completing === job.id ? (
                            <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-0.5" /> Start
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        onClick={() => messageCustomer(job)}
                        variant="outline"
                        className="flex-1 h-8 rounded-lg bg-white text-xs"
                      >
                        <MessageCircle className="w-3 h-3 mr-0.5" /> Message
                      </Button>
                    </div>
                  </div>
                ))}
                {assignedJobs.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">+{assignedJobs.length - 3} more</p>
                )}
              </div>
            </div>
          )}

          {/* Open jobs - compact list */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-foreground">Open jobs</h2>
            <span className="text-xs text-muted-foreground">{openJobs.length}</span>
          </div>

          {openJobs.length === 0 ? (
            <p className="text-muted-foreground text-xs py-4 text-center">No open jobs right now</p>
          ) : (
            <div className="space-y-2">
              {openJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="bg-white rounded-xl border border-slate-100 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-medium text-[#2D7A3E] bg-[#C9E8D8] px-1.5 py-0.5 rounded-full">
                          {job.category}
                        </span>
                        {job.emergency && (
                          <span className="text-[10px] font-medium text-[#B36D25] bg-[#F5DCC8] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Siren className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm text-foreground truncate">{job.title}</h3>
                      {job.location_name && (
                        <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                          <MapPin className="w-2.5 h-2.5" /> {job.location_name}
                        </p>
                      )}
                      {job._dist != null && job._dist !== Infinity && (
                        <p className={`text-[10px] font-medium mt-0.5 ${job._dist <= (provider?.service_radius_km || 10) ? "text-[#2D7A3E]" : "text-muted-foreground"}`}>
                          {job._dist < 1 ? `${Math.round(job._dist * 1000)} m` : `${job._dist.toFixed(1)} km`}
                        </p>
                      )}
                      {job.budget != null && (
                        <p className="text-xs font-semibold text-foreground mt-0.5">KES {job.budget}</p>
                      )}
                    </div>
                    <Button
                      onClick={() => setBidJob(job)}
                      disabled={!provider}
                      className="rounded-lg bg-[#2D7A3E] hover:bg-[#246332] h-8 px-3 shrink-0 text-xs"
                    >
                      <Check className="w-3 h-3 mr-0.5" /> Offer
                    </Button>
                  </div>
                </div>
              ))}
              {openJobs.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">+{openJobs.length - 5} more</p>
              )}
            </div>
          )}
        </div>
      </PullToRefresh>

      <BidDialog
        open={!!bidJob}
        onOpenChange={(v) => !v && setBidJob(null)}
        job={bidJob}
        provider={provider}
        onDone={load}
      />
    </div>
  );
}