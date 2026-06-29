import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CategorySearch from "@/components/CategorySearch";
import CategoryIcon from "@/components/CategoryIcon";
import ProviderCard from "@/components/ProviderCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { CATEGORIES, EMERGENCY_CATEGORIES, distanceKm } from "@/lib/categories";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { Plus, Siren, MapPin, Search, ChevronRight, Star, Loader2, Navigation } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { detect } = useGeoLocation();
  const { active, loading: subLoading } = useSubscription();
  const [top, setTop] = useState([]);
  const [openJobs, setOpenJobs] = useState([]);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  const firstName = user?.full_name?.split(" ")[0] || "there";

  const goToPostJob = () => {
    if (!subLoading && !active) {
      navigate("/subscribe");
    } else {
      navigate("/post");
    }
  };

  const refresh = useCallback(async () => {
    const [topData, jobsData] = await Promise.all([
      base44.entities.ServiceProvider.filter({ available: true }, "-rating", 12),
      base44.entities.ServiceRequest.filter({ status: "open" }, "-created_date", 30),
    ]);
    setTop(topData);
    setOpenJobs(jobsData);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Try to resolve current location once for the header + proximity sort.
  useEffect(() => {
    let active = true;
    setLocating(true);
    detect().then((res) => {
      if (active && res) setLocation(res);
      if (active) setLocating(false);
    });
    return () => { active = false; };
  }, [detect]);

  const nearby = location?.lat != null
    ? [...top]
        .map((p) => ({ ...p, _dist: distanceKm(location.lat, location.lng, p.lat, p.lng) }))
        .filter((p) => p._dist != null)
        .sort((a, b) => a._dist - b._dist)
        .slice(0, 6)
    : top.slice(0, 6);

  const emergencies = openJobs.filter((j) => j.emergency).slice(0, 4);
  const featuredCats = CATEGORIES.slice(0, 8);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header: greeting + location */}
      <header className="shrink-0 px-4 md:px-8 pt-3 pb-2 bg-background" style={{ paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))' }}>
        <div className="flex items-center justify-between gap-3 max-w-[1200px] mx-auto">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={LOGO_URL} alt="NLC" className="w-9 h-9 rounded-xl shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground leading-tight">Hello, {firstName}</p>
              <button
                onClick={() => { setLocating(true); detect().then((r) => { setLocation(r); setLocating(false); }); }}
                className="flex items-center gap-1 text-sm font-bold text-foreground leading-tight truncate"
              >
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate max-w-[160px]">
                  {locating ? "Locating…" : location?.location_name || "Set location"}
                </span>
              </button>
            </div>
          </div>
          <Button onClick={goToPostJob} className="rounded-xl h-10 px-4 shrink-0">
            <Plus className="w-4 h-4" /> Post Job
          </Button>
        </div>

        {/* Search */}
        <div className="mt-3 max-w-[1200px] mx-auto">
          <CategorySearch
            value=""
            onChange={(v) => v && navigate(`/providers?category=${encodeURIComponent(v)}`)}
            placeholder="What do you need help with?"
          />
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 pb-6 space-y-5 max-w-[1200px] mx-auto">
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={goToPostJob}
            className="rounded-2xl bg-primary text-primary-foreground p-4 text-left flex flex-col gap-1 active:scale-[0.98] transition-transform"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-bold">Post a Job</span>
            <span className="text-[11px] opacity-90">Get free quotes fast</span>
          </button>
          <button
            onClick={() => navigate("/providers")}
            className="rounded-2xl bg-accent text-accent-foreground p-4 text-left flex flex-col gap-1 active:scale-[0.98] transition-transform"
          >
            <Search className="w-5 h-5" />
            <span className="text-sm font-bold">Find Help</span>
            <span className="text-[11px] opacity-80">Browse local pros</span>
          </button>
        </div>

        {/* Emergency banner */}
        <div
          onClick={() => goToPostJob()}
          className="flex items-center gap-3 rounded-2xl bg-warning-soft border border-warning/20 p-3 active:scale-[0.99] transition-transform cursor-pointer"
        >
          <span className="w-10 h-10 rounded-xl bg-warning text-warning-foreground flex items-center justify-center shrink-0">
            <Siren className="w-5 h-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-warning-soft-foreground">Emergency? Request now</p>
            <p className="text-[11px] text-warning-soft-foreground/80">Electricians, plumbers & guards on call</p>
          </div>
          <ChevronRight className="w-4 h-4 text-warning-soft-foreground/60" />
        </div>

        {/* Featured categories */}
        <section>
          <SectionTitle>Browse categories</SectionTitle>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5">
            {featuredCats.map((c) => (
              <button
                key={c.name}
                onClick={() => navigate(`/providers?category=${encodeURIComponent(c.name)}`)}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
              >
                <span className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center">
                  <CategoryIcon name={c.icon} className="w-6 h-6 text-primary" />
                </span>
                <span className="text-[10px] font-medium text-foreground text-center leading-tight line-clamp-2">
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Nearby providers */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <SectionTitle className="mb-0">Nearby providers</SectionTitle>
            <Link to="/providers" className="text-xs font-semibold text-primary flex items-center gap-0.5">
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {nearby.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No providers available yet.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
              {nearby.map((p) => (
                <div key={p.id} className="min-w-[230px] shrink-0">
                  <ProviderCard provider={p} distance={p._dist} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Popular services (top-rated) */}
        <section>
          <SectionTitle>Top rated</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {top.slice(0, 4).map((p) => (
              <ProviderCard key={p.id} provider={p} distance={location?.lat != null ? distanceKm(location.lat, location.lng, p.lat, p.lng) : null} />
            ))}
          </div>
        </section>

        {/* Recent activity / open jobs */}
        <section>
          <SectionTitle>Recent job posts</SectionTitle>
          {openJobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">No open jobs in your area yet.</p>
              <Button onClick={goToPostJob} variant="outline" className="rounded-xl">
                <Plus className="w-4 h-4" /> Post the first job
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {openJobs.slice(0, 5).map((job) => {
                const icon = CATEGORIES.find((c) => c.name === job.category)?.icon;
                return (
                  <div key={job.id} className="flex items-center gap-3 bg-card rounded-2xl border border-border p-3">
                    <span className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center shrink-0">
                      <CategoryIcon name={icon} className="w-5 h-5 text-accent-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground truncate">{job.title}</p>
                        {job.emergency && <Siren className="w-3.5 h-3.5 text-warning shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{job.category}{job.location_name ? ` · ${job.location_name}` : ""}</p>
                    </div>
                    {job.budget != null && <p className="text-sm font-bold text-foreground shrink-0">KES {job.budget}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ children, className = "" }) {
  return <h2 className={`text-sm font-bold text-foreground mb-2 ${className}`}>{children}</h2>;
}