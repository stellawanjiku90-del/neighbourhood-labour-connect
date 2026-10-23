import React from "react";
import { NavLink, useLocation, useOutlet, useNavigate, Link } from "react-router-dom";
import {
  Home, Briefcase, MessageCircle, Wallet, ArrowLeft, Search,
  Settings as SettingsIcon, LogOut,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import OfflineBanner from "@/components/OfflineBanner";
import OnboardingPermissions from "@/components/OnboardingPermissions";
import NotificationsBell from "@/components/NotificationsBell";

const LOGO_URL = "/icon.svg";

// Keep each role's main tasks in the same place on desktop and mobile.
const CUSTOMER_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/providers", label: "Find help", icon: Search },
  { to: "/jobs", label: "My jobs", icon: Briefcase },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/earnings", label: "Wallet", icon: Wallet },
  { to: "/settings", label: "Profile", icon: SettingsIcon },
];

const PROVIDER_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/jobs", label: "Find jobs", icon: Briefcase },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/earnings", label: "Earnings", icon: Wallet },
  { to: "/settings", label: "Profile", icon: SettingsIcon },
];

// Main destinations do not need a back button.
const PRIMARY_PATHS = ["/", "/providers", "/jobs", "/messages", "/earnings", "/settings", "/subscribe"];

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


export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const nav = user?.role === "provider" ? PROVIDER_NAV : CUSTOMER_NAV;
  const mobileNav = nav.filter(({ to }) => to !== "/settings");

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
      <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-card border-r border-border h-full pt-safe-area-top z-30">
        <div className="flex items-center justify-between px-6 h-16 shrink-0 border-b border-border">
          <Link to="/" className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Neighbourhood Labour Connect" className="w-9 h-9 rounded-xl object-cover shrink-0" />
            <span className="font-display font-extrabold text-foreground text-sm leading-tight">
              Neighbourhood<br />Labour Connect
            </span>
          </Link>
          <NotificationsBell align="left" />
        </div>
        <nav aria-label="Primary navigation" className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
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
          ))}
        </nav>
        <div className="px-4 pb-5 shrink-0">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 h-11 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-hidden flex flex-col pb-[calc(4.25rem_+_env(safe-area-inset-bottom,0px))] lg:pb-0" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px))' }}>
        <OfflineBanner />
        <OnboardingPermissions />
        {/* Back-arrow bar only on secondary pages */}
        <div className="lg:hidden shrink-0 flex items-center justify-between px-2 h-11 border-b border-border bg-background/90 backdrop-blur safe-area-left safe-area-right">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="flex items-center gap-1.5 h-8 px-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <span className="w-9" />
          )}
          <div className="flex items-center gap-1">
            <NavLink
              to="/settings"
              aria-label="Profile and settings"
              title="Profile and settings"
              className={({ isActive }) => `flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${isActive ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <SettingsIcon className="h-4 w-4" />
            </NavLink>
            <NotificationsBell />
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden w-full">
          <AnimatedOutlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Primary navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 bg-card/95 backdrop-blur border-t border-border flex z-40 px-1 safe-area-left safe-area-right"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
      >
        {mobileNav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-3 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="whitespace-nowrap text-[10px] sm:text-xs font-medium leading-none">{label}</span>
          </NavLink>
        ))}
      </nav>

    </div>
  );
}