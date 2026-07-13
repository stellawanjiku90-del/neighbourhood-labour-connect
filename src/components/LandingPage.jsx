import React from "react";
import ServiceMarquee from "@/components/ServiceMarquee";
import LogoHeader from "@/components/LogoHeader";
import LandingHero from "@/components/landing/LandingHero";
import HowItWorks from "@/components/landing/HowItWorks";
import TrustIndicators from "@/components/landing/TrustIndicators";
import ServiceStats from "@/components/landing/ServiceStats";
import WhyChooseUs from "@/components/landing/WhyChooseUs";
import LandingCategories from "@/components/landing/LandingCategories";
import LandingTestimonials from "@/components/landing/LandingTestimonials";
import LandingFooter from "@/components/landing/LandingFooter";

const ALL_SERVICES = [
  { label: "Hair Braiding", img: "https://images.unsplash.com/photo-1702236240794-58dc4c6895e5?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Carpentry", img: "https://images.unsplash.com/photo-1687422810663-c316494f725a?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Home Cleaning", img: "https://images.unsplash.com/photo-1755076347857-43a39490f08c?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Electrical", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Wall Painting", img: "https://images.unsplash.com/photo-1688372199140-cade7ae820fe?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Massage & Spa", img: "https://images.unsplash.com/photo-1677682693087-711e24efaa69?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Salon & Beauty", img: "https://images.unsplash.com/photo-1702236242829-a34c39814f31?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Plumbing & Repairs", img: "https://images.unsplash.com/photo-1728167087497-23d18400d6b9?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Floor Care", img: "https://images.unsplash.com/photo-1758273238698-c98a45a8df9a?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Construction", img: "https://images.unsplash.com/photo-1740825961434-e9287638592b?fm=jpg&q=80&w=600&auto=format&fit=crop" },
];

export default function LandingPage() {
  return (
    <div className="h-[100dvh] w-full bg-background flex flex-col safe-area-inset">
      <LogoHeader />

      <main className="flex-1 min-h-0 overflow-y-auto">
        <LandingHero />

        {/* Scrolling service photos */}
        <div className="my-3 md:my-4">
          <ServiceMarquee services={ALL_SERVICES} speed={55} />
        </div>

        <ServiceStats />
        <HowItWorks />
        <TrustIndicators />
        <WhyChooseUs />
        <LandingCategories />
        <LandingTestimonials />

        {/* SEO text */}
        <section className="px-4 md:px-8 pb-8 pt-2">
          <p className="text-xs text-muted-foreground max-w-3xl mx-auto text-center leading-relaxed">
            Neighbourhood Labour Connect is a location-based marketplace that helps you find jobs and hire professionals for local services across Africa. Whether you need electricians, plumbers, cleaners, tutors, carpenters, movers, drivers or beauty specialists, our platform connects you with verified professionals in your area. Post a job, receive competitive offers, chat securely, and pay with confidence — all in one app.
          </p>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}