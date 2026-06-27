import React from "react";
import { Outlet, NavLink, useLocation, useOutlet } from "react-router-dom";
import { Home, Search, PlusCircle, Briefcase, MessageCircle, Settings, Shield } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";

const LOGO_URL = "https://media.base44.com/images/public/6a3e0b9748b78301118f6853/d609d57e5_converted_image1.png";

const CUSTOMER_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/providers", label: "Find Help", icon: Search },
  { to: "/post", label: "Post Job", icon: PlusCircle },
  { to: "/jobs", label: "My Jobs", icon: Briefcase },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/settings", label: "Settings", icon: Settings },
];

const PROVIDER_NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/jobs", label: "Available Jobs", icon: Briefcase },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/settings", label: "Settings", icon: Settings },
];

const ADMIN_NAV = { to: "/admin", label: "Admin", icon: Shield };

function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="min-w-0 h-full flex flex-col"
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}

export default function Layout() {
  const { user } = useAuth();
  const BASE_NAV =
    user?.role === "provider" ? PROVIDER_NAV : CUSTOMER_NAV;
  const nav = user?.role === "admin" ? [...BASE_NAV, ADMIN_NAV] : BASE_NAV;

  if (!user) {
    return (
      <div className="h-[100dvh] bg-background overflow-hidden flex flex-col">
        <main className="min-w-0 flex-1 min-h-0 overflow-y-auto pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          <AnimatedOutlet />
        </main>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-background flex overflow-hidden">
      {/* Desktop lean-and-expand rail */}
      <aside className="hidden md:flex group flex-col w-20 hover:w-60 transition-all duration-300 bg-white border-r border-slate-100 h-full pt-[env(safe-area-inset-top)] overflow-hidden z-30">
        <div className="flex items-center gap-3 px-6 h-20 shrink-0">
          <img src={LOGO_URL} alt="Neighbourhood Labour Connect" className="w-9 h-9 rounded-full object-cover shrink-0" />
          <span className="font-extrabold text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Neighbourhood Labour Connect
          </span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => { if (window.location.pathname === to) window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className={({ isActive }) =>
                `flex items-center gap-4 px-3.5 h-12 rounded-2xl transition-colors ${
                  isActive
                    ? "bg-secondary text-secondary-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted"
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {label}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 overflow-hidden flex flex-col pt-[env(safe-area-inset-top)] pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <AnimatedOutlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 flex z-40 px-1 pb-[env(safe-area-inset-bottom)]">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={() => { if (window.location.pathname === to) window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 ${
                isActive ? "text-[#2D7A3E]" : "text-muted-foreground"
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}