import React from "react";
import { Link } from "react-router-dom";
import CategoryIcon from "@/components/CategoryIcon";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";

export default function LandingCategories() {
  const shown = CATEGORIES.slice(0, 12);

  return (
    <section id="services" className="scroll-mt-6 px-5 py-14 md:px-10 md:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-sm font-semibold text-primary">Services</p>
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            What can we help with?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Browse common services, from home repairs and cleaning to beauty and lessons.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4">
          {shown.map((cat) => (
            <div key={cat.name} className="flex min-h-[68px] items-center gap-3 rounded-2xl border border-border bg-card p-3 sm:min-h-[76px] sm:p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <CategoryIcon name={cat.icon} />
              </span>
              <span className="min-w-0 text-sm font-medium leading-snug text-foreground">{cat.name}</span>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <Button asChild variant="outline" className="h-11 rounded-xl px-5 text-sm font-semibold">
            <Link to="/auth?role=customer">Explore all services</Link>
          </Button>
          <span className="text-sm text-muted-foreground">Sign in to browse providers near you.</span>
        </div>
      </div>
    </section>
  );
}
