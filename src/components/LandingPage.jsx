import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HandHelping, ArrowRight } from "lucide-react";
import HowItWorks from "@/components/HowItWorks";
import TrustBadges from "@/components/TrustBadges";

export default function LandingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-16">
      {/* Hero */}
      <section className="text-center mb-12 md:mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#2D7A3E] mb-6">
          <HandHelping className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
          Trusted local help, on demand
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          Neighbourhood Labour Connect brings neighbours and local service providers together.
          Post a job, get offers from verified pros near you, and get it done — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/register" className="w-full sm:w-auto">
            <Button className="rounded-2xl bg-[#1A1F2E] hover:bg-[#2A2F45] h-12 px-8 w-full">
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="outline" className="rounded-2xl h-12 px-8 w-full">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* What it's about */}
      <section className="mb-12 md:mb-16">
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">What is Neighbourhood Labour Connect?</h2>
          <p className="text-muted-foreground leading-relaxed">
            It's a simple way to find trusted people for household, skilled, and emergency tasks —
            right in your neighbourhood. Whether you need a plumber, a cleaner, an electrician, or
            someone to help with a move, Neighbourhood Labour Connect matches you with local pros who are ready to help.
            No more asking around or settling for the first name you find. Read real reviews,
            compare offers, and choose the person who's right for you.
          </p>
        </div>
      </section>

      <TrustBadges />

      <HowItWorks />

      {/* Bottom CTA */}
      <section className="text-center bg-[#C9E8D8] rounded-3xl p-8 md:p-12">
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#2D7A3E] mb-3">
          Ready to get started?
        </h2>
        <p className="text-[#2D7A3E]/80 mb-6 max-w-md mx-auto">
          Join your neighbours and find trusted local help today.
        </p>
        <Link to="/register">
          <Button className="rounded-2xl bg-[#1A1F2E] hover:bg-[#2A2F45] h-12 px-8">
            Create an Account <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </section>
    </div>
  );
}