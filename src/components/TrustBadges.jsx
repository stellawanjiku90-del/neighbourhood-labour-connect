import React from "react";
import { ShieldCheck, Star, MapPin } from "lucide-react";

const BADGES = [
  { icon: ShieldCheck, label: "Verified pros" },
  { icon: Star, label: "Real reviews" },
  { icon: MapPin, label: "Local people" },
];

export default function TrustBadges() {
  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
      {BADGES.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col items-center text-center"
        >
          <Icon className="w-6 h-6 text-[#2D7A3E] mb-1" />
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}