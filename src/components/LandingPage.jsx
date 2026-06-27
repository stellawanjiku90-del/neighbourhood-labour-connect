import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

export default function LandingPage() {
  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-100 bg-background/90 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-14 flex items-center gap-2.5">
          <img src={LOGO_URL} alt="Neighbourhood Labour Connect logo" className="w-9 h-9 rounded-full object-cover" />
          <span className="font-extrabold text-foreground text-base md:text-lg">Neighbourhood Labour Connect</span>
        </div>
      </header>

      {/* Hero — centered, fills available space */}
      <main className="flex-1 min-h-0 flex items-center justify-center px-4 md:px-8">
        <div className="w-full max-w-2xl text-center">
          <img
            src={LOGO_URL}
            alt="Neighbourhood Labour Connect"
            className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover mx-auto mb-4"
          />
          <h1 className="text-2xl md:text-4xl font-extrabold text-foreground mb-2 leading-tight">
            Neighbourhood Labour Connect
          </h1>
          <p className="text-base md:text-lg font-semibold text-foreground mb-3">
            Trusted local help, on demand.
          </p>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-6 leading-relaxed">
            Connect with trusted cleaners, plumbers, electricians, barbers, tutors, movers,
            nannies, drivers, and other local service providers. Post a job, receive offers,
            compare ratings, and hire with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/firebase-auth" className="w-full sm:w-auto">
              <Button className="rounded-2xl bg-[#1A1F2E] hover:bg-[#2A2F45] h-12 px-8 w-full">
                Get Started <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/firebase-auth" className="w-full sm:w-auto">
              <Button variant="outline" className="rounded-2xl h-12 px-8 w-full">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Compact about strip at the bottom */}
      <footer className="shrink-0 border-t border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 md:py-4 text-center">
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
            Find trusted nearby verified providers and compare offers, ratings, and reviews before hiring.
          </p>
        </div>
      </footer>
    </div>
  );
}