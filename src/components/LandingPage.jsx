import React from "react";
import LogoHeader from "@/components/LogoHeader";
import LandingHero from "@/components/landing/LandingHero";
import HowItWorks from "@/components/landing/HowItWorks";
import LandingCategories from "@/components/landing/LandingCategories";
import LandingFooter from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="flex h-[100dvh] w-full flex-col bg-background safe-area-inset">
      <LogoHeader />

      <main className="min-h-0 flex-1 overflow-y-auto scroll-smooth">
        <LandingHero />
        <div className="mx-auto max-w-[1320px]">
          <LandingCategories />
          <HowItWorks />
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
