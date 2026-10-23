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
      <div className="max-w-[1320px] mx-auto px-5 md:px-10 py-9 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
          {/* Brand + social */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <img src={LOGO_URL} alt="Neighbourhood Labour Connect" className="w-9 h-9 rounded-xl object-cover" />
              <span className="font-display font-bold text-sm text-foreground">Neighbourhood Labour Connect</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Connecting communities with trusted local professionals across Africa.
            </p>
            <div className="flex items-center gap-2">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href="#"
                  aria-label={s.name}
                  className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground hover:bg-accent transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>
          {/* Link columns */}
          {LINK_COLUMNS.map((col, ci) => (
            <div key={ci}>
              <ul className="space-y-3">
                {col.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()} Neighbourhood Labour Connect. All rights reserved.
        </p>
      </div>
    </footer>
  );
}