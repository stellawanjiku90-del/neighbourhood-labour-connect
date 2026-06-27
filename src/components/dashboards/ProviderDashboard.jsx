import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PullToRefresh from "@/components/PullToRefresh";
import BidDialog from "@/components/BidDialog";
import { getOrCreateConversation } from "@/lib/chat";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { Wallet, Star, Briefcase, Siren, MapPin, Check, Wrench, Bell, CheckCircle2, MessageCircle, ListFilter } from "lucide-react";

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

  if (loadingProvider) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center px-8">
        <Wrench className="w-10 h-10 text-[#2D7A3E] mb-3" />
        <h2 className="text-lg font-bold text-foreground mb-1">Become a Provider</h2>
        <p className="text-xs text-muted-foreground mb-4 text-center">Create your profile to receive jobs</p>
        <Button onClick={() => navigate("/become-provider")} className="rounded-xl bg-[#2D7A3E] h-10 px-6">
          Get Started
        </Button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      {/* Ultra-compact header */}
      <header className="shrink-0 px-4 py-2 border-b border-slate-100 bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="Logo" className="w-6 h-6 rounded-full" />
            <h1 className="text-base font-bold text-foreground">{firstName}</h1>
          </div>
          <button
            onClick={toggleAvailable}
            className={`text-xs font-semibold px-2.5 py-1 rounded-md ${provider.available ? "bg-[#C9E8D8] text-[#2D7A3E]" : "bg-slate-100 text-muted-foreground"}`}
          >
            {provider.available ? "Available" : "Unavailable"}
          </button>
        </div>
      </header>

      {/* Stats row */}
      <div className="shrink-0 px-4 py-2 bg-background">
        <div className="grid grid-cols-3 gap-1.5">
          <div className="bg-white rounded-lg p-2 border border-slate-100 text-center">
            <Wallet className="w-3 h-3 text-[#2D7A3E] mx-auto mb-0.5" />
            <p className="text-base font-bold text-foreground">{provider.earnings || 0}</p>
            <p className="text-[9px] text-muted-foreground">KES</p>
          </div>
          <div className="bg-[#C9E8D8] rounded-lg p-2 text-center">
            <Briefcase className="w-3 h-3 text-[#2D7A3E] mx-auto mb-0.5" />
            <p className="text-base font-bold text-[#2D7A3E]">{provider.completed_jobs || 0}</p>
            <p className="text-[9px] text-[#2D7A3E]/80">Jobs</p>
          </div>
          <div className="bg-[#F5DCC8] rounded-lg p-2 text-center">
            <Star className="w-3 h-3 text-[#B36D25] mx-auto mb-0.5" />
            <p className="text-base font-bold text-[#B36D25]">{(provider.rating || 0).toFixed(1)}</p>
            <p className="text-[9px] text-[#B36D25]/80">Rating</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 px-4 py-1.5 border-t border-b border-slate-100 bg-background">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("assigned")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md ${activeTab === "assigned" ? "bg-[#C9E8D8] text-[#2D7A3E]" : "text-muted-foreground"}`}
          >
            Assigned ({assignedJobs.length})
          </button>
          <button
            onClick={() => setActiveTab("open")}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md ${activeTab === "open" ? "bg-[#C9E8D8] text-[#2D7A3E]" : "text-muted-foreground"}`}
          >
            Open ({openJobs.length})
          </button>
        </div>
      </div>

      {/* Content - horizontal scroll only, no vertical */}
      <div className="flex-1 min-h-0 overflow-x-auto px-4 py-2">
        <div className="flex gap-1.5 pb-1 h-full">
          {activeTab === "assigned" && assignedJobs.length === 0 && (
            <p className="text-xs text-muted-foreground text-center w-full py-4">No assigned jobs</p>
          )}
          {activeTab === "assigned" && assignedJobs.slice(0, 6).map((job) => (
            <div key={job.id} className="min-w-[180px] shrink-0 bg-[#C9E8D8] rounded-lg border border-[#2D7A3E]/20 p-2">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[9px] font-medium text-[#2D7A3E] bg-white/60 px-1 py-0.5 rounded-full truncate max-w-[120px]">
                  {job.category}
                </span>
                {job.emergency && <Siren className="w-2.5 h-2.5 text-[#B36D25]" />}
              </div>
              <h3 className="font-semibold text-xs text-foreground truncate">{job.title}</h3>
              {job.location_name && (
                <p className="text-[9px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" /> {job.location_name}
                </p>
              )}
              <div className="flex gap-1 mt-1.5">
                {job.status === "accepted" && (
                  <Button
                    onClick={() => startJob(job)}
                    disabled={completing === job.id}
                    className="flex-1 h-6 rounded bg-[#2D7A3E] text-[10px]"
                  >
                    {completing === job.id ? <div className="w-2.5 h-2.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Start</>}
                  </Button>
                )}
                <Button onClick={() => messageCustomer(job)} variant="outline" className="flex-1 h-6 rounded bg-white text-[10px]">
                  <MessageCircle className="w-2.5 h-2.5 mr-0.5" /> Chat
                </Button>
              </div>
            </div>
          ))}

          {activeTab === "open" && openJobs.length === 0 && (
            <p className="text-xs text-muted-foreground text-center w-full py-4">No open jobs</p>
          )}
          {activeTab === "open" && openJobs.slice(0, 6).map((job) => (
            <div key={job.id} className="min-w-[180px] shrink-0 bg-white rounded-lg border border-slate-100 p-2">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[9px] font-medium text-[#2D7A3E] bg-[#C9E8D8] px-1 py-0.5 rounded-full truncate max-w-[100px]">
                  {job.category}
                </span>
                {job.emergency && <Siren className="w-2.5 h-2.5 text-[#B36D25]" />}
              </div>
              <h3 className="font-semibold text-xs text-foreground truncate">{job.title}</h3>
              {job.location_name && (
                <p className="text-[9px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                  <MapPin className="w-2.5 h-2.5" /> {job.location_name}
                </p>
              )}
              {job._dist != null && job._dist !== Infinity && (
                <p className={`text-[9px] font-medium mt-0.5 ${job._dist <= (provider?.service_radius_km || 10) ? "text-[#2D7A3E]" : "text-muted-foreground"}`}>
                  {job._dist < 1 ? `${Math.round(job._dist * 1000)}m` : `${job._dist.toFixed(1)}km`}
                </p>
              )}
              {job.budget != null && <p className="text-[10px] font-bold text-foreground mt-0.5">KES {job.budget}</p>}
              <Button onClick={() => setBidJob(job)} className="w-full h-6 rounded bg-[#2D7A3E] mt-1 text-[10px]">
                <Check className="w-2.5 h-2.5 mr-0.5" /> Offer
              </Button>
            </div>
          ))}
        </div>
      </div>

      <BidDialog open={!!bidJob} onOpenChange={(v) => !v && setBidJob(null)} job={bidJob} provider={provider} onDone={load} />
    </div>
  );
}