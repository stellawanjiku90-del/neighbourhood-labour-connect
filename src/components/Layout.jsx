import React from "react";
import { Outlet, NavLink, useLocation, useOutlet } from "react-router-dom";
import { Home, Search, PlusCircle, Briefcase, MessageCircle, Settings, HandHelping } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/providers", label: "Find Help", icon: Search },
  { to: "/post", label: "Post Job", icon: PlusCircle },
  { to: "/jobs", label: "My Jobs", icon: Briefcase },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/settings", label: "Settings", icon: Settings },
];

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
        className="min-w-0"
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}

export default function Layout() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop lean-and-expand rail */}
      <aside className="hidden md:flex group flex-col w-20 hover:w-60 transition-all duration-300 bg-white border-r border-slate-100 sticky top-0 h-screen overflow-hidden z-30">
        <div className="flex items-center gap-3 px-6 h-20 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#2D7A3E] flex items-center justify-center shrink-0">
            <HandHelping className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Labour Connect
          </span>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
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

      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <AnimatedOutlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 flex z-40 px-1 pb-[env(safe-area-inset-bottom)]">
        {NAV.map(({ to, label, icon: Icon }) => (
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