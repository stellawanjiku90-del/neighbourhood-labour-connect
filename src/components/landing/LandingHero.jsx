import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Smartphone } from "lucide-react";

export default function LandingHero() {
  return (
    <section className="text-center py-6 md:py-10 px-4 shrink-0">
      <h1 className="font-display font-extrabold text-foreground text-2xl md:text-4xl leading-tight max-w-3xl mx-auto">
        Find Work. Hire Trusted Professionals.{" "}
        <span className="text-primary">Anytime, Anywhere.</span>
      </h1>
      <p className="text-sm md:text-base text-muted-foreground mt-3 leading-relaxed max-w-xl mx-auto">
        Connect with customers or find your next job in minutes. Join thousands of customers and professionals already using Neighbourhood Labour Connect.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center mt-5">
        <Link to="/auth" className="w-full sm:w-auto">
          <Button className="rounded-xl bg-[#1A1F2E] hover:bg-[#2A2F45] h-11 px-6 w-full text-sm font-semibold">
            Get Started <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
        <Link to="/auth" className="w-full sm:w-auto">
          <Button variant="outline" className="rounded-xl h-11 px-6 w-full text-sm font-semibold">
            Sign In
          </Button>
        </Link>
      </div>
      {/* Download buttons */}
      <div className="flex items-center justify-center gap-3 mt-4">
        <button className="flex items-center gap-2 bg-foreground text-background rounded-xl px-4 h-11 hover:opacity-90 transition-opacity">
          <Play className="w-4 h-4 fill-current" />
          <div className="text-left">
            <p className="text-[8px] opacity-70 leading-none">GET IT ON</p>
            <p className="text-xs font-semibold leading-none mt-0.5">Google Play</p>
          </div>
        </button>
        <button className="flex items-center gap-2 bg-foreground text-background rounded-xl px-4 h-11 hover:opacity-90 transition-opacity">
          <Smartphone className="w-4 h-4" />
          <div className="text-left">
            <p className="text-[8px] opacity-70 leading-none">Download on the</p>
            <p className="text-xs font-semibold leading-none mt-0.5">App Store</p>
          </div>
        </button>
      </div>
    </section>
  );
}