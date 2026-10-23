import React from "react";
import { Link } from "react-router-dom";

const POLICIES = [
  { label: "Terms of service", to: "/terms" },
  { label: "Privacy policy", to: "/privacy" },
  { label: "Refund policy", to: "/refund" },
];

export default function LandingFooter() {
  return (
    <footer className="shrink-0 border-t border-border bg-background safe-area-bottom">
      <div className="mx-auto max-w-[1320px] px-5 py-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Link to="/" className="mb-3 flex items-center gap-3">
              <img src="/icon.svg" alt="" className="h-9 w-9 rounded-xl object-cover" />
              <span className="font-display text-base font-bold text-foreground">Neighbourhood Labour Connect</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Connecting local customers with skilled professionals across Africa.
            </p>
          </div>

          <nav aria-label="Policies">
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {POLICIES.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-border pt-5">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Neighbourhood Labour Connect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}