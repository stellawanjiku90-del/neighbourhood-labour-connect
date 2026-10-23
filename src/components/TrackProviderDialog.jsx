import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiClient } from "@/api/apiClient";
import { Navigation, MapPin, Clock } from "lucide-react";

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

/**
 * Live-tracks the assigned provider's location for a job. Polls the
 * ServiceRequest every 15s for updated provider_lat/lng and renders an
 * OpenStreetMap embed with the provider + job markers and the distance
 * between them.
 */
export default function TrackProviderDialog({ open, onOpenChange, job }) {
  const [live, setLive] = useState(job);

  useEffect(() => {
    if (!open || !job?.id) return;
    let active = true;
    const poll = async () => {
      try {
        const j = await apiClient.entities.ServiceRequest.get(job.id);
        if (active) setLive(j);
      } catch {
        /* ignore — keep last known */
      }
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [open, job?.id]);

  const pLat = live?.provider_lat;
  const pLng = live?.provider_lng;
  const jLat = live?.lat;
  const jLng = live?.lng;
  const hasProvider = pLat != null && pLng != null;
  const hasJob = jLat != null && jLng != null;
  const dist =
    hasProvider && hasJob ? haversine(pLat, pLng, jLat, jLng) : null;

  let src = "";
  if (hasProvider && hasJob) {
    const pad = 0.01;
    const minLng = Math.min(pLng, jLng) - pad;
    const maxLng = Math.max(pLng, jLng) + pad;
    const minLat = Math.min(pLat, jLat) - pad;
    const maxLat = Math.max(pLat, jLat) + pad;
    src = `https://www.openstreetmap.org/export/embed.html?bbox=${minLng},${minLat},${maxLng},${maxLat}&layer=mapnik&marker=${pLat},${pLng}&marker=${jLat},${jLng}`;
  } else if (hasProvider) {
    src = `https://www.openstreetmap.org/export/embed.html?marker=${pLat},${pLng}&layer=mapnik`;
  } else if (hasJob) {
    src = `https://www.openstreetmap.org/export/embed.html?marker=${jLat},${jLng}&layer=mapnik`;
  }

  const updated = live?.provider_loc_updated_at
    ? new Date(live.provider_loc_updated_at)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-[#2D7A3E]" /> Track{" "}
            {live?.assigned_provider_name || "provider"}
          </DialogTitle>
        </DialogHeader>

        {!hasProvider ? (
          <div className="flex flex-col items-center py-8 text-center">
            <MapPin className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {hasJob
                ? "Provider hasn't shared their live location yet. They'll broadcast once they start the job."
                : "No location available for this job."}
            </p>
          </div>
        ) : (
          <>
            {src && (
              <iframe
                title="Provider location"
                src={src}
                className="w-full h-64 rounded-xl border border-slate-200"
                loading="lazy"
              />
            )}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-foreground font-medium">
                <Navigation className="w-4 h-4 text-[#2D7A3E]" />
                {dist != null
                  ? dist < 1
                    ? `${Math.round(dist * 1000)}m away`
                    : `${dist.toFixed(1)}km away`
                  : "Distance unknown"}
              </div>
              {updated && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" /> Updated{" "}
                  {updated.toLocaleTimeString()}
                </div>
              )}
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${pLat},${pLng}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-[#2D7A3E] font-medium text-center mt-1"
            >
              Open directions →
            </a>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}