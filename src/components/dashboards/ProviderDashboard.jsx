import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import PullToRefresh from "@/components/PullToRefresh";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { Wallet, Star, Briefcase, Siren, MapPin, Check, Wrench, Bell } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

export default function ProviderDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [provider, setProvider] = useState(null);
  const [openJobs, setOpenJobs] = useState([]);
  const [loadingProvider, setLoadingProvider] = useState(true);
  const [accepting, setAccepting] = useState(null);

  const phone = user?.phone;

  const load = async () => {
    const [providers, jobs] = await Promise.all([
      phone ? base44.entities.ServiceProvider.filter({ phone }, "-created_date", 1) : Promise.resolve([]),
      base44.entities.ServiceRequest.filter({ status: "open" }, "-created_date", 50),
    ]);
    setProvider(providers[0] || null);
    setOpenJobs(jobs);
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

  const acceptJob = async (job) => {
    if (!provider) return;
    setAccepting(job.id);
    try {
      await base44.entities.ServiceRequest.update(job.id, {
        status: "accepted",
        assigned_provider_id: provider.id,
        assigned_provider_name: provider.name,
      });
      setOpenJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch (e) {
      // ignore — button re-enables
    }
    setAccepting(null);
  };

  const firstName = user?.full_name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="h-full flex flex-col">
      <PullToRefresh onRefresh={load} className="px-4 md:px-8">
        <div className="max-w-5xl mx-auto py-4 md:py-6">
          <div className="flex items-center gap-2 mb-4 md:hidden">
            <img src={LOGO_URL} alt="Neighbourhood Labour Connect" className="w-8 h-8 rounded-full object-cover" />
            <span className="font-extrabold text-foreground">Neighbourhood Labour Connect</span>
          </div>

          <header className="mb-4">
            <p className="text-muted-foreground text-sm">{greet},</p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{firstName} 👋</h1>
            <p className="text-sm text-muted-foreground mt-1">Here's what's available near you.</p>
          </header>

          {loadingProvider ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
            </div>
          ) : !provider ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center mb-4">
              <Wrench className="w-10 h-10 text-[#2D7A3E] mx-auto mb-3" />
              <h2 className="text-lg font-bold text-foreground mb-1">Set up your provider listing</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Create your service provider profile to start receiving jobs.
              </p>
              <Button
                onClick={() => navigate("/become-provider")}
                className="rounded-2xl bg-[#2D7A3E] hover:bg-[#246332] h-12 px-6"
              >
                <Wrench className="w-4 h-4 mr-1" /> Become a Provider
              </Button>
            </div>
          ) : (
            <>
              {/* Availability toggle */}
              <button
                onClick={toggleAvailable}
                className="w-full flex items-center justify-between bg-white rounded-2xl border border-slate-100 p-4 mb-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${provider.available ? "bg-[#C9E8D8]" : "bg-slate-100"}`}>
                    <Bell className={`w-5 h-5 ${provider.available ? "text-[#2D7A3E]" : "text-muted-foreground"}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-foreground">{provider.available ? "Available" : "Unavailable"}</p>
                    <p className="text-xs text-muted-foreground">Tap to toggle your availability</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${provider.available ? "text-[#2D7A3E]" : "text-muted-foreground"}`}>
                  {provider.available ? "On" : "Off"}
                </span>
              </button>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
                <div className="bg-white rounded-2xl p-3 md:p-4 border border-slate-100">
                  <Wallet className="w-5 h-5 text-[#2D7A3E] mb-1" />
                  <p className="text-2xl md:text-3xl font-extrabold text-foreground">{provider.earnings || 0}</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">Earnings</p>
                </div>
                <div className="bg-[#C9E8D8] rounded-2xl p-3 md:p-4">
                  <Briefcase className="w-5 h-5 text-[#2D7A3E] mb-1" />
                  <p className="text-2xl md:text-3xl font-extrabold text-[#2D7A3E]">{provider.completed_jobs || 0}</p>
                  <p className="text-xs md:text-sm text-[#2D7A3E]/80 mt-1">Completed</p>
                </div>
                <div className="bg-[#F5DCC8] rounded-2xl p-3 md:p-4">
                  <Star className="w-5 h-5 text-[#B36D25] mb-1" />
                  <p className="text-2xl md:text-3xl font-extrabold text-[#B36D25]">{(provider.rating || 0).toFixed(1)}</p>
                  <p className="text-xs md:text-sm text-[#B36D25]/80 mt-1">Rating</p>
                </div>
              </div>
            </>
          )}

          {/* Open jobs */}
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-foreground">Open jobs near you</h2>
            <span className="text-sm text-muted-foreground">{openJobs.length} available</span>
          </div>

          {openJobs.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">No open jobs right now. Check back soon.</p>
          ) : (
            <div className="space-y-3">
              {openJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-[#2D7A3E] bg-[#C9E8D8] px-2 py-0.5 rounded-full">
                          {job.category}
                        </span>
                        {job.emergency && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#B36D25] bg-[#F5DCC8] px-2 py-0.5 rounded-full">
                            <Siren className="w-3 h-3" /> Emergency
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-foreground truncate">{job.title}</h3>
                      {job.location_name && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {job.location_name}
                        </p>
                      )}
                      {job.budget != null && (
                        <p className="text-sm font-semibold text-foreground mt-1">KES {job.budget}</p>
                      )}
                    </div>
                    <Button
                      onClick={() => acceptJob(job)}
                      disabled={!provider || accepting === job.id}
                      className="rounded-xl bg-[#2D7A3E] hover:bg-[#246332] h-10 px-4 shrink-0"
                    >
                      {accepting === job.id ? (
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" /> Accept
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
}