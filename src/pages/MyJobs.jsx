import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CategoryIcon from "@/components/CategoryIcon";
import RateDialog from "@/components/RateDialog";
import BidsDialog from "@/components/BidsDialog";
import TrackProviderDialog from "@/components/TrackProviderDialog";
import { getOrCreateConversation } from "@/lib/chat";
import { useAuth } from "@/lib/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Siren, MapPin, CheckCircle2, Users, MessageCircle, Navigation, Briefcase } from "lucide-react";
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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { active, loading: subLoading } = useSubscription();

  const load = async () => {
    const [jobList, allBids] = await Promise.all([
      base44.entities.ServiceRequest.list("-created_date", 100),
      base44.entities.JobBid.list("-created_date", 200),
    ]);
    // Filter by role: customers see jobs they posted, providers see jobs assigned to them + open board
    const filtered = user?.role === "customer"
      ? jobList.filter(j => j.customer_id === user.id)
      : jobList.filter(j => j.assigned_provider_id === user.id || j.status === "open");
    setJobs(filtered);
    const counts = {};
    allBids.forEach((b) => {
      counts[b.request_id] = (counts[b.request_id] || 0) + 1;
    });
    setBidCounts(counts);
  };

  useEffect(() => {
    // Providers need subscription to access job board (browse & bid)
    if (user?.role === "provider" && !subLoading && !active) {
      navigate("/subscribe");
      return;
    }
    load();
  }, [user?.role, active, subLoading]);

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

      {/* Horizontal scroll */}
      <div className="flex-1 min-h-0 overflow-x-auto px-4 py-3" style={{ paddingTop: 'calc(8px + env(safe-area-inset-top, 0px))' }}>
        <div className="flex gap-3 pb-2 h-full">
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
          {jobs.slice(0, 8).map((job) => {
            const icon = CATEGORIES.find((c) => c.name === job.category)?.icon;
            const count = bidCounts[job.id] || 0;
            return (
              <div key={job.id} className="min-w-[220px] shrink-0 bg-card rounded-lg border border-border p-3">
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
                  <Button
                    onClick={() => setBidsJob(job)}
                    variant="outline"
                    className="w-full mt-3 rounded-lg h-9 gap-1.5 text-sm"
                  >
                    <Users className="w-4 h-4" /> Offers{count > 0 ? ` (${count})` : ""}
                  </Button>
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
          {jobs.length > 8 && (
            <p className="text-sm text-muted-foreground text-center py-2">+{jobs.length - 8} more</p>
          )}
        </div>
      </div>

      {rating && <RateDialog open={!!rating} onOpenChange={(v) => !v && setRating(null)} request={rating} onDone={load} />}
      <BidsDialog open={!!bidsJob} onOpenChange={(v) => !v && setBidsJob(null)} job={bidsJob} onDone={load} />
      <TrackProviderDialog open={!!trackJob} onOpenChange={(v) => !v && setTrackJob(null)} job={trackJob} />
    </div>
  );
}