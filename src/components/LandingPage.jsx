import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, ShieldCheck, MapPin } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

const SERVICES = [
  {
    label: "Hair Braiding",
    img: "https://images.unsplash.com/photo-1757866332840-230be07b786e?fm=jpg&q=80&w=800&auto=format&fit=crop",
  },
  {
    label: "Massage Therapy",
    img: "https://plus.unsplash.com/premium_photo-1661729458610-3cba8e647031?fm=jpg&q=80&w=800&auto=format&fit=crop",
  },
  {
    label: "TV Mounting",
    img: "https://images.unsplash.com/photo-1521607630287-ee2e81ad3ced?fm=jpg&q=80&w=800&auto=format&fit=crop",
  },
];

export default function LandingPage() {
  return (
    <div className="h-[100dvh] w-full overflow-y-auto bg-background flex flex-col safe-area-inset">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-100 bg-background/90 backdrop-blur safe-area-top">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-12 flex items-center gap-2">
          <img src={LOGO_URL} alt="Neighbourhood Labour Connect logo" className="w-7 h-7 rounded-full object-cover" />
          <span className="font-display font-extrabold text-foreground text-sm md:text-base tracking-tight">
            Neighbourhood Labour Connect
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 min-h-0 px-4 md:px-6 py-6 md:py-10">
        <div className="max-w-5xl mx-auto">
          {/* Branding */}
          <div className="text-center mb-6 md:mb-8">
            <h1 className="font-display font-extrabold text-foreground text-2xl md:text-5xl leading-[1.05] tracking-tight">
              Neighbourhood Labour Connect
            </h1>
            <p className="font-display font-semibold text-[#2D7A3E] text-base md:text-xl mt-2 md:mt-3">
              Trusted Local Help, on demand
            </p>
            <p className="text-xs md:text-sm text-muted-foreground mt-2 md:mt-3 leading-relaxed max-w-md mx-auto">
              Connect with trusted local service providers or find your next job. Easy hiring, fair pricing, secure payments.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4 md:mt-6">
              <Link to="/firebase-auth" className="w-full sm:w-auto">
                <Button className="rounded-xl bg-[#1A1F2E] hover:bg-[#2A2F45] h-11 px-6 w-full text-sm font-semibold">
                  Get Started <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to="/firebase-auth" className="w-full sm:w-auto">
                <Button variant="outline" className="rounded-xl h-11 px-6 w-full text-sm font-semibold">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-4 text-[11px] md:text-xs text-muted-foreground">
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

          {/* Service photo grid — TaskRabbit / Uber style */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {SERVICES.map((s) => (
              <div
                key={s.label}
                className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-100 aspect-[4/5] sm:aspect-[3/4] group"
              >
                <img
                  src={s.img}
                  alt={s.label}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-3 md:p-4">
                  <span className="inline-block bg-white/95 text-foreground text-xs md:text-sm font-semibold px-2.5 py-1 rounded-full">
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-slate-100 bg-background safe-area-bottom">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
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