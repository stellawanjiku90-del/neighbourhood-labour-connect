import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import HowItWorks from "@/components/HowItWorks";
import TrustBadges from "@/components/TrustBadges";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header / nav bar with logo + app name */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center gap-3">
          <img src={LOGO_URL} alt="Neighbourhood Labour Connect logo" className="w-10 h-10 rounded-full object-cover" />
          <span className="font-extrabold text-foreground text-lg">Neighbourhood Labour Connect</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Hero */}
        <section className="text-center mb-12 md:mb-16">
          <img
            src={LOGO_URL}
            alt="Neighbourhood Labour Connect"
            className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover mx-auto mb-5"
          />
          <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-3 leading-tight">
            Neighbourhood Labour Connect
          </h1>
          <p className="text-lg md:text-xl font-semibold text-foreground mb-4">
            Trusted local help, on demand.
          </p>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
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
        </section>

        {/* About */}
        <section className="mb-12 md:mb-16">
          <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4">
              What is Neighbourhood Labour Connect?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Neighbourhood Labour Connect helps people find trusted local service providers
              quickly and easily. Whether you need a cleaner, plumber, electrician, barber,
              tutor, mover, driver, nanny, or other skilled professional, the platform connects
              you with nearby verified providers and allows you to compare offers, ratings, and
              reviews before hiring.
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
            Join your neighbours on Neighbourhood Labour Connect and find trusted local help today.
          </p>
          <Link to="/firebase-auth">
            <Button className="rounded-2xl bg-[#1A1F2E] hover:bg-[#2A2F45] h-12 px-8">
              Create an Account <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}