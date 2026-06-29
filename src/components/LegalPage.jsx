import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SafeAreaPage from "@/components/SafeAreaPage";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

// Standardized layout for Terms / Privacy / Refund.
// Consistent header, safe areas, readable content width, scrollable body,
// and a professional footer — publicly accessible without auth.
export default function LegalPage({ title, updated, children }) {
  const navigate = useNavigate();

  return (
    <SafeAreaPage>
      {/* Consistent header with branding + back navigation */}
      <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-3xl mx-auto w-full flex items-center gap-3 px-4 md:px-6 h-14">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-9 h-9 -ml-1 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img src={LOGO_URL} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
            <span className="font-display font-extrabold text-foreground text-sm truncate">
              Neighbourhood Labour Connect
            </span>
          </Link>
        </div>
      </header>

      {/* Scrollable, readable content */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-6 md:py-10">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-1.5">{title}</h1>
          {updated && <p className="text-xs text-muted-foreground mb-8">Last updated: {updated}</p>}
          <div className="space-y-6">{children}</div>
        </div>
      </main>

      {/* Professional footer */}
      <footer className="shrink-0 border-t border-border bg-background safe-area-bottom">
        <div className="max-w-3xl mx-auto w-full px-4 md:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] md:text-xs">
          <p className="text-muted-foreground">© {new Date().getFullYear()} Neighbourhood Labour Connect</p>
          <nav className="flex items-center gap-4">
            <Link to="/terms" className="font-semibold text-foreground hover:text-primary transition-colors">Terms</Link>
            <Link to="/privacy" className="font-semibold text-foreground hover:text-primary transition-colors">Privacy</Link>
            <Link to="/refund" className="font-semibold text-foreground hover:text-primary transition-colors">Refund</Link>
            <a href="https://wa.me/254706692111" target="_blank" rel="noreferrer" className="font-semibold text-foreground hover:text-primary transition-colors">Contact</a>
          </nav>
        </div>
      </footer>
    </SafeAreaPage>
  );
}

// Reusable section block for legal content.
export function LegalSection({ heading, children }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-foreground mb-2">{heading}</h2>
      <p className="text-muted-foreground leading-relaxed">{children}</p>
    </section>
  );
}