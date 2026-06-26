import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import CategoryIcon from "@/components/CategoryIcon";
import RateDialog from "@/components/RateDialog";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Siren, MapPin, Star, CheckCircle2 } from "lucide-react";
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
  const [rating, setRating] = useState(null);

  const load = () =>
    base44.entities.ServiceRequest.list("-created_date", 100).then(setJobs);

  useEffect(() => { load(); }, []);

  const refresh = async () => {
    const data = await base44.entities.ServiceRequest.list("-created_date", 100);
    setJobs(data);
  };

  const complete = async (job) => {
    await base44.entities.ServiceRequest.update(job.id, { status: "completed" });
    load();
  };

  return (
    <PullToRefresh onRefresh={refresh}>
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <h1 className="text-2xl font-extrabold text-foreground mb-6">My Jobs</h1>

      {jobs.length === 0 && (
        <p className="text-muted-foreground text-sm">No requests yet. Post one to get started.</p>
      )}

      <div className="space-y-3">
        {jobs.map((job) => {
          const icon = CATEGORIES.find((c) => c.name === job.category)?.icon;
          return (
            <div key={job.id} className="bg-white rounded-2xl p-4 border border-slate-100">
              <div className="flex items-start gap-3">
                <span className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground shrink-0">
                  <CategoryIcon name={icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground truncate">{job.title}</h3>
                    {job.emergency && <Siren className="w-4 h-4 text-[#B36D25] shrink-0" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{job.category}</p>
                  {job.location_name && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" /> {job.location_name}
                    </p>
                  )}
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[job.status]}`}>
                  {job.status.replace("_", " ")}
                </span>
              </div>

              {(job.status !== "completed" && job.status !== "cancelled") && (
                <Button
                  onClick={() => complete(job)}
                  variant="outline"
                  className="w-full mt-3 rounded-2xl h-11 gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark completed
                </Button>
              )}
              {job.status === "completed" && !job.rated && job.assigned_provider_id && (
                <Button
                  onClick={() => setRating(job)}
                  className="w-full mt-3 rounded-2xl h-11 gap-1 bg-[#1A1F2E] hover:bg-[#2A2F45]"
                >
                  <Star className="w-4 h-4" /> Rate provider
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {rating && (
        <RateDialog
          open={!!rating}
          onOpenChange={(v) => !v && setRating(null)}
          request={rating}
          onDone={load}
        />
      )}
    </div>
    </PullToRefresh>
  );
}