import React from "react";
import { Link } from "react-router-dom";
import CategoryIcon from "@/components/CategoryIcon";
import { CATEGORIES } from "@/lib/categories";
import { Button } from "@/components/ui/button";

export default function LandingCategories() {
  const shown = CATEGORIES.slice(0, 16);
  return (
    <section className="py-6 md:py-8 px-4 md:px-8 shrink-0">
      <h2 className="font-display font-bold text-foreground text-lg md:text-2xl text-center mb-1">Browse Services</h2>
      <p className="text-xs md:text-sm text-muted-foreground text-center mb-5">
        Electricians, plumbers, cleaners, tutors and more — find local services near you
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-w-3xl mx-auto">
        {shown.map((cat) => (
          <div key={cat.name} className="flex items-center gap-2.5 bg-card rounded-xl border border-border p-2.5">
            <span className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground shrink-0">
              <CategoryIcon name={cat.icon} />
            </span>
            <span className="text-xs font-medium text-foreground truncate">{cat.name}</span>
          </div>
        ))}
      </div>
      <div className="text-center mt-4">
        <Link to="/auth">
          <Button variant="outline" className="rounded-xl h-10 px-6 text-sm font-semibold">
            View All Services
          </Button>
        </Link>
      </div>
    </section>
  );
}