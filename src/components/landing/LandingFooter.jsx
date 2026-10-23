import React from "react";
import { Link } from "react-router-dom";

const LOGO_URL = "/icon.svg";

const LINK_COLUMNS = [
  [
    { label: "About Us", to: "/terms" },
    { label: "Contact", to: "/terms" },
    { label: "Careers", to: "/terms" },
  ],
  [
    { label: "Blog", to: "/terms" },
    { label: "FAQ", to: "/terms" },
    { label: "Customer Support", to: "/terms" },
  ],
  [
    { label: "Terms of Service", to: "/terms" },
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Refund Policy", to: "/refund" },
  ],
];

const SOCIALS = [
  { label: "f", name: "Facebook" },
  { label: "IG", name: "Instagram" },
  { label: "in", name: "LinkedIn" },
];

export default function LandingFooter() {
  return (
    <footer className="shrink-0 border-t border-border bg-background safe-area-bottom">
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand + social */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <img src={LOGO_URL} alt="Neighbourhood Labour Connect" className="w-7 h-7 rounded-lg object-cover" />
              <span className="font-display font-bold text-sm text-foreground">Neighbourhood Labour Connect</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Connecting communities with trusted local professionals across Africa.
            </p>
            <div className="flex items-center gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href="#"
                  aria-label={s.name}
                  className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground hover:bg-accent transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
          {/* Link columns */}
          {LINK_COLUMNS.map((col, ci) => (
            <div key={ci}>
              <ul className="space-y-2">
                {col.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-center text-[11px] text-muted-foreground mt-6">
          © {new Date().getFullYear()} Neighbourhood Labour Connect. All rights reserved.
        </p>
      </div>
    </footer>
  );
}