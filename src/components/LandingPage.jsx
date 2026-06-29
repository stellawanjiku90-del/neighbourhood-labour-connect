import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import ServiceMarquee from "@/components/ServiceMarquee";
import LogoHeader from "@/components/LogoHeader";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

// Real, African-context photography — Black African people performing each service
const ROW_1 = [
  { label: "Hair Braiding", img: "https://images.unsplash.com/photo-1702236240794-58dc4c6895e5?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Carpentry", img: "https://images.unsplash.com/photo-1687422810663-c316494f725a?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Home Cleaning", img: "https://images.unsplash.com/photo-1755076347857-43a39490f08c?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Electrical", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Wall Painting", img: "https://images.unsplash.com/photo-1688372199140-cade7ae820fe?fm=jpg&q=80&w=600&auto=format&fit=crop" },
];

const ROW_2 = [
  { label: "Massage & Spa", img: "https://images.unsplash.com/photo-1677682693087-711e24efaa69?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Salon & Beauty", img: "https://images.unsplash.com/photo-1702236242829-a34c39814f31?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Plumbing & Repairs", img: "https://images.unsplash.com/photo-1728167087497-23d18400d6b9?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Floor Care", img: "https://images.unsplash.com/photo-1758273238698-c98a45a8df9a?fm=jpg&q=80&w=600&auto=format&fit=crop" },
  { label: "Construction", img: "https://images.unsplash.com/photo-1740825961434-e9287638592b?fm=jpg&q=80&w=600&auto=format&fit=crop" },
];

export default function LandingPage() {
  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-background flex flex-col safe-area-inset">
      <LogoHeader />

      {/* Main — fills remaining space, no scroll */}
      <main className="flex-1 min-h-0 px-4 md:px-6 py-1">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          {/* Tagline — compact */}
          <div className="text-center shrink-0">
            <p className="font-display font-semibold text-primary text-xs md:text-lg">
              Trusted Local Help, on demand
            </p>
            <p className="text-xs md:text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-md mx-auto">
              Connect with trusted local service providers or find your next job. Easy hiring, fair pricing, secure payments.
            </p>
          </div>

          {/* Scrolling service photos — right-to-left marquee */}
          <div className="flex-1 min-h-0 flex flex-col justify-center gap-2 md:gap-3 my-2 md:my-3">
            <ServiceMarquee services={ROW_1} speed={45} />
            <ServiceMarquee services={ROW_2} speed={58} />
          </div>

          {/* CTAs */}
          <div className="shrink-0">
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
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
          </div>
        </div>
      </main>

      {/* Footer — tappable legal links */}
      <footer className="shrink-0 border-t border-border bg-background safe-area-bottom">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-2">
          <div className="flex items-center justify-center md:justify-between gap-4 text-[11px] md:text-xs">
            <p className="text-muted-foreground hidden md:block">
              © {new Date().getFullYear()} Neighbourhood Labour Connect
            </p>
            <Link to="/terms" className="inline-flex items-center font-semibold text-foreground hover:text-primary transition-colors underline underline-offset-4 decoration-border hover:decoration-primary">
              Terms of Service
            </Link>
            <Link to="/privacy" className="inline-flex items-center font-semibold text-foreground hover:text-primary transition-colors underline underline-offset-4 decoration-border hover:decoration-primary">
              Privacy Policy
            </Link>
            <Link to="/refund" className="inline-flex items-center font-semibold text-foreground hover:text-primary transition-colors underline underline-offset-4 decoration-border hover:decoration-primary">
              Refund Policy
            </Link>
            <p className="text-muted-foreground md:hidden">
              © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}