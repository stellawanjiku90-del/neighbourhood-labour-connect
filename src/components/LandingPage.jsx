import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, ShieldCheck, MapPin } from "lucide-react";
import ServiceMarquee from "@/components/ServiceMarquee";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

const ROW_1 = [
  { label: "Hair Braiding", img: "https://images.unsplash.com/photo-1757866332840-230be07b786e?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "TV Mounting", img: "https://images.unsplash.com/photo-1521607630287-ee2e81ad3ced?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Carpentry", img: "https://images.unsplash.com/photo-1505798577917-a65157d3320a?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Home Cleaning", img: "https://images.unsplash.com/photo-1686178827149-6d55c72d81df?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Electrical", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?fm=jpg&q=80&w=600&auto=format&fit=crop" },
];

const ROW_2 = [
  { label: "Massage Therapy", img: "https://plus.unsplash.com/premium_photo-1661729458610-3cba8e647031?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Plumbing", img: "https://plus.unsplash.com/premium_photo-1661884973994-d7625e52631a?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "AC & HVAC", img: "https://plus.unsplash.com/premium_photo-1683134512538-7b390d0adc9e?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Handyman", img: "https://images.unsplash.com/photo-1676311396794-f14881e9daaa?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Floor Care", img: "https://images.unsplash.com/photo-1740657254989-42fe9c3b8cce?fm=jpg&q=80&w=600&auto=format&fit=crop" },
];

export default function LandingPage() {
  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-background flex flex-col safe-area-inset">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-100 bg-background/90 backdrop-blur safe-area-top">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-12 flex items-center gap-2">
          <img src={LOGO_URL} alt="Neighbourhood Labour Connect logo" className="w-7 h-7 rounded-full object-cover" />
          <span className="font-display font-extrabold text-foreground text-sm md:text-base tracking-tight">
            Neighbourhood Labour Connect
          </span>
        </div>
      </header>

      {/* Main — fills remaining space, no scroll */}
      <main className="flex-1 min-h-0 px-4 md:px-6 py-2 md:py-5">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          {/* Branding */}
          <div className="text-center shrink-0">
            <h1 className="font-display font-extrabold text-foreground text-lg md:text-4xl leading-[1.1] tracking-tight">
              Neighbourhood Labour Connect
            </h1>
            <p className="font-display font-semibold text-[#2D7A3E] text-xs md:text-lg mt-0.5 md:mt-2">
              Trusted Local Help, on demand
            </p>
            <p className="hidden sm:block text-xs md:text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-md mx-auto">
              Connect with trusted local service providers or find your next job. Easy hiring, fair pricing, secure payments.
            </p>
          </div>

          {/* Scrolling service photos — right-to-left marquee, no congestion */}
          <div className="flex-1 min-h-0 flex flex-col justify-center gap-3 md:gap-4 my-2 md:my-4">
            <ServiceMarquee services={ROW_1} speed={45} />
            <ServiceMarquee services={ROW_2} speed={58} />
          </div>

          {/* CTAs + trust */}
          <div className="shrink-0">
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link to="/firebase-auth" className="w-full sm:w-auto">
                <Button className="rounded-xl bg-[#1A1F2E] hover:bg-[#2A2F45] h-10 px-6 w-full text-sm font-semibold">
                  Get Started <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to="/firebase-auth" className="w-full sm:w-auto">
                <Button variant="outline" className="rounded-xl h-10 px-6 w-full text-sm font-semibold">
                  Sign In
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-2 text-[11px] md:text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-[#2D7A3E] fill-[#2D7A3E]" /> Rated providers
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2D7A3E]" /> Verified pros
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#2D7A3E]" /> Near you
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-slate-100 bg-background safe-area-bottom">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-2">
          <div className="flex flex-col md:flex-row items-center justify-between gap-1">
            <p className="text-[10px] md:text-xs text-muted-foreground">
              © {new Date().getFullYear()} Neighbourhood Labour Connect
            </p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] md:text-xs text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link to="/refund" className="hover:text-foreground">Refund</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}