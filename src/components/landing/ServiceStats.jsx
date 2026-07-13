import React from "react";

const STATS = [
  { value: "15,000+", label: "Professionals" },
  { value: "8,000+", label: "Jobs Posted" },
  { value: "12", label: "African Countries" },
  { value: "98%", label: "Customer Satisfaction" },
];

export default function ServiceStats() {
  return (
    <section className="py-5 md:py-8 px-4 md:px-8 shrink-0">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 max-w-3xl mx-auto">
        {STATS.map((stat, i) => (
          <div key={i} className="text-center bg-card rounded-xl border border-border py-4 px-2">
            <p className="font-display font-extrabold text-primary text-xl md:text-3xl">{stat.value}</p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}