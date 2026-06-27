import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

export default function LandingPage() {
  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-background flex flex-col safe-area-inset">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-100 bg-background/90 backdrop-blur safe-area-top">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-12 flex items-center gap-2">
          <img src={LOGO_URL} alt="Neighbourhood Labour Connect logo" className="w-7 h-7 rounded-full object-cover" />
          <span className="font-bold text-foreground text-sm md:text-base">Neighbourhood Labour Connect</span>
        </div>
      </header>

      {/* Hero — compact, centered */}
      <main className="flex-1 min-h-0 flex items-center justify-center px-4 md:px-6 py-4 md:py-6">
        <div className="w-full max-w-lg text-center">
          <span className="block text-[10px] md:text-xs font-semibold text-[#2D7A3E] uppercase tracking-widest mb-1.5">
            Neighbourhood Labour Connect
          </span>
          <h1 className="text-xl md:text-3xl font-extrabold text-foreground mb-1.5 leading-tight">
            Trusted local help, on demand
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mb-4 leading-relaxed max-w-md mx-auto">
            Connect with trusted local service providers or find your next job. Easy hiring, fair pricing, secure payments.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link to="/firebase-auth" className="w-full sm:w-auto">
              <Button className="rounded-xl bg-[#1A1F2E] hover:bg-[#2A2F45] h-10 px-6 w-full text-sm">
                Get Started <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
            <Link to="/firebase-auth" className="w-full sm:w-auto">
              <Button variant="outline" className="rounded-xl h-10 px-6 w-full text-sm">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Compact Footer */}
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