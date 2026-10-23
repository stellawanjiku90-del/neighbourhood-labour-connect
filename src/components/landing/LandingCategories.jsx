import React from "react";
import { Link } from "react-router-dom";
import CategoryIcon from "@/components/CategoryIcon";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";

export default function LandingCategories() {
  const shown = CATEGORIES.slice(0, 16);
  return (
    <section className="py-10 md:py-14 px-5 md:px-10 shrink-0">
      <h2 className="font-display font-bold text-foreground text-2xl md:text-3xl text-center mb-2">Browse Services</h2>
      <p className="text-sm md:text-base text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
        Electricians, plumbers, cleaners, tutors and more — find local services near you
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 max-w-5xl mx-auto">
        {shown.map((cat) => (
          <div key={cat.name} className="flex items-center gap-2.5 bg-card rounded-2xl border border-border p-3 md:p-4">
            <span className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-secondary-foreground shrink-0">
              <CategoryIcon name={cat.icon} />
            </span>
            <span className="text-sm font-medium text-foreground truncate">{cat.name}</span>
          </div>
        ))}
      </div>
      <div className="text-center mt-7">
        <Link to="/auth">
          <Button variant="outline" className="rounded-2xl h-11 px-7 text-sm font-semibold">
            View All Services
          </Button>
        </Link>
      </div>
    </section>
  );
}