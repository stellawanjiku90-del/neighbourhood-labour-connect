import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CategoryIcon from "@/components/CategoryIcon";
import RateDialog from "@/components/RateDialog";
import BidsDialog from "@/components/BidsDialog";
import BidDialog from "@/components/BidDialog";
import TrackProviderDialog from "@/components/TrackProviderDialog";
import { getOrCreateConversation } from "@/lib/chat";
import { useAuth } from "@/lib/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { CATEGORIES, distanceKm } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Siren, MapPin, CheckCircle2, Users, MessageCircle, Navigation, Briefcase, Check } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";

const STATUS_STYLE = {
  open: "bg-[#CFE0F0] text-[#5A6072]",
  accepted: "bg-[#C9E8D8] text-[#2D7A3E]",
  in_progress: "bg-[#C9E8D8] text-[#2D7A3E]",
  completed: "bg-secondary text-secondary-foreground",
  cancelled: "bg-muted text-muted-foreground",
};

export default function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [bidCounts, setBidCounts] = useState({});
  const [rating, setRating] = useState(null);
  const [bidsJob, setBidsJob] = useState(null);
  const [trackJob, setTrackJob] = useState(null);
  const [bidJob, setBidJob] = useState(null);
  const [provider, setProvider] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { active, loading: subLoading } = useSubscription();

  const load = async () => {
    const jobList = await base44.entities.ServiceRequest.list("-created_date", 100);

    let filtered;
    if (user?.role === "customer") {
      filtered = jobList.filter(j => j.customer_id === user.id);
    } else {
      // Providers: show assigned jobs + open jobs matching their skills and service area
      let prov = provider;
      if (!prov && user?.phone) {
        const provs = await base44.entities.ServiceProvider.filter({ phone: user.phone }, "-created_date", 1);
        prov = provs[0] || null;
        if (prov) setProvider(prov);
      }

      const assignedJobs = jobList.filter(j => j.assigned_provider_id === user.id);
      const matchingOpenJobs = prov
        ? jobList.filter(j => {
            if (j.status !== "open") return false;
            // Match by profession
            const professionMatch = prov.professions?.some(p =>
              p.toLowerCase() === j.category?.toLowerCase()
            );
            if (!professionMatch) return false;
            // Match by location (within service radius)
            if (prov.lat != null && prov.lng != null && j.lat != null && j.lng != null) {
              const dist = distanceKm(prov.lat, prov.lng, j.lat, j.lng);
              if (dist == null) return false;
              return dist <= (prov.service_radius_km || 10);
            }
            return true;
          })
        : jobList.filter(j => j.status === "open");

      filtered = [...assignedJobs, ...matchingOpenJobs];
    }
    setJobs(filtered);

    // Only fetch bid counts for customers (on their own jobs).
    // Providers must not see other providers' bids.
    if (user?.role === "customer") {
      const allBids = await base44.entities.JobBid.list("-created_date", 200);
      const counts = {};
      allBids.forEach((b) => {
        counts[b.request_id] = (counts[b.request_id] || 0) + 1;
      });
      setBidCounts(counts);
    } else {
      setBidCounts({});
    }
  };

  useEffect(() => {
    // Providers need subscription to access job board (browse & bid)
    if (user?.role === "provider" && !subLoading && !active) {
      navigate("/subscribe");
      return;
    }
    load();
  }, [user?.role, active, subLoading]);

  // Fetch provider record for bidding (providers only)
  useEffect(() => {
    if (user?.role === "provider" && user?.phone) {
      base44.entities.ServiceProvider.filter({ phone: user.phone }, "-created_date", 1)
        .then((r) => setProvider(r[0] || null))
        .catch(() => setProvider(null));
    }
  }, [user?.role, user?.phone]);

  const complete = async (job) => {
    await base44.entities.ServiceRequest.update(job.id, { status: "completed" });
    load();
  };

  const messageProvider = async (job) => {
    if (!user || !job.assigned_provider_id) return;
    const convo = await getOrCreateConversation({
      providerId: job.assigned_provider_id,
      providerName: job.assigned_provider_name,
      customerId: user.id,
      customerName: user.full_name,
    });
    navigate(`/chat/${convo.id}`);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 px-4 md:px-8 pt-3 pb-2 bg-background" style={{ paddingTop: 'calc(12px + env(safe-area-inset-top, 0px))' }}>
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground shrink-0">
              <Briefcase className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground leading-tight">
                {user?.role === "customer" ? "My Jobs" : "Job Board"}
              </p>
              <p className="text-xs text-muted-foreground leading-tight">
                {user?.role === "customer" ? "Track your requests" : "Browse & bid on jobs"}
              </p>
            </div>
          </div>
          {user?.role === "customer" && (
            <Button onClick={() => navigate("/post")} className="rounded-xl h-10 px-4 shrink-0">
              <Users className="w-4 h-4" /> Post
            </Button>
          )}
        </div>
      </header>

      {/* Vertical list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3" style={{ paddingTop: 'calc(8px + env(safe-area-inset-top, 0px))' }}>
        <div className="flex flex-col gap-3">
          {jobs.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={Briefcase}
                title={user?.role === "customer" ? "No jobs yet" : "No jobs available"}
                description={user?.role === "customer" ? "Post a job to get free quotes from local providers near you." : "Check back later for new jobs in your area."}
                actionLabel={user?.role === "customer" ? "Post a job" : undefined}
                onAction={user?.role === "customer" ? () => navigate("/post") : undefined}
              />
            </div>
          )}
          {jobs.map((job) => {
            const icon = CATEGORIES.find((c) => c.name === job.category)?.icon;
            const count = bidCounts[job.id] || 0;
            return (
              <div key={job.id} className="w-full bg-card rounded-lg border border-border p-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground shrink-0">
                    <CategoryIcon name={icon} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-sm text-foreground truncate">{job.title}</h3>
                      {job.emergency && <Siren className="w-3.5 h-3.5 text-[#B36D25] shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{job.category}</p>
                    {job.location_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                        <MapPin className="w-3 h-3" /> {job.location_name}
                      </p>
                    )}
                    {job.assigned_provider_name && job.status !== "open" && (
                      <p className="text-xs text-[#2D7A3E] font-medium mt-1 truncate">{job.assigned_provider_name}</p>
                    )}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${STATUS_STYLE[job.status]}`}>
                    {job.status.replace("_", " ")}
                  </span>
                </div>

                {job.status === "open" && (
                  user?.role === "customer" ? (
                    <Button
                      onClick={() => setBidsJob(job)}
                      variant="outline"
                      className="w-full mt-3 rounded-lg h-9 gap-1.5 text-sm"
                    >
                      <Users className="w-4 h-4" /> Offers{count > 0 ? ` (${count})` : ""}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setBidJob(job)}
                      className="w-full mt-3 rounded-lg h-9 gap-1.5 text-sm"
                    >
                      <Check className="w-4 h-4" /> Apply
                    </Button>
                  )
                )}

                {(job.status === "accepted" || job.status === "in_progress") && (
                  <div className="space-y-2 mt-3">
                    {job.assigned_provider_id && (
                      <Button
                        onClick={() => setTrackJob(job)}
                        variant="outline"
                        className="w-full rounded-lg h-9 gap-1.5 text-sm border-[#2D7A3E]/30 text-[#2D7A3E]"
                      >
                        <Navigation className="w-4 h-4" /> Track location
                      </Button>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => messageProvider(job)}
                        variant="outline"
                        className="flex-1 rounded-lg h-9 gap-1.5 text-sm"
                      >
                        <MessageCircle className="w-4 h-4" /> Message
                      </Button>
                      <Button
                        onClick={() => complete(job)}
                        className="flex-1 rounded-lg h-9 gap-1.5 text-sm bg-primary hover:bg-primary/90"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Complete
                      </Button>
                    </div>
                  </div>
                )}

                {job.status === "completed" && !job.rated && job.assigned_provider_id && (
                  <Button
                    onClick={() => setRating(job)}
                    className="w-full mt-3 rounded-lg h-9 gap-1.5 text-sm bg-primary hover:bg-primary/90"
                  >
                    ⭐ Rate provider
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {rating && <RateDialog open={!!rating} onOpenChange={(v) => !v && setRating(null)} request={rating} onDone={load} />}
      <BidsDialog open={!!bidsJob} onOpenChange={(v) => !v && setBidsJob(null)} job={bidsJob} onDone={load} />
      <TrackProviderDialog open={!!trackJob} onOpenChange={(v) => !v && setTrackJob(null)} job={trackJob} />
      <BidDialog open={!!bidJob} onOpenChange={(v) => !v && setBidJob(null)} job={bidJob} provider={provider} onDone={load} />
    </div>
  );
}