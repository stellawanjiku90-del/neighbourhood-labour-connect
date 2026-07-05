import React from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, MapPin, Sparkles } from "lucide-react";
import Stars from "./Stars";

function formatLastSeen(dateStr) {
  if (!dateStr) return "Offline";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ProviderCard({ provider, distance, compact = false, presence }) {
  if (compact) {
    return (
      <Link
        to={`/provider/${provider.id}`}
        className="block bg-white rounded-lg p-2 border border-slate-100"
      >
        <div className="flex gap-2">
          <div className="relative shrink-0">
            {provider.photo_url ? (
              <img src={provider.photo_url} alt={provider.name} loading="lazy" className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm">
                {provider.name?.[0]}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h3 className="font-semibold text-xs text-foreground truncate">{provider.name}</h3>
              {presence?.is_online && (
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  presence.provider_status === "busy" ? "bg-amber-500" :
                  "bg-green-500"
                }`} />
              )}
              {provider.verified && <BadgeCheck className="w-3 h-3 text-emerald-600 shrink-0" />}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">{(provider.professions || []).slice(0, 2).join(" · ")}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Stars value={provider.rating} size={10} />
              <span className="text-[9px] text-muted-foreground">{provider.rating?.toFixed(1)}</span>
            </div>
            {distance != null && (
              <p className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-0.5">
                <MapPin className="w-2 h-2" /> {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/provider/${provider.id}`}
      className="block bg-white rounded-2xl p-3 border border-slate-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex gap-3">
        <div className="relative shrink-0">
          {provider.photo_url ? (
            <img
              src={provider.photo_url}
              alt={provider.name}
              loading="lazy"
              className="w-14 h-14 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-lg">
              {provider.name?.[0]}
            </div>
          )}
          {provider.featured && (
            <span className="absolute -top-1 -right-1 bg-[#F5DCC8] text-[#B36D25] rounded-full p-1">
              <Sparkles className="w-3 h-3" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="font-bold text-foreground truncate">{provider.name}</h3>
            {provider.verified && <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {(provider.professions || []).join(" · ")}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Stars value={provider.rating} size={13} />
            <span className="text-xs text-muted-foreground">
              {provider.rating?.toFixed(1)} ({provider.reviews_count})
            </span>
          </div>
          {presence?.is_online && presence?.provider_status === "available" && (
            <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">Available Now</p>
          )}
          {presence?.is_online && presence?.provider_status === "busy" && (
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">Busy</p>
          )}
          {presence && !presence.is_online && presence.last_active && (
            <p className="text-xs text-muted-foreground mt-1">
              Last seen {formatLastSeen(presence.last_active)}
            </p>
          )}
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            {distance != null && (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3" /> {distance.toFixed(1)} km
              </span>
            )}
            <span>{provider.completed_jobs || 0} jobs</span>
          </div>
        </div>
      </div>
    </Link>
  );
}