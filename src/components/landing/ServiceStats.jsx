import React from "react";

const STATS = [
  { value: "15,000+", label: "Professionals" },
  { value: "8,000+", label: "Jobs Posted" },
  { value: "12", label: "African Countries" },
  { value: "98%", label: "Customer Satisfaction" },
];

export default function ServiceStats() {
  return (
    <section className="py-8 md:py-12 px-5 md:px-10 shrink-0">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 max-w-5xl mx-auto">
        {STATS.map((stat, i) => (
          <div key={i} className="text-center bg-card rounded-2xl border border-border py-6 px-4 shadow-sm">
            <p className="font-display font-extrabold text-primary text-2xl md:text-4xl">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}