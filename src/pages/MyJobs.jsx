import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import CategoryIcon from "@/components/CategoryIcon";
import RateDialog from "@/components/RateDialog";
import BidsDialog from "@/components/BidsDialog";
import { getOrCreateConversation } from "@/lib/chat";
import { useAuth } from "@/lib/AuthContext";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Siren, MapPin, CheckCircle2, Users, MessageCircle } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";

const STATUS_STYLE = {
  open: "bg-[#CFE0F0] text-[#5A6072]",
  accepted: "bg-[#C9E8D8] text-[#2D7A3E]",
  in_progress: "bg-[#C9E8D8] text-[#2D7A3E]",
  completed: "bg-secondary text-secondary-foreground",
  cancelled: "bg-slate-100 text-slate-400",
};

export default function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [bidCounts, setBidCounts] = useState({});
  const [rating, setRating] = useState(null);
  const [bidsJob, setBidsJob] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const load = async () => {
    const [jobList, allBids] = await Promise.all([
      base44.entities.ServiceRequest.list("-created_date", 100),
      base44.entities.JobBid.list("-created_date", 200),
    ]);
    setJobs(jobList);
    const counts = {};
    allBids.forEach((b) => {
      counts[b.request_id] = (counts[b.request_id] || 0) + 1;
    });
    setBidCounts(counts);
  };

  useEffect(() => {
    load();
  }, []);

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
    <div className="h-[100dvh] flex flex-col overflow-hidden max-w-3xl mx-auto">
      {/* Compact header */}
      <header className="shrink-0 px-4 md:px-8 py-3 border-b border-slate-100 bg-background flex items-center justify-between">
        <h1 className="text-lg font-extrabold text-foreground">My Jobs</h1>
        <Button onClick={() => navigate("/post")} className="h-8 text-xs rounded-xl">
          <Users className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Post</span>
        </Button>
      </header>

      {/* Horizontal scroll only - NO vertical scroll */}
      <div className="flex-1 min-h-0 overflow-x-auto px-4 py-2">
        <div className="flex gap-2 pb-1 h-full">
          {jobs.length === 0 && (
            <p className="text-muted-foreground text-xs text-center w-full py-4">No requests yet</p>
          )}
          {jobs.slice(0, 8).map((job) => {
            const icon = CATEGORIES.find((c) => c.name === job.category)?.icon;
            const count = bidCounts[job.id] || 0;
            return (
              <div key={job.id} className="min-w-[220px] shrink-0 bg-white rounded-lg border border-slate-100 p-2">
                <div className="flex items-start gap-2">
                  <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground shrink-0">
                    <CategoryIcon name={icon} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold text-xs text-foreground truncate">{job.title}</h3>
                      {job.emergency && <Siren className="w-3 h-3 text-[#B36D25] shrink-0" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{job.category}</p>
                    {job.location_name && (
                      <p className="text-[9px] text-muted-foreground flex items-center gap-0.5 mt-0.5 truncate">
                        <MapPin className="w-2 h-2" /> {job.location_name}
                      </p>
                    )}
                    {job.assigned_provider_name && job.status !== "open" && (
                      <p className="text-[9px] text-[#2D7A3E] font-medium mt-0.5 truncate">
                        {job.assigned_provider_name}
                      </p>
                    )}
                  </div>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[job.status]}`}>
                    {job.status.replace("_", " ")}
                  </span>
                </div>

                {job.status === "open" && (
                  <Button
                    onClick={() => setBidsJob(job)}
                    variant="outline"
                    className="w-full mt-1.5 rounded h-7 gap-1 text-[10px]"
                  >
                    <Users className="w-3 h-3" /> Offers{count > 0 ? `(${count})` : ""}
                  </Button>
                )}

                {(job.status === "accepted" || job.status === "in_progress") && (
                  <div className="flex gap-1 mt-1.5">
                    <Button
                      onClick={() => messageProvider(job)}
                      variant="outline"
                      className="flex-1 rounded h-7 gap-1 text-[10px]"
                    >
                      <MessageCircle className="w-3 h-3" /> Chat
                    </Button>
                    <Button
                      onClick={() => complete(job)}
                      className="flex-1 rounded h-7 gap-1 text-[10px] bg-[#1A1F2E] hover:bg-[#2A2F45]"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </Button>
                  </div>
                )}

                {job.status === "completed" && !job.rated && job.assigned_provider_id && (
                  <Button
                    onClick={() => setRating(job)}
                    className="w-full mt-1.5 rounded h-7 gap-1 text-[10px] bg-[#1A1F2E] hover:bg-[#2A2F45]"
                  >
                    ⭐ Rate
                  </Button>
                )}
              </div>
            );
          })}
          {jobs.length > 8 && (
            <p className="text-xs text-muted-foreground text-center w-full py-2">+{jobs.length - 8} more</p>
          )}
        </div>
      </div>

      {rating && <RateDialog open={!!rating} onOpenChange={(v) => !v && setRating(null)} request={rating} onDone={load} />}
      <BidsDialog open={!!bidsJob} onOpenChange={(v) => !v && setBidsJob(null)} job={bidsJob} onDone={load} />
    </div>
  );
}