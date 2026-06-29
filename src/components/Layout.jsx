import React, { useState } from "react";
import { Outlet, NavLink, useLocation, useOutlet, useNavigate } from "react-router-dom";
import { Home, Briefcase, MessageCircle, Wallet, MoreHorizontal, Search, Gift, Settings, Shield, LogOut, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import NavigationArrows from "@/components/NavigationArrows";
import OfflineBanner from "@/components/OfflineBanner";
import OnboardingPermissions from "@/components/OnboardingPermissions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

// Bottom bar: max 5 items. Home, Jobs, Messages, Earnings, More.
const CUSTOMER_NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/jobs", label: "Jobs", icon: Briefcase, end: false },
  { to: "/messages", label: "Messages", icon: MessageCircle, end: false },
  { to: "/earnings", label: "Earnings", icon: Wallet, end: false },
];

// Providers: their job board IS the home dashboard, so Jobs points home too
// (rendered as a plain button so it doesn't fight Home for the active state).
const PROVIDER_NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/", label: "Jobs", icon: Briefcase, end: true, plain: true },
  { to: "/messages", label: "Messages", icon: MessageCircle, end: false },
  { to: "/earnings", label: "Earnings", icon: Wallet, end: false },
];

function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="min-w-0 h-full flex flex-col"
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}

function MoreSheet({ open, onOpenChange, role, onLogout }) {
  const navigate = useNavigate();
  const go = (path) => {
    onOpenChange(false);
    if (path) navigate(path);
  };

  const groups = [
    {
      items: [
        ...(role === "customer" ? [{ icon: Search, label: "Find Help", to: "/providers" }] : []),
        { icon: Gift, label: "Refer & Earn", to: "/referrals" },
        { icon: Settings, label: "Settings", to: "/settings" },
      ],
    },
  ];

  if (role === "admin") {
    groups[0].items.push({ icon: Shield, label: "Admin Panel", to: "/admin" });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0">
        <SheetHeader className="px-5 pt-4 pb-2 text-left">
          <SheetTitle className="text-base font-extrabold">More</SheetTitle>
        </SheetHeader>
        <div className="px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-4 overflow-y-auto">
          {groups.map((g, gi) => (
            <div key={gi} className="bg-card rounded-2xl border border-border overflow-hidden">
              {g.items.map((item) => {
                const Icon = item.icon;
                return item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-4 h-14 border-b border-border last:border-0 hover:bg-muted transition-colors"
                  >
                    <span className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-accent-foreground" />
                    </span>
                    <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </a>
                ) : (
                  <button
                    key={item.label}
                    onClick={() => go(item.to)}
                    className="w-full flex items-center gap-3 px-4 h-14 border-b border-border last:border-0 hover:bg-muted transition-colors text-left"
                  >
                    <span className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-accent-foreground" />
                    </span>
                    <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          ))}
          <button
            onClick={() => { onOpenChange(false); onLogout(); }}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl border border-destructive/30 text-destructive text-sm font-semibold hover:bg-destructive/5 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const baseNav = user?.role === "provider" ? PROVIDER_NAV : CUSTOMER_NAV;
  const nav = [...baseNav, { more: true, label: "More", icon: MoreHorizontal }];

  if (!user) {
    return (
      <div className="h-[100dvh] bg-background overflow-hidden flex flex-col">
        <OfflineBanner />
        <div className="shrink-0 flex items-center px-3 h-11 border-b border-border bg-background/90 backdrop-blur pt-[env(safe-area-inset-top)]">
          <NavigationArrows />
        </div>
        <main className="min-w-0 flex-1 min-h-0 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
          <AnimatedOutlet />
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex overflow-hidden">
      {/* Desktop rail */}
      <aside className="hidden md:flex group flex-col w-20 hover:w-64 transition-all duration-300 bg-card border-r border-border h-full pt-[env(safe-area-inset-top)] overflow-hidden z-30">
        <div className="flex items-center gap-3 px-6 h-20 shrink-0">
          <img src={LOGO_URL} alt="Neighbourhood Labour Connect" className="w-9 h-9 rounded-xl object-cover shrink-0" />
          <span className="font-extrabold text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            NLC
          </span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map(({ to, label, icon: Icon, more, plain }, i) =>
            more ? (
              <button
                key="more"
                onClick={() => setMoreOpen(true)}
                className="w-full flex items-center gap-4 px-3.5 h-12 rounded-2xl text-muted-foreground hover:bg-muted transition-colors"
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{label}</span>
              </button>
            ) : plain ? (
              <button
                key={i}
                onClick={() => navigate(to)}
                className="w-full flex items-center gap-4 px-3.5 h-12 rounded-2xl text-muted-foreground hover:bg-muted transition-colors"
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{label}</span>
              </button>
            ) : (
              <NavLink
                key={to + i}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-3.5 h-12 rounded-2xl transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted"
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{label}</span>
              </NavLink>
            )
          )}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 overflow-hidden flex flex-col pt-[env(safe-area-inset-top)] pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
        <OfflineBanner />
        <OnboardingPermissions />
        <div className="shrink-0 flex items-center px-3 h-11 border-b border-border bg-background/90 backdrop-blur">
          <NavigationArrows />
        </div>
        <AnimatedOutlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur border-t border-border flex z-40 px-1 pb-[env(safe-area-inset-bottom)]">
        {nav.map(({ to, label, icon: Icon, more, plain }, i) => {
          const content = (isActive) => (
            <>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </>
          );
          if (more) {
            return (
              <button
                key="more"
                onClick={() => setMoreOpen(true)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-muted-foreground"
              >
                {content(false)}
              </button>
            );
          }
          if (plain) {
            return (
              <button
                key={i}
                onClick={() => navigate(to)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-muted-foreground"
              >
                {content(false)}
              </button>
            );
          }
          return (
            <NavLink
              key={to + i}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              {content()}
            </NavLink>
          );
        })}
      </nav>

      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} role={user?.role} onLogout={logout} />
    </div>
  );
}