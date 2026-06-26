import React from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, MapPin, Sparkles } from "lucide-react";
import Stars from "./Stars";

export default function ProviderCard({ provider, distance }) {
  return (
    <Link
      to={`/provider/${provider.id}`}
      className="block bg-white rounded-2xl p-4 border border-slate-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex gap-3">
        <div className="relative shrink-0">
          {provider.photo_url ? (
            <img
              src={provider.photo_url}
              alt={provider.name}
              loading="lazy"
              className="w-16 h-16 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xl">
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
          <div className="flex items-center gap-2 mt-1.5">
            <Stars value={provider.rating} size={13} />
            <span className="text-xs text-muted-foreground">
              {provider.rating?.toFixed(1)} ({provider.reviews_count})
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
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