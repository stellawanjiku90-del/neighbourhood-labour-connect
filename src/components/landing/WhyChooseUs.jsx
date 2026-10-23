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
    <section className="py-10 md:py-14 px-5 md:px-10 shrink-0">
      <h2 className="font-display font-bold text-foreground text-2xl md:text-3xl text-center mb-2">Why Choose Us?</h2>
      <p className="text-sm md:text-base text-muted-foreground text-center mb-8">Built for trust, speed and fairness</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
        {REASONS.map((reason, i) => (
          <div key={i} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center mb-3">
              <reason.icon className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">{reason.title}</p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{reason.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}