import React, { useState } from "react";
import { NavLink, useLocation, useOutlet, useNavigate, Link } from "react-router-dom";
import {
  Home, Briefcase, MessageCircle, Wallet, MoreHorizontal, ArrowLeft,
  Settings as SettingsIcon, LogOut, User, ChevronRight,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import OfflineBanner from "@/components/OfflineBanner";
import OnboardingPermissions from "@/components/OnboardingPermissions";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

// Primary navigation — these are the ONLY pages reachable from the bottom bar /
// sidebar, so they must NOT show a back arrow (you can't go "back" from home base).
const CUSTOMER_NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/jobs", label: "Jobs", icon: Briefcase, end: false },
  { to: "/messages", label: "Messages", icon: MessageCircle, end: false },
  { to: "/earnings", label: "Earnings", icon: Wallet, end: false },
];

// Providers: their job board is the home dashboard, so only Home (labelled Home).
const PROVIDER_NAV = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/messages", label: "Messages", icon: MessageCircle, end: false },
  { to: "/earnings", label: "Earnings", icon: Wallet, end: false },
];

// Pages where the header back arrow IS appropriate (secondary destinations).
const PRIMARY_PATHS = ["/", "/jobs", "/messages", "/earnings"];

function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="min-w-0 h-full flex flex-col"
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}

// Compact Profile shortcut — a quick view that sends you to /settings for
// the full account management (Profile, Notifications, Subscription, PIN,
// Admin Panel, Delete Account). Nothing duplicates the Settings page.
function MoreSheet({ open, onOpenChange, user, onLogout }) {
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl p-0 max-h-[85dvh] md:inset-x-auto md:inset-y-0 md:right-0 md:max-w-[460px] md:rounded-tl-xl">
        <SheetHeader className="px-5 pt-4 pb-3 text-left border-b border-border">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-accent flex items-center justify-center text-accent-foreground font-extrabold text-lg shrink-0">
              {user?.full_name?.[0] || <User className="w-5 h-5" />}
            </span>
            <div className="min-w-0">
              <SheetTitle className="text-base font-extrabold truncate">{user?.full_name || "Your account"}</SheetTitle>
              <p className="text-[11px] text-muted-foreground truncate">{user?.phone || user?.email}</p>
            </div>
          </div>
        </SheetHeader>
        <div className="px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-3">
          <Button
            onClick={() => { onOpenChange(false); navigate("/settings"); }}
            className="w-full rounded-2xl h-12 gap-2 text-sm font-semibold"
          >
            <SettingsIcon className="w-4 h-4" /> Go to Settings
          </Button>
          <button
            onClick={() => { onOpenChange(false); onLogout(); }}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-warning-soft/40 text-warning-soft-foreground text-sm font-semibold hover:bg-warning-soft/60 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Log out
          </button>
          <p className="text-center text-[11px] text-muted-foreground">
            All account settings · Neighbourhood Labour Connect
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const baseNav = user?.role === "provider" ? PROVIDER_NAV : CUSTOMER_NAV;
  const nav = [...baseNav, { more: true, label: "Profile", icon: MoreHorizontal }];

  const showBack = !PRIMARY_PATHS.includes(pathname);

  if (!user) {
    return (
      <div className="h-[100dvh] bg-background overflow-hidden flex flex-col">
        <OfflineBanner />
        <main className="min-w-0 flex-1 min-h-0 overflow-y-auto">
          <AnimatedOutlet />
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex overflow-hidden">
      {/* Desktop sidebar — fixed width, native desktop feel */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-card border-r border-border h-full pt-[env(safe-area-inset-top)] z-30">
        <Link to="/" className="flex items-center gap-3 px-5 h-16 shrink-0 border-b border-border">
          <img src={LOGO_URL} alt="Neighbourhood Labour Connect" className="w-9 h-9 rounded-xl object-cover shrink-0" />
          <span className="font-display font-extrabold text-foreground text-sm leading-tight">
            Neighbourhood<br />Labour Connect
          </span>
        </Link>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon, more, plain }, i) =>
            more ? (
              <button
                key="more"
                onClick={() => setMoreOpen(true)}
                className="w-full flex items-center gap-3 px-3 h-11 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm font-medium"
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{label}</span>
              </button>
            ) : plain ? (
              <button
                key={i}
                onClick={() => navigate(to)}
                className="w-full flex items-center gap-3 px-3 h-11 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm font-medium"
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{label}</span>
              </button>
            ) : (
              <NavLink
                key={to + i}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `relative flex items-center gap-3 px-3 h-11 rounded-xl transition-colors text-sm font-medium ${
                    isActive
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary" />}
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            )
          )}
        </nav>
        <div className="px-3 pb-4 shrink-0">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 h-11 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-hidden flex flex-col pt-[env(safe-area-inset-top)] pb-[calc(4.25rem+env(safe-area-inset-bottom))] md:pb-0">
        <OfflineBanner />
        <OnboardingPermissions />
        {/* Back-arrow bar only on secondary pages */}
        {showBack && (
          <div className="md:hidden shrink-0 flex items-center px-2 h-11 border-b border-border bg-background/90 backdrop-blur">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="flex items-center gap-1.5 h-8 px-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        )}
        <AnimatedOutlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur border-t border-border flex z-40 px-1 pb-[env(safe-area-inset-bottom)]">
        {nav.map(({ to, label, icon: Icon, more, plain }, i) => {
          const content = (
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
                {content}
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
                {content}
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
              {content}
            </NavLink>
          );
        })}
      </nav>

      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} user={user} onLogout={logout} />
    </div>
  );
}