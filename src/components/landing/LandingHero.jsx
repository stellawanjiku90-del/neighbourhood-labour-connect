import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Smartphone } from "lucide-react";

export default function LandingHero() {
  return (
    <section className="relative isolate shrink-0 overflow-hidden bg-gradient-to-b from-secondary/60 via-background to-background px-5 py-14 text-center sm:py-16 md:px-8 md:py-20">
      <h1 className="font-display font-extrabold text-foreground text-4xl leading-[1.08] tracking-tight sm:text-5xl md:text-6xl max-w-5xl mx-auto">
        Find Work. Hire Trusted Professionals.{" "}
        <span className="text-primary">Anytime, Anywhere.</span>
      </h1>
      <p className="text-base md:text-lg text-muted-foreground mt-6 leading-relaxed max-w-2xl mx-auto">
        Connect with customers or find your next job in minutes. Join thousands of customers and professionals already using Neighbourhood Labour Connect.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
        <Link to="/auth" className="w-full sm:w-auto">
          <Button className="rounded-2xl bg-[#1A1F2E] hover:bg-[#2A2F45] h-12 px-7 w-full text-base font-semibold">
            Get Started <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
        <Link to="/auth" className="w-full sm:w-auto">
          <Button variant="outline" className="rounded-2xl h-12 px-7 w-full text-base font-semibold">
            Sign In
          </Button>
        </Link>
      </div>
      {/* Download buttons */}
      <div className="flex items-center justify-center gap-3 mt-7">
        <button className="flex items-center gap-2 bg-foreground text-background rounded-2xl px-5 h-12 hover:opacity-90 transition-opacity">
          <Play className="w-4 h-4 fill-current" />
          <div className="text-left">
            <p className="text-[8px] opacity-70 leading-none">GET IT ON</p>
            <p className="text-sm font-semibold leading-none mt-0.5">Google Play</p>
          </div>
        </button>
        <button className="flex items-center gap-2 bg-foreground text-background rounded-2xl px-5 h-12 hover:opacity-90 transition-opacity">
          <Smartphone className="w-4 h-4" />
          <div className="text-left">
            <p className="text-[8px] opacity-70 leading-none">Download on the</p>
            <p className="text-sm font-semibold leading-none mt-0.5">App Store</p>
          </div>
        </button>
      </div>
    </section>
  );
}