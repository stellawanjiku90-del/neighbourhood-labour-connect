import React, { useEffect, useState } from "react";
import { apiClient } from "@/api/apiClient";
import CategoryIcon from "@/components/CategoryIcon";
import BidDialog from "@/components/BidDialog";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { MapPin, Siren, Check, Loader2 } from "lucide-react";

export default function JobsBrowse({ max = 12 }) {
  const [openJobs, setOpenJobs] = useState([]);
  const [bidJob, setBidJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const jobs = await apiClient.entities.ServiceRequest.filter(
      { status: "open" }, "-created_date", max
    );
    setOpenJobs(jobs);
    setLoading(false);
  };

  useEffect(() => { load(); }, [max]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex gap-3 pb-2 h-full">
      {openJobs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center w-full py-8">No open jobs posted yet.</p>
      ) : openJobs.map((job) => {
        const icon = CATEGORIES.find((c) => c.name === job.category)?.icon;
        return (
          <div key={job.id} className="min-w-[200px] shrink-0 bg-card rounded-lg border border-border p-3">
            <div className="flex items-start gap-2.5">
              <span className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground shrink-0">
                <CategoryIcon name={icon} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm text-foreground truncate">{job.title}</h3>
                  {job.emergency && <Siren className="w-3.5 h-3.5 text-warning shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{job.category}</p>
                {job.location_name && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3 h-3" /> {job.location_name}
                  </p>
                )}
              </div>
            </div>
            {job.budget != null && <p className="text-xs font-bold text-foreground mt-2">KES {job.budget}</p>}
            <Button
              onClick={() => setBidJob(job)}
              className="w-full mt-3 rounded-lg h-9 gap-1.5 text-sm"
            >
              <Check className="w-4 h-4" /> Apply
            </Button>
          </div>
        );
      })}
      {bidJob && <BidDialog open={!!bidJob} onOpenChange={(v) => { if (!v) setBidJob(null); }} job={bidJob} provider={null} onDone={load} />}
    </div>
  );
}