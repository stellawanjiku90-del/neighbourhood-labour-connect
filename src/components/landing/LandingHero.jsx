import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Briefcase, Search } from "lucide-react";

const PATHS = [
  {
    to: "/auth?role=customer",
    title: "I need a service",
    description: "Find nearby professionals or post a job.",
    icon: Search,
  },
  {
    to: "/auth?role=provider",
    title: "I offer a service",
    description: "Share your skills and find local work.",
    icon: Briefcase,
  },
];

export default function LandingHero() {
  return (
    <section className="border-b border-border bg-gradient-to-b from-secondary/40 to-background px-5 py-14 sm:py-16 md:px-10 md:py-24">
      <div className="mx-auto max-w-[1000px]">
        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-primary sm:text-sm">
          Local help. Local work.
        </p>
        <h1 className="mx-auto max-w-4xl text-center font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Find help nearby.{" "}
          <span className="text-primary">Find your next job.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-relaxed text-muted-foreground sm:text-lg">
          Connect with people in your neighbourhood, whether you need a hand or have a skill to offer.
        </p>

        <div className="mx-auto mt-9 grid max-w-3xl gap-3 sm:grid-cols-2 sm:gap-4">
          {PATHS.map(({ to, title, description, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex min-h-[104px] items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-6"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold text-foreground sm:text-lg">{title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{description}</span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth" className="font-semibold text-primary underline-offset-4 hover:underline">
            Sign in with your phone
          </Link>
        </p>
      </div>
    </section>
  );
}
