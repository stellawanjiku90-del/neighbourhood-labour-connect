import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "Services", href: "#services" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Why Neighbourhood", href: "#why-neighbourhood" },
  { label: "Stories", href: "#stories" },
];

const navLinkClass = "whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-primary";

export default function LogoHeader() {
  return (
    <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur safe-area-top">
      <div className="max-w-[1320px] mx-auto px-5 md:px-10">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link to="/" className="flex min-w-0 shrink items-center gap-3">
            <img src="/icon.svg" alt="" className="h-9 w-9 shrink-0 rounded-xl object-cover" />
            <span className="truncate font-display text-sm font-bold tracking-tight text-foreground sm:text-base">
              Neighbourhood Labour Connect
            </span>
          </Link>

          <nav aria-label="Main menu" className="hidden items-center gap-6 lg:flex">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href} className={navLinkClass}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link to="/auth" className="rounded-lg px-2 py-2 text-sm font-semibold text-foreground transition-colors hover:text-primary sm:px-3">
              Sign in
            </Link>
            <Link to="/auth">
              <Button className="h-10 rounded-xl px-3 text-sm font-semibold sm:px-4">
                <span className="sm:hidden">Join</span>
                <span className="hidden sm:inline">Create account</span>
              </Button>
            </Link>
          </div>
        </div>

        <nav aria-label="Page sections" className="flex gap-6 overflow-x-auto pb-3 no-scrollbar lg:hidden">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} className={navLinkClass}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}