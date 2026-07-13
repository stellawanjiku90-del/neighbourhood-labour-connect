import React from "react";
import { ShieldCheck, Lock, MessageCircle, Star, MapPin, Headset } from "lucide-react";

const INDICATORS = [
  { icon: ShieldCheck, label: "Verified Professionals" },
  { icon: Lock, label: "Secure Payments" },
  { icon: MessageCircle, label: "Live Messaging" },
  { icon: Star, label: "Ratings & Reviews" },
  { icon: MapPin, label: "Location-based Matching" },
  { icon: Headset, label: "Customer Support" },
];

export default function TrustIndicators() {
  return (
    <section className="py-4 md:py-6 px-4 md:px-8 shrink-0">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 max-w-3xl mx-auto">
        {INDICATORS.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <item.icon className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-medium text-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}