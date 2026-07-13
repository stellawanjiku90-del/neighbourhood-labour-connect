import React from "react";
import { Zap, ShieldCheck, Lock, Wallet } from "lucide-react";

const REASONS = [
  { icon: Zap, title: "Fast Matching", desc: "Get matched with nearby professionals in minutes, not days." },
  { icon: ShieldCheck, title: "Trusted Professionals", desc: "Every provider is verified with ID checks and reviews." },
  { icon: Lock, title: "Secure Payments", desc: "Your transactions are protected with secure payment options." },
  { icon: Wallet, title: "Affordable Subscription", desc: "Providers pay a flat, low monthly fee — no hidden commissions." },
];

export default function WhyChooseUs() {
  return (
    <section className="py-6 md:py-8 px-4 md:px-8 shrink-0">
      <h2 className="font-display font-bold text-foreground text-lg md:text-2xl text-center mb-1">Why Choose Us?</h2>
      <p className="text-xs md:text-sm text-muted-foreground text-center mb-5">Built for trust, speed and fairness</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
        {REASONS.map((reason, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-4">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3">
              <reason.icon className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">{reason.title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{reason.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}