import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function LandingHero() {
  return (
    <section className="relative isolate shrink-0 overflow-hidden bg-gradient-to-b from-secondary/60 via-background to-background px-5 py-14 text-center sm:py-16 md:px-8 md:py-20">
      <h1 className="mx-auto max-w-5xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl">
        Find a local professional.{" "}
        <span className="text-primary">Find your next job.</span>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
        Need a hand at home? Find nearby help. Have a skill to offer? Connect with local customers looking for your work.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/auth" className="w-full sm:w-auto">
          <Button className="h-12 w-full rounded-2xl bg-[#1A1F2E] px-7 text-base font-semibold hover:bg-[#2A2F45]">
            Create an account <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
        <Link to="/auth" className="w-full sm:w-auto">
          <Button variant="outline" className="h-12 w-full rounded-2xl px-7 text-base font-semibold">
            Sign in
          </Button>
        </Link>
      </div>
    </section>
  );
}